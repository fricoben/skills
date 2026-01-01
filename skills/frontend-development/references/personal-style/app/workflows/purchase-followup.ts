import { RetryableError, sleep } from 'workflow'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOneWeekFollowUpEmail } from '@/lib/email-templates'
import { sendEmail } from '@/lib/email'

export type FollowupWorkflowInput = {
  buyerEmail: string
  buyerName: string
  purchaseType: 'oraxen' | 'hackedserver'
  source: 'paypal' | 'stripe'
  transactionId: string
  platform?: 'polymart' | 'spigot'
  /**
   * How long to wait before checking registration + sending the follow-up.
   * This makes it possible to backfill older purchases without waiting an extra week.
   */
  delayMs: number
}

async function isRegisteredByEmail(email: string): Promise<boolean> {
  'use step'

  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (error) {
    throw new RetryableError(
      `Profile lookup failed: ${error.message || 'unknown error'}`
    )
  }

  return (data || []).length > 0
}

async function hasFollowupAlreadyBeenSent(
  input: FollowupWorkflowInput
): Promise<boolean> {
  'use step'

  const admin = getSupabaseAdmin()
  const table =
    input.source === 'stripe' ? 'stripe_payments' : 'paypal_payments'

  const { data, error } = await admin
    .from(table)
    .select('followup_email_sent_at')
    .eq('transaction_id', input.transactionId)
    .maybeSingle()

  if (error) {
    throw new RetryableError(
      `Follow-up status lookup failed: ${error.message || 'unknown error'}`
    )
  }

  return Boolean(data?.followup_email_sent_at)
}

async function markFollowupSent(
  input: FollowupWorkflowInput,
  messageId?: string
): Promise<void> {
  'use step'

  const admin = getSupabaseAdmin()
  const table =
    input.source === 'stripe' ? 'stripe_payments' : 'paypal_payments'

  const { error } = await admin
    .from(table)
    .update({
      followup_email_sent_at: new Date().toISOString(),
      followup_email_message_id: messageId
    })
    .eq('transaction_id', input.transactionId)
    .is('followup_email_sent_at', null)

  if (error) {
    throw new RetryableError(
      `Failed to mark follow-up as sent: ${error.message || 'unknown error'}`
    )
  }
}

async function grantOraxenStudioLicense(
  buyerEmail: string
): Promise<{ wasGranted: boolean; alreadyHad: boolean }> {
  'use step'

  const admin = getSupabaseAdmin()

  // Find user by email
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', buyerEmail)
    .single()

  if (!profile) {
    console.log(
      `[followup] No profile found for ${buyerEmail}, cannot grant Oraxen Studio`
    )
    return { wasGranted: false, alreadyHad: false }
  }

  // Check if they already have Oraxen Studio
  const { data: existing } = await admin
    .from('licenses')
    .select('id')
    .eq('user_id', profile.id)
    .eq('license_type', 'oraxen_studio')
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    console.log(
      `[followup] User ${buyerEmail} already has Oraxen Studio license (not sending follow-up)`
    )
    return { wasGranted: false, alreadyHad: true }
  }

  // Grant Oraxen Studio license
  const { error } = await admin.from('licenses').insert({
    user_id: profile.id,
    license_type: 'oraxen_studio',
    is_active: true,
    metadata: {
      granted_via: 'followup_workflow',
      granted_at: new Date().toISOString()
    }
  })

  if (error) {
    throw new RetryableError(
      `Failed to grant Oraxen Studio license: ${error.message}`
    )
  }

  console.log(`[followup] Granted Oraxen Studio license to ${buyerEmail}`)
  return { wasGranted: true, alreadyHad: false }
}

async function sendFollowupEmail(
  input: FollowupWorkflowInput
): Promise<string | undefined> {
  'use step'

  const { subject, text, html, attachments } = getOneWeekFollowUpEmail({
    buyerName: input.buyerName || 'there',
    purchaseType: input.purchaseType,
    platform: input.platform || 'spigot'
  })

  const result = await sendEmail({
    to: input.buyerEmail,
    subject,
    text,
    html,
    attachments
  })

  if (!result.success) {
    throw new RetryableError(
      `Failed to send follow-up email: ${result.error || 'unknown error'}`
    )
  }

  return result.messageId
}

export async function purchaseFollowupWorkflow(
  input: FollowupWorkflowInput
): Promise<{
  ok: true
  skipped?: 'not_registered' | 'already_sent' | 'already_had_oraxen_studio'
  grantedOraxenStudio?: boolean
}> {
  'use workflow'

  // Wait the requested duration (computed at scheduling time).
  // For normal purchases: 7 days. For backfills: 0..7 days depending on purchase age.
  await sleep(input.delayMs)

  const alreadySent = await hasFollowupAlreadyBeenSent(input)
  if (alreadySent) {
    return { ok: true, skipped: 'already_sent' }
  }

  const registered = await isRegisteredByEmail(input.buyerEmail)
  if (!registered) {
    return { ok: true, skipped: 'not_registered' }
  }

  // For Oraxen purchases, try to grant a free Oraxen Studio license
  // Only send the follow-up email if we actually granted it (not if they already had it)
  let grantedOraxenStudio = false
  if (input.purchaseType === 'oraxen') {
    const result = await grantOraxenStudioLicense(input.buyerEmail)
    
    if (result.alreadyHad) {
      // User already had Oraxen Studio (probably manually granted)
      // Don't send the email claiming we just added it
      console.log(
        `[followup] Skipping email for ${input.buyerEmail} - already had Oraxen Studio`
      )
      return { ok: true, skipped: 'already_had_oraxen_studio' }
    }
    
    grantedOraxenStudio = result.wasGranted
  }

  // Send the follow-up email
  const messageId = await sendFollowupEmail(input)
  await markFollowupSent(input, messageId)

  return { ok: true, grantedOraxenStudio }
}
