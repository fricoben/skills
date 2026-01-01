'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import styles from './beta.module.css'

// Hide nextra blog chrome
const globalStyles = `
  article.x\\:container > header,
  article header[data-pagefind-ignore] {
    display: none !important;
  }
`

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  discord_id: string | null
  github_username: string | null
}

interface License {
  id: string
  license_type: string
  is_active: boolean
}

interface Props {
  user: User | null
  profile: Profile | null
  licenses: License[]
  isBetaMember: boolean
  spotsRemaining: number | null
}

export function BetaClient({
  user,
  profile,
  licenses,
  isBetaMember,
  spotsRemaining
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const supabase = createClient()

  // TEMPORARILY DISABLED: License check for beta access
  const hasActiveLicense = true // licenses.length > 0
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

  // Check if email exists when user finishes typing
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes('@')) {
        setShowPassword(false)
        return
      }

      setCheckingEmail(true)
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: 'check_if_exists_dummy_password_that_will_fail'
        })

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

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleOAuth = async (provider: 'github' | 'discord') => {
    setLoading(true)
    setMessage(null)

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/beta`
      }
    })
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/beta`
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

  const handleJoin = async () => {
    setJoining(true)
    setMessage(null)

    const res = await fetch('/api/beta/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Failed to join' })
      setJoining(false)
    } else {
      router.refresh()
    }
  }

  const handleLeave = async () => {
    setLeaving(true)
    setMessage(null)

    const res = await fetch('/api/beta/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Failed to leave' })
      setLeaving(false)
    } else {
      router.refresh()
    }
  }

  // Not logged in
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>🚀</div>
            <h1 className={styles.title}>Beta Program</h1>
            <p className={styles.subtitle}>
              Get early access to new software, features, and plugins before
              anyone else.
            </p>
          </div>

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

          <p className={styles.note}>
            You need an active license to join the beta program.
          </p>
        </div>
      </div>
    )
  }

  // Logged in but no license
  if (!hasActiveLicense) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>🔒</div>
            <h1 className={styles.title}>Beta Program</h1>
            <p className={styles.subtitle}>{user.email}</p>
          </div>

          <div className={styles.noLicense}>
            <p>You need an active license to join the beta program.</p>
            <a href="/license" className={styles.btnPrimary}>
              Claim your license
            </a>
          </div>

          <div className={styles.footer}>
            <button onClick={handleSignOut} className={styles.signoutBtn}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Logged in with license
  return (
    <div className={styles.page}>
      <div className={styles.cardWide}>
        <div className={styles.cardHeader}>
          <div className={styles.icon}>🚀</div>
          <h1 className={styles.title}>Beta Program</h1>
          <p className={styles.subtitle}>{user.email}</p>
        </div>

        {message?.type === 'error' && (
          <div className={styles.alertError}>{message.text}</div>
        )}

        {/* Membership status */}
        <section className={styles.membershipSection}>
          {isBetaMember ? (
            <div className={styles.memberCard}>
              <div className={styles.memberInfo}>
                <div className={styles.memberIcon}>✦</div>
                <div>
                  <strong>You&apos;re a Beta Member</strong>
                  <span>Early access to all new features</span>
                </div>
              </div>
              <span className={styles.statusActive}>Active</span>
            </div>
          ) : (
            <div className={styles.joinCard}>
              <p>
                Get early free access to new plugins, unreleased features, and
                an insider Discord channel.
              </p>
            </div>
          )}
        </section>

        {/* Discord info */}
        {!isDiscordLinked && !isBetaMember && (
          <div className={styles.discordNotice}>
            <DiscordIcon />
            <span>
              <a href="/license">Connect Discord</a> to get the Insider role.
            </span>
          </div>
        )}

        {/* Action button */}
        <section className={styles.actions}>
          {isBetaMember ? (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className={styles.btnLeave}
            >
              {leaving ? 'Leaving...' : 'Leave Program'}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={
                joining || (spotsRemaining !== null && spotsRemaining <= 0)
              }
              className={styles.btnJoin}
            >
              {joining ? 'Joining...' : 'Join Program'}
            </button>
          )}
          {spotsRemaining !== null && spotsRemaining > 0 && (
            <p className={styles.spotsNote}>
              {spotsRemaining} spots remaining · Free to leave anytime
            </p>
          )}
          {spotsRemaining !== null && spotsRemaining <= 0 && (
            <p className={styles.spotsFull}>Beta program is currently full</p>
          )}
        </section>

        <div className={styles.footer}>
          <a href="/license" className={styles.footerLink}>
            Manage licenses
          </a>
          <button onClick={handleSignOut} className={styles.signoutBtn}>
            Sign out
          </button>
        </div>
      </div>
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
