import {
  type PaymentInfo,
  determinePurchaseType,
  formatAmount,
  processPayment
} from '@/lib/payments'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeClient
}

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Extracts payment info from a Stripe Checkout Session
 */
function extractFromCheckoutSession(
  session: Stripe.Checkout.Session
): PaymentInfo {
  const customerEmail =
    session.customer_email || session.customer_details?.email || null
  const customerName = session.customer_details?.name || null

  // Use payment_intent as transaction ID, fallback to session ID
  const transactionId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id

  // Format the amount (use != null to handle zero-amount transactions like free trials)
  const amount =
    session.amount_total != null && session.currency
      ? formatAmount(session.amount_total, session.currency)
      : null

  // Determine purchase type from metadata or line items description
  let purchaseType = determinePurchaseType(
    (session.metadata?.product as string) || ''
  )

  // If not found in metadata, check session description or custom fields
  if (purchaseType === 'other') {
    const description =
      session.metadata?.description ||
      session.custom_fields?.map((f) => f.text?.value)?.join(' ') ||
      ''
    purchaseType = determinePurchaseType(description)
  }

  return {
    buyerEmail: customerEmail,
    buyerName: customerName,
    transactionId,
    amount,
    purchaseType
  }
}

/**
 * Extracts payment info from a Stripe Charge
 * May fetch customer data if email not available on charge
 * Handles Stripe Connect payments (e.g. Polymart) where email is in metadata
 */
async function extractFromCharge(charge: Stripe.Charge): Promise<PaymentInfo> {
  let customerEmail = charge.billing_details?.email || charge.receipt_email
  let customerName = charge.billing_details?.name || null
  let isPolymart = false

  // For Stripe Connect payments (e.g. Polymart), email may be in metadata as JSON
  if (!customerEmail && charge.metadata?.['Billing Details']) {
    try {
      const billingDetails = JSON.parse(charge.metadata['Billing Details'])
      customerEmail = billingDetails.email || null
      customerName = customerName || billingDetails.name || null
      isPolymart = true
    } catch {
      console.error('[stripe] Failed to parse Billing Details metadata')
    }
  }

  // Also detect Polymart by checking for their specific metadata pattern
  if (charge.metadata?.['Payment Intent'] || charge.metadata?.['Billing Details']) {
    isPolymart = true
  }

  // If still no email, try to fetch from customer
  if (!customerEmail && charge.customer) {
    try {
      const customerId =
        typeof charge.customer === 'string'
          ? charge.customer
          : charge.customer.id
      const customer = await getStripe().customers.retrieve(customerId)
      if ('email' in customer) {
        customerEmail = customer.email || null
        customerName = customerName || customer.name || null
      }
    } catch (err) {
      console.error('[stripe] Failed to fetch customer:', err)
    }
  }

  // For Stripe Connect, payment_intent may be null - use charge.id as fallback
  // Also check metadata for Payment Intent (Polymart stores it there)
  const transactionId = charge.payment_intent
    ? typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent.id
    : (charge.metadata?.['Payment Intent'] as string) || charge.id

  const amount = formatAmount(charge.amount, charge.currency)

  // Determine purchase type from charge description or metadata
  const purchaseType = determinePurchaseType(
    (charge.metadata?.product as string) || charge.description || ''
  )

  return {
    buyerEmail: customerEmail || null,
    buyerName: customerName,
    transactionId,
    amount,
    purchaseType,
    platform: isPolymart ? 'polymart' : 'spigot'
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!WEBHOOK_SECRET) {
    console.error('[stripe] Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe] Webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  let paymentInfo: PaymentInfo | null = null
  let metadata: Record<string, unknown> = {}

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Only process completed payments
      if (session.payment_status !== 'paid') {
        return NextResponse.json({
          received: true,
          skipped: true,
          reason: 'Payment not completed'
        })
      }

      paymentInfo = extractFromCheckoutSession(session)
      metadata = {
        event_id: event.id,
        event_type: event.type,
        session_id: session.id,
        payment_intent:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id,
        customer_id:
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id,
        mode: session.mode
      }
      break
    }

    case 'charge.succeeded':
    case 'charge.updated':
    case 'charge.captured': {
      const charge = event.data.object as Stripe.Charge

      // Only process if the charge actually succeeded and is paid
      // This handles Stripe Connect payments (e.g. Polymart) which may send
      // charge.updated instead of charge.succeeded
      if (charge.status !== 'succeeded' || !charge.paid) {
        return NextResponse.json({
          received: true,
          skipped: true,
          reason: `Charge not succeeded (status: ${charge.status}, paid: ${charge.paid})`
        })
      }

      paymentInfo = await extractFromCharge(charge)
      metadata = {
        event_id: event.id,
        event_type: event.type,
        charge_id: charge.id,
        payment_intent:
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id,
        customer_id:
          typeof charge.customer === 'string'
            ? charge.customer
            : charge.customer?.id
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Extract customer email from payment intent
      let customerEmail: string | null = null
      let customerName: string | null = null

      // Try to get email from customer if available
      if (paymentIntent.customer) {
        try {
          const customerId =
            typeof paymentIntent.customer === 'string'
              ? paymentIntent.customer
              : paymentIntent.customer.id
          const customer = await getStripe().customers.retrieve(customerId)
          if ('email' in customer) {
            customerEmail = customer.email || null
            customerName = customer.name || null
          }
        } catch (err) {
          console.error('[stripe] Failed to fetch customer:', err)
        }
      }

      // Get email from receipt_email if not from customer
      customerEmail = customerEmail || paymentIntent.receipt_email || null

      const amount = formatAmount(paymentIntent.amount, paymentIntent.currency)
      const purchaseType = determinePurchaseType(
        (paymentIntent.metadata?.product as string) ||
          paymentIntent.description ||
          ''
      )

      paymentInfo = {
        buyerEmail: customerEmail,
        buyerName: customerName,
        transactionId: paymentIntent.id,
        amount,
        purchaseType
      }

      metadata = {
        event_id: event.id,
        event_type: event.type,
        payment_intent: paymentIntent.id,
        customer_id:
          typeof paymentIntent.customer === 'string'
            ? paymentIntent.customer
            : paymentIntent.customer?.id
      }
      break
    }

    default:
      // Acknowledge receipt of other events without processing
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: `Unhandled event type: ${event.type}`
      })
  }

  if (!paymentInfo) {
    return NextResponse.json({
      received: true,
      skipped: true,
      reason: 'No payment info extracted'
    })
  }

  const result = await processPayment(paymentInfo, metadata, 'stripe')

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    received: true,
    duplicate: result.duplicate,
    parsed: result.parsed,
    emailSent: result.emailSent
  })
}
