import { getSupabaseAdmin } from '@/lib/supabase'
import { purchaseFollowupWorkflow } from '@/app/workflows/purchase-followup'
import { start } from 'workflow/api'
import { NextRequest, NextResponse } from 'next/server'

type PaymentSource = 'paypal' | 'stripe'

type PaymentRow = {
  buyer_email: string | null
  buyer_name: string | null
  purchase_type: string | null
  transaction_id: string | null
  purchased_at: string | null
  thank_you_email_sent_at: string | null
  followup_email_sent_at: string | null
  metadata?: Record<string, unknown> | null
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function computeDelayMs(thankYouOrPurchaseAtIso: string): number {
  const baselineMs = new Date(thankYouOrPurchaseAtIso).getTime()
  if (!Number.isFinite(baselineMs)) return 0
  const followupAtMs = baselineMs + ONE_WEEK_MS
  const remaining = followupAtMs - Date.now()
  return Math.max(0, remaining)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.nextUrl.searchParams.get('secret')
  const expected = process.env.FOLLOWUP_BACKFILL_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(
    500,
    Math.max(1, Number.isFinite(Number(limitParam)) ? Number(limitParam) : 200)
  )

  const admin = getSupabaseAdmin()

  const [stripe, paypal] = await Promise.all([
    admin
      .from('stripe_payments')
      .select(
        'buyer_email,buyer_name,purchase_type,transaction_id,purchased_at,thank_you_email_sent_at,followup_email_sent_at,metadata'
      )
      .not('buyer_email', 'is', null)
      .is('followup_email_sent_at', null)
      // Backfill targets rows created before we started tracking/scheduling
      .is('thank_you_email_sent_at', null)
      .neq('purchase_type', 'other')
      .order('purchased_at', { ascending: true })
      .limit(limit),
    admin
      .from('paypal_payments')
      .select(
        'buyer_email,buyer_name,purchase_type,transaction_id,purchased_at,thank_you_email_sent_at,followup_email_sent_at,metadata'
      )
      .not('buyer_email', 'is', null)
      .is('followup_email_sent_at', null)
      // Backfill targets rows created before we started tracking/scheduling
      .is('thank_you_email_sent_at', null)
      .neq('purchase_type', 'other')
      .order('purchased_at', { ascending: true })
      .limit(limit)
  ])

  if (stripe.error || paypal.error) {
    console.error(
      'Follow-up backfill query errors:',
      stripe.error,
      paypal.error
    )
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const candidates: Array<{ source: PaymentSource; row: PaymentRow }> = [
    ...((stripe.data || []) as PaymentRow[]).map((row) => ({
      source: 'stripe' as const,
      row
    })),
    ...((paypal.data || []) as PaymentRow[]).map((row) => ({
      source: 'paypal' as const,
      row
    }))
  ]

  let considered = 0
  let scheduled = 0
  let skippedMissingFields = 0
  let failed = 0

  const runIds: string[] = []

  for (const { source, row } of candidates) {
    considered += 1

    const buyerEmail = row.buyer_email
    const transactionId = row.transaction_id
    const purchaseType = row.purchase_type as string | null
    const purchasedAt = row.purchased_at

    if (!buyerEmail || !transactionId || !purchaseType || !purchasedAt) {
      skippedMissingFields += 1
      continue
    }

    if (purchaseType !== 'oraxen' && purchaseType !== 'hackedserver') {
      skippedMissingFields += 1
      continue
    }

    // Backfill a reasonable approximation for "when the thank-you email was sent".
    // For historical rows we only have purchased_at.
    const table = source === 'stripe' ? 'stripe_payments' : 'paypal_payments'
    const { error: markThankYouError } = await admin
      .from(table)
      .update({
        thank_you_email_sent_at: purchasedAt
      })
      .eq('transaction_id', transactionId)
      .is('thank_you_email_sent_at', null)

    if (markThankYouError) {
      console.error(
        'Follow-up backfill: failed to backfill thank_you_email_sent_at',
        {
          source,
          transactionId,
          error: markThankYouError
        }
      )
      failed += 1
      continue
    }

    // Schedule follow-up at purchased_at + 7d (send immediately if already past due).
    const delayMs = computeDelayMs(purchasedAt)

    try {
      const run = await start(purchaseFollowupWorkflow, [
        {
          buyerEmail,
          buyerName: row.buyer_name || 'there',
          purchaseType,
          source,
          transactionId,
          delayMs
        }
      ])
      scheduled += 1
      runIds.push(run.runId)
    } catch (e) {
      console.error('Follow-up backfill: failed to start workflow', {
        source,
        transactionId,
        error: e
      })
      failed += 1
    }
  }

  return NextResponse.json({
    ok: true,
    limit,
    counts: { considered, scheduled, skippedMissingFields, failed },
    runIds
  })
}
