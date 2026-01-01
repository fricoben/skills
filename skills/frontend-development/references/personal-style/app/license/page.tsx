import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { LicenseClient } from './license-client'

export const metadata = {
  title: 'Claim Your License',
  robots: 'noindex, nofollow'
}

export default async function LicensePage({
  searchParams
}: {
  searchParams: Promise<{ txid?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  let profile = null
  let licenses: Array<{
    id: string
    license_type: string
    is_active: boolean
    metadata: Record<string, unknown>
    created_at: string
  }> = []
  let unclaimedPayment = null

  if (user) {
    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData

    // Get licenses
    const { data: licensesData } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    licenses = licensesData || []

    // Check for unclaimed payment by txid or email (use admin client to bypass RLS)
    const admin = getSupabaseAdmin()

    if (params.txid) {
      // SECURITY NOTE: We intentionally allow any authenticated user with a valid txid to claim the payment.
      // The transaction ID acts like a voucher code - possession grants claim rights. This is acceptable because:
      // 1. Transaction IDs are only sent to the buyer's email (via thank-you email with claim link)
      // 2. They are random PayPal/Stripe-generated strings, not guessable
      // 3. Once claimed, the payment cannot be claimed again (claimed_by is set)
      // This enables gift purchases and transfers - the buyer can share their link with the recipient.

      // Check PayPal payments first
      const { data: paypalPayment } = await admin
        .from('paypal_payments')
        .select('*')
        .eq('transaction_id', params.txid)
        .is('claimed_by', null)
        .single()

      if (paypalPayment) {
        unclaimedPayment = {
          ...paypalPayment,
          payment_source: 'paypal' as const
        }
      } else {
        // Check Stripe payments if not found in PayPal
        const { data: stripePayment } = await admin
          .from('stripe_payments')
          .select('*')
          .eq('transaction_id', params.txid)
          .is('claimed_by', null)
          .single()
        if (stripePayment) {
          unclaimedPayment = {
            ...stripePayment,
            payment_source: 'stripe' as const
          }
        }
      }
    }

    // Also check by email if no txid match - only show payments matching user's email
    if (!unclaimedPayment && user.email) {
      // Check PayPal first
      const { data: paypalPayment } = await admin
        .from('paypal_payments')
        .select('*')
        .eq('buyer_email', user.email)
        .is('claimed_by', null)
        .neq('purchase_type', 'other')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (paypalPayment) {
        unclaimedPayment = {
          ...paypalPayment,
          payment_source: 'paypal' as const
        }
      } else {
        // Check Stripe if not found in PayPal
        const { data: stripePayment } = await admin
          .from('stripe_payments')
          .select('*')
          .eq('buyer_email', user.email)
          .is('claimed_by', null)
          .neq('purchase_type', 'other')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (stripePayment) {
          unclaimedPayment = {
            ...stripePayment,
            payment_source: 'stripe' as const
          }
        }
      }
    }
  }

  return (
    <LicenseClient
      user={user}
      profile={profile}
      licenses={licenses}
      unclaimedPayment={unclaimedPayment}
      txid={params.txid}
      error={params.error}
    />
  )
}
