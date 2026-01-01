'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import styles from './license.module.css'
import Image from 'next/image'

// Hide nextra blog chrome
const globalStyles = `
  article.x\\:container > header,
  article header[data-pagefind-ignore] {
    display: none !important;
  }
`

interface License {
  id: string
  license_type: string
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  discord_id: string | null
  github_username: string | null
}

interface Payment {
  id: string
  transaction_id: string | null
  buyer_email: string | null
  buyer_name: string | null
  amount: string | null
  purchase_type: string
  payment_source: 'paypal' | 'stripe'
}

interface Props {
  user: User | null
  profile: Profile | null
  licenses: License[]
  unclaimedPayment: Payment | null
  txid?: string
  error?: string
}

// License type to icon mapping
const LICENSE_ICONS: Record<string, string> = {
  oraxen: '/images/licenses/logos/oraxen.png',
  oraxen_studio: '/images/licenses/logos/oraxen_studio.png',
  hackedserver: '/images/licenses/logos/hackedserver.png'
}

const LICENSE_NAMES: Record<string, string> = {
  oraxen: 'Oraxen',
  oraxen_studio: 'Oraxen Studio',
  hackedserver: 'HackedServer'
}

export function LicenseClient({
  user,
  profile,
  licenses,
  unclaimedPayment,
  txid,
  error
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [manualTxid, setManualTxid] = useState('')

  const supabase = createClient()

  // Store txid in localStorage for persistence through auth flow
  useEffect(() => {
    if (txid) {
      localStorage.setItem('pending_txid', txid)
    }
  }, [txid])

  // Get effective txid (from URL or localStorage)
  const getEffectiveTxid = (): string | undefined => {
    if (txid) return txid
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pending_txid') || undefined
    }
    return undefined
  }

  // Check if email exists when user finishes typing
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setShowPassword(false)
        return
      }

      setCheckingEmail(true)
      try {
        // Try to sign in with OTP to check if user exists
        // This is a workaround - we check if user has password by trying password auth
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'check_if_exists_dummy_password_that_will_fail'
        })

        // If error is "Invalid login credentials", user exists with password
        // If error is "Email not confirmed" or similar, user exists
        if (
          error?.message?.includes('Invalid login credentials') ||
          error?.message?.includes('Email not confirmed')
        ) {
          setShowPassword(true)
        } else {
          setShowPassword(false)
        }
      } catch {
        setShowPassword(false)
      }
      setCheckingEmail(false)
    }

    const timer = setTimeout(checkEmail, 500)
    return () => clearTimeout(timer)
  }, [email, supabase.auth])

  const handleOAuth = async (provider: 'github' | 'discord') => {
    setLoading(true)
    setMessage(null)
    const effectiveTxid = getEffectiveTxid()
    const redirectUrl = effectiveTxid
      ? `/license?txid=${effectiveTxid}`
      : '/license'

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${
          window.location.origin
        }/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`
      }
    })
  }

  const handleLinkProvider = async (provider: 'github' | 'discord') => {
    setLoading(true)
    setMessage(null)

    await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/license`
      }
    })
  }

  const handleUnlinkProvider = async (provider: 'github' | 'discord') => {
    if (!user) return

    const identity = user.identities?.find((i) => i.provider === provider)
    if (!identity) return

    setUnlinking(provider)
    setMessage(null)

    // Discord unlink goes through our API to also remove Discord roles
    // Licenses stay active - when user reconnects Discord, roles will be re-added
    if (provider === 'discord') {
      const res = await fetch('/api/discord/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to unlink Discord'
        })
      } else {
        setMessage({
          type: 'success',
          text: 'Discord disconnected'
        })
        router.refresh()
      }
      setUnlinking(null)
      return
    }

    // GitHub unlink uses Supabase directly
    const { error } = await supabase.auth.unlinkIdentity(identity)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'GitHub disconnected'
      })
      router.refresh()
    }
    setUnlinking(null)
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const effectiveTxid = getEffectiveTxid()
    const redirectUrl = effectiveTxid
      ? `/license?txid=${effectiveTxid}`
      : '/license'

    // If password is shown and filled, try password auth
    if (showPassword && password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setLoading(false)
      } else {
        router.refresh()
      }
      return
    }

    // Otherwise, send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${
          window.location.origin
        }/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`
      }
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      setMessage({ type: 'success', text: 'Check your email for a magic link' })
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const isGithubLinked = user?.identities?.some((i) => i.provider === 'github')
  const isDiscordLinked = user?.identities?.some(
    (i) => i.provider === 'discord'
  )

  // Inject global styles to hide nextra chrome
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = globalStyles
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Auto-claim license if user is logged in and has unclaimed payment.
  // The txid acts as a bearer token - anyone with the link can claim it (see page.tsx for rationale).
  useEffect(() => {
    const autoClaim = async () => {
      if (!user || !unclaimedPayment || claiming || claimSuccess) return

      setClaiming(true)
      setMessage(null)

      const res = await fetch('/api/license/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: unclaimedPayment.id,
          paymentSource: unclaimedPayment.payment_source
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to claim license'
        })
        setClaiming(false)
      } else {
        // Show success state with animation, then refresh
        setClaimSuccess(true)
        setClaiming(false)
        localStorage.removeItem('pending_txid')
        // Wait for animation to complete before refreshing
        setTimeout(() => {
          router.replace('/license')
        }, 800)
      }
    }

    autoClaim()
  }, [user, unclaimedPayment]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Get license icon
  const getLicenseIcon = (type: string) => {
    return LICENSE_ICONS[type] || LICENSE_ICONS.hackedserver
  }

  const getLicenseName = (type: string) => {
    return LICENSE_NAMES[type] || type
  }

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTxid.trim()) return
    localStorage.setItem('pending_txid', manualTxid.trim())
    setShowAddModal(false)
    router.push(`/license?txid=${encodeURIComponent(manualTxid.trim())}`)
  }

  // Not logged in
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>✦</div>
            <h1 className={styles.title}>Claim Your License</h1>
            <p className={styles.subtitle}>
              Thank you for your purchase! Connect your account to activate your
              software license.
            </p>
          </div>

          {error && (
            <div className={styles.alertError}>
              {error === 'auth_failed' || error === 'access_denied'
                ? 'Authentication failed. Please try again.'
                : error === 'server_error'
                ? 'Something went wrong. Please try again later.'
                : 'An error occurred. Please try again.'}
            </div>
          )}
          {message && message.type === 'error' && (
            <div className={styles.alertError}>{message.text}</div>
          )}

          {message?.type === 'success' && message.text.includes('email') ? (
            <div className={styles.checkEmail}>
              <span className={styles.checkIcon}>✓</span>
              <h2>Check your email</h2>
              <p>We sent you a magic link to sign in.</p>
            </div>
          ) : (
            <div className={styles.auth}>
              <button
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className={styles.btnGithub}
              >
                <GithubIcon />
                Continue with GitHub
              </button>
              <button
                onClick={() => handleOAuth('discord')}
                disabled={loading}
                className={styles.btnDiscord}
              >
                <DiscordIcon />
                Continue with Discord
              </button>

              <div className={styles.divider}>
                <span>or use email</span>
              </div>

              <form onSubmit={handleEmailLogin} className={styles.form}>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={styles.input}
                />
                {showPassword && (
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`${styles.input} ${styles.passwordField}`}
                    autoFocus
                  />
                )}
                <button
                  type="submit"
                  disabled={loading || checkingEmail}
                  className={styles.btnPrimary}
                >
                  {loading
                    ? 'Sending...'
                    : showPassword && password
                    ? 'Sign in'
                    : 'Send magic link'}
                </button>
              </form>
            </div>
          )}

          {txid && <p className={styles.txid}>Transaction: {txid}</p>}
        </div>
      </div>
    )
  }

  // Logged in
  return (
    <div className={styles.page}>
      <div className={styles.cardWide}>
        <div className={styles.cardHeader}>
          <div className={styles.icon}>✦</div>
          <h1 className={styles.title}>Your Licenses</h1>
          <p className={styles.subtitle}>{user.email}</p>
        </div>

        {message && (
          <div
            className={
              message.type === 'error' ? styles.alertError : styles.alertSuccess
            }
          >
            {message.text}
          </div>
        )}

        {/* Unclaimed payment - auto-claiming, animates from yellow to green */}
        {unclaimedPayment && (
          <div
            className={
              claimSuccess ? styles.claimCardSuccess : styles.claimCard
            }
          >
            <div className={styles.claimInfo}>
              <div
                className={
                  claimSuccess
                    ? styles.claimIconWrapperSuccess
                    : styles.claimIconWrapper
                }
              >
                <Image
                  src={getLicenseIcon(unclaimedPayment.purchase_type)}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.claimIcon}
                />
              </div>
              <div>
                <strong
                  className={
                    claimSuccess ? styles.claimTitleSuccess : undefined
                  }
                >
                  {getLicenseName(unclaimedPayment.purchase_type)}
                </strong>
                <span
                  className={
                    claimSuccess ? styles.claimSubtitleSuccess : undefined
                  }
                >
                  {claiming
                    ? 'Claiming...'
                    : claimSuccess
                    ? 'Activated!'
                    : unclaimedPayment.amount}
                </span>
              </div>
            </div>
            <span
              className={
                claimSuccess ? styles.statusActiveVisible : styles.statusHidden
              }
            >
              Active
            </span>
          </div>
        )}

        {/* Licenses */}
        <section className={styles.licenses}>
          {licenses.length === 0 && !unclaimedPayment ? (
            <div className={styles.emptyState}>
              <p className={styles.empty}>No licenses yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className={styles.addLicenseBtn}
              >
                Add a license
              </button>
            </div>
          ) : (
            licenses.map((license) => (
              <div
                key={license.id}
                className={
                  license.is_active ? styles.licenseActive : styles.license
                }
              >
                <div className={styles.licenseMain}>
                  <div className={styles.licenseIcon}>
                    <Image
                      src={getLicenseIcon(license.license_type)}
                      alt=""
                      width={28}
                      height={28}
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className={styles.licenseInfo}>
                    <strong>{getLicenseName(license.license_type)}</strong>
                    <span>
                      {new Date(license.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span
                  className={
                    license.is_active ? styles.statusActive : styles.status
                  }
                >
                  {license.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))
          )}
        </section>

        {/* Connected accounts */}
        <section className={styles.accounts}>
          <h2 className={styles.accountsTitle}>Connected Accounts</h2>

          <div className={styles.accountRow}>
            <div className={styles.accountInfo}>
              <GithubIcon />
              <span>GitHub</span>
              {isGithubLinked && profile?.github_username && (
                <span className={styles.username}>
                  @{profile.github_username}
                </span>
              )}
            </div>
            {isGithubLinked ? (
              <button
                onClick={() => handleUnlinkProvider('github')}
                disabled={unlinking === 'github'}
                className={styles.linkBtnDisconnect}
              >
                {unlinking === 'github' ? '...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={() => handleLinkProvider('github')}
                disabled={loading}
                className={styles.linkBtn}
              >
                Connect
              </button>
            )}
          </div>

          <div className={styles.accountRow}>
            <div className={styles.accountInfo}>
              <DiscordIcon />
              <span>Discord</span>
            </div>
            {isDiscordLinked ? (
              <button
                onClick={() => handleUnlinkProvider('discord')}
                disabled={unlinking === 'discord'}
                className={styles.linkBtnDisconnect}
              >
                {unlinking === 'discord' ? '...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={() => handleLinkProvider('discord')}
                disabled={loading}
                className={styles.linkBtn}
              >
                Connect
              </button>
            )}
          </div>
        </section>

        <div className={styles.footer}>
          <button
            onClick={() => setShowAddModal(true)}
            className={styles.addLicenseBtnFooter}
          >
            Add a license
          </button>
          <button onClick={handleSignOut} className={styles.signoutBtn}>
            Sign out
          </button>
        </div>
      </div>

      {/* Manual Add License Modal */}
      {showAddModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowAddModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className={styles.modalTitle}>Add a License</h2>
            <p className={styles.modalSubtitle}>
              Enter your transaction ID from your purchase confirmation email.
            </p>
            <form onSubmit={handleManualAdd} className={styles.modalForm}>
              <input
                type="text"
                value={manualTxid}
                onChange={(e) => setManualTxid(e.target.value)}
                placeholder="Transaction ID"
                className={styles.input}
                autoFocus
              />
              <div className={styles.modalExamples}>
                <span className={styles.modalExamplesLabel}>Examples:</span>
                <div className={styles.modalExampleRow}>
                  <code>5TY123456AB789012</code>
                  <span className={styles.modalExamplesDivider}>PayPal</span>
                </div>
                <div className={styles.modalExampleRow}>
                  <code>pi_3ABC123def456GHI</code>
                  <span className={styles.modalExamplesDivider}>Stripe</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={!manualTxid.trim()}
                className={styles.btnPrimary}
              >
                Look up license
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}
