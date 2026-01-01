import {
  type PaymentInfo,
  type PurchaseType,
  determinePurchaseType,
  processPayment
} from '@/lib/payments'
import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_SECRET = process.env.PAYPAL_WEBHOOK_SECRET

/**
 * Detects the marketplace platform from email content
 * Polymart descriptions contain "Polymart |"
 */
function detectPlatform(text: string): 'polymart' | 'spigot' {
  // Polymart format: "Polymart | ☄️ Oraxen | USERNAME"
  if (/polymart\s*\|/i.test(text)) {
    return 'polymart'
  }
  // Default to spigot for SpigotMC purchases
  return 'spigot'
}

/**
 * Extracts the marketplace username from the product description
 * Polymart format: "Polymart | ☄️ Oraxen ... | USERNAME" or "Polymart | ☄️ Oraxen ... (USERNAME"
 * Spigot format: "Purchase Resource: ☄️ Oraxen ... (USERNAME"
 */
function extractMarketplaceUsername(text: string): string | null {
  // Polymart format with pipe: "Polymart | Product Name | USERNAME" followed by price/newline
  // The username is typically the last segment before price or at end of description line
  const polymartPipePattern =
    /Polymart\s*\|[^|]+\|\s*([A-Za-z0-9_.-]+)\s*(?:€|\$|£|\n|$)/i
  const polymartMatch = text.match(polymartPipePattern)
  if (polymartMatch) {
    return polymartMatch[1].trim()
  }

  // Polymart/Spigot format with parentheses: "Product Name (USERNAME"
  // Look for username in parentheses before price
  const parenPattern =
    /(?:Polymart|Purchase\s+Resource)[^(]+\(([A-Za-z0-9_.-]+)/i
  const parenMatch = text.match(parenPattern)
  if (parenMatch) {
    const candidate = parenMatch[1].trim()
    // Ensure it's not an email
    if (!candidate.includes('@') && candidate.length < 50) {
      return candidate
    }
  }

  return null
}

function extractPaymentInfo(body: string): PaymentInfo {
  let buyerEmail: string | null = null
  let buyerName: string | null = null
  let transactionId: string | null = null
  let amount: string | null = null

  // Normalize line endings
  const text = body.replace(/\r\n/g, '\n')

  // Determine purchase type
  const purchaseType: PurchaseType = determinePurchaseType(text)

  // Detect platform (Polymart vs Spigot)
  const platform = detectPlatform(text)

  // ============================================
  // EXTRACT BUYER EMAIL AND NAME
  // ============================================

  // Pattern 1: French - "paiement de €X EUR de Name (email)"
  const frenchPattern =
    /paiement de ([€$£]?[\d,.\s]+\w{3})\s+de\s+(.+?)\s*\(([^)]+@[^)]+)\)/i
  const frenchMatch = text.match(frenchPattern)
  if (frenchMatch) {
    amount = frenchMatch[1].trim()
    buyerName = frenchMatch[2].trim()
    buyerEmail = frenchMatch[3].trim()
  }

  // Pattern 2: English - "payment of €X EUR from Name (email)"
  if (!buyerEmail) {
    const englishPattern =
      /payment of ([€$£]?[\d,.\s]+\w{3})\s+from\s+(.+?)\s*\(([^)]+@[^)]+)\)/i
    const englishMatch = text.match(englishPattern)
    if (englishMatch) {
      amount = englishMatch[1].trim()
      buyerName = englishMatch[2].trim()
      buyerEmail = englishMatch[3].trim()
    }
  }

  // Pattern 3: English alternative - "received a payment of €X EUR from Name (email)"
  if (!buyerEmail) {
    const receivedPattern =
      /received a payment of ([€$£]?[\d,.\s]+\w{3})\s+from\s+(.+?)\s*\(([^)]+@[^)]+)\)/i
    const receivedMatch = text.match(receivedPattern)
    if (receivedMatch) {
      amount = receivedMatch[1].trim()
      buyerName = receivedMatch[2].trim()
      buyerEmail = receivedMatch[3].trim()
    }
  }

  // Fallback: Extract from Buyer/Acheteur section
  // French: "Acheteur\nName\nemail"
  // English: "Buyer\nName\nemail"
  if (!buyerEmail) {
    const buyerSectionPattern =
      /\*?(?:Acheteur|Buyer)\*?\s*\n\s*([^\n]+)\s*\n\s*([^\s\n]+@[^\s\n]+)/i
    const buyerMatch = text.match(buyerSectionPattern)
    if (buyerMatch) {
      buyerName = buyerMatch[1].trim()
      buyerEmail = buyerMatch[2].trim()
    }
  }

  // ============================================
  // EXTRACT TRANSACTION ID
  // ============================================

  // French: "Numéro de transaction\nXXX"
  // English: "Transaction ID\nXXX"
  const txPattern =
    /\*?(?:Numéro de transaction|Transaction ID|Transaction number)\*?\s*\n\s*([A-Z0-9]+)/i
  const txMatch = text.match(txPattern)
  if (txMatch) {
    transactionId = txMatch[1].trim()
  }

  // ============================================
  // EXTRACT AMOUNT (fallback)
  // ============================================

  if (!amount) {
    // Try Total line
    const totalPattern = /\*?Total\*?\s+([€$£]?[\d,.\s]+\w{3})/i
    const totalMatch = text.match(totalPattern)
    if (totalMatch) {
      amount = totalMatch[1].trim()
    }
  }

  if (!amount) {
    // Try Subtotal line
    const subtotalPattern = /Subtotal\s+([€$£]?[\d,.\s]+\w{3})/i
    const subtotalMatch = text.match(subtotalPattern)
    if (subtotalMatch) {
      amount = subtotalMatch[1].trim()
    }
  }

  // ============================================
  // EXTRACT MARKETPLACE USERNAME
  // ============================================

  const marketplaceUsername = extractMarketplaceUsername(text)

  // If we have a marketplace username and buyer name looks like it came from PayPal
  // (real name), we can store the username in metadata. But if buyerName is missing
  // or looks like the email prefix, use the marketplace username instead.
  if (marketplaceUsername) {
    if (!buyerName || buyerName === buyerEmail?.split('@')[0]) {
      buyerName = marketplaceUsername
    }
  }

  return {
    buyerEmail,
    buyerName,
    transactionId,
    amount,
    purchaseType,
    platform
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.nextUrl.searchParams.get('secret')

  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { body?: string; from?: string; sender?: string }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const body = payload.body || ''
  const paymentInfo = extractPaymentInfo(body)

  // Log for debugging (remove in production if too noisy)
  console.log('[paypal-webhook] Parsed payment info:', {
    email: paymentInfo.buyerEmail,
    name: paymentInfo.buyerName,
    txId: paymentInfo.transactionId,
    amount: paymentInfo.amount,
    type: paymentInfo.purchaseType,
    platform: paymentInfo.platform
  })

  // Process payment synchronously - this sends the thank-you email and stores the payment
  const result = await processPayment(paymentInfo, payload, 'paypal')

  if (!result.success) {
    return NextResponse.json(
      { error: 'Payment processing failed', parsed: paymentInfo },
      { status: 500 }
    )
  }

  return NextResponse.json({
    received: true,
    parsed: paymentInfo,
    processed: result
  })
}
