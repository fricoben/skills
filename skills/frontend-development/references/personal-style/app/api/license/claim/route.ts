import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  addMemberRole,
  getDiscordIdFromIdentities,
  getDiscordRoleForLicenseType
} from '@/lib/discord'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = getSupabaseAdmin()

  // Get user from session
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { paymentId, paymentSource } = await req.json()

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
  }

  if (!paymentSource || !['paypal', 'stripe'].includes(paymentSource)) {
    return NextResponse.json(
      { error: 'Valid payment source required' },
      { status: 400 }
    )
  }

  // Atomically claim the payment - prevents race conditions
  // UPDATE only succeeds if claimed_by is still null (database-level atomicity)
  //
  // IMPORTANT: We require `paymentSource` from the client to avoid ID collisions.
  // Both tables use auto-incrementing integer IDs, so without the source param,
  // a user could accidentally claim a payment from the wrong table if both have
  // a record with the same numeric ID. The client knows which table the payment
  // originates from (determined server-side in page.tsx) and passes it here.
  //
  // Note: Even if paymentSource were missing, transaction_id formats differ
  // (PayPal: "5TY123456AB789012", Stripe: "pi_3ABC...") which would prevent
  // claiming the wrong product, but relying on format detection is fragile.
  const table =
    paymentSource === 'stripe' ? 'stripe_payments' : 'paypal_payments'

  const { data: payment, error: claimError } = await admin
    .from(table)
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString()
    })
    .eq('id', paymentId)
    .is('claimed_by', null)
    .select()
    .single()

  if (claimError) {
    // PGRST116 = "No rows returned" - expected when payment doesn't exist or was already claimed
    // Any other error is an actual database/infrastructure issue
    if (claimError.code !== 'PGRST116') {
      console.error('Database error during payment claim:', claimError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    // Payment not found or already claimed
    return NextResponse.json(
      { error: 'Payment not found or already claimed' },
      { status: 404 }
    )
  }

  if (!payment) {
    // Safety check - should not happen if no error, but be defensive
    return NextResponse.json(
      { error: 'Payment not found or already claimed' },
      { status: 404 }
    )
  }

  // Now we have exclusive ownership of this payment
  // Check if license already exists for this transaction_id (idempotency for partial failures)
  if (payment.transaction_id) {
    const { data: existingLicense } = await admin
      .from('licenses')
      .select('id')
      .contains('metadata', { transaction_id: payment.transaction_id })
      .single()

    if (existingLicense) {
      // License already exists - payment is now claimed, just return conflict
      return NextResponse.json(
        { error: 'License already exists for this transaction' },
        { status: 409 }
      )
    }
  }

  // Ensure profile exists
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create profile if it doesn't exist
    const { error: profileError } = await admin.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }
  }

  // Create license
  const licenseType = payment.purchase_type

  const { error: licenseError } = await admin.from('licenses').insert({
    user_id: user.id,
    license_type: licenseType,
    is_active: true,
    metadata: {
      transaction_id: payment.transaction_id,
      buyer_email: payment.buyer_email,
      buyer_name: payment.buyer_name,
      amount: payment.amount,
      payment_source: paymentSource,
      claimed_at: new Date().toISOString()
    }
  })

  if (licenseError) {
    console.error('License creation error:', licenseError)
    // Payment is already claimed, so this is a partial failure state
    // The cleanup endpoint can handle orphaned claims
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    )
  }

  // Add Discord role if user has Discord connected
  const discordId = getDiscordIdFromIdentities(user.identities)
  if (discordId) {
    const roleId = getDiscordRoleForLicenseType(licenseType)
    if (roleId) {
      const roleResult = await addMemberRole(discordId, roleId)
      if (!roleResult.success) {
        console.error('Failed to add Discord role:', roleResult.error)
        // Don't fail the request - license was created successfully
      }
    }
  }

  return NextResponse.json({ success: true })
}
