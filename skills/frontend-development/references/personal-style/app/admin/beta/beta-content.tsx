'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './beta.module.css'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  discord_id: string | null
}

interface BetaMember {
  id: string
  user_id: string
  joined_at: string
  left_at: string | null
  profile: Profile | null
}

export function BetaContent() {
  const [members, setMembers] = useState<BetaMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<BetaMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [selectedMember, setSelectedMember] = useState<BetaMember | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch beta members (RLS policy allows admins to see all)
      const { data: betaMembers, error: betaError } = await supabase
        .from('beta_members')
        .select('*')
        .order('joined_at', { ascending: false })

      if (betaError) throw betaError

      // Fetch profiles for all members
      const userIds = betaMembers?.map((m) => m.user_id) || []
      const { data: profiles, error: profilesError } = userIds.length > 0
        ? await supabase.from('profiles').select('*').in('id', userIds)
        : { data: [], error: null }

      if (profilesError) throw profilesError

      // Combine beta members with their profiles
      const membersWithProfiles: BetaMember[] = (betaMembers || []).map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.id === m.user_id) || null
      }))

      setMembers(membersWithProfiles)
      setFilteredMembers(membersWithProfiles)
    } catch (error) {
      console.error('Error fetching beta members:', error)
      setMessage({ type: 'error', text: 'Failed to load beta members' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Filter members based on search and active status
  useEffect(() => {
    let filtered = members

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter((m) => !m.left_at)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          m.profile?.email?.toLowerCase().includes(query) ||
          m.profile?.full_name?.toLowerCase().includes(query) ||
          m.user_id.toLowerCase().includes(query)
      )
    }

    setFilteredMembers(filtered)
  }, [searchQuery, members, showInactive])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleRemoveMember = async (member: BetaMember) => {
    if (!confirm(`Remove ${member.profile?.email || 'this user'} from beta program?`)) return

    try {
      const { error } = await supabase
        .from('beta_members')
        .update({ left_at: new Date().toISOString() })
        .eq('id', member.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Member removed from beta program' })
      setSelectedMember(null)
      fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      setMessage({ type: 'error', text: 'Failed to remove member' })
    }
  }

  const handleReactivateMember = async (member: BetaMember) => {
    try {
      const { error } = await supabase
        .from('beta_members')
        .update({ left_at: null })
        .eq('id', member.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Member reactivated' })
      setSelectedMember(null)
      fetchMembers()
    } catch (error) {
      console.error('Error reactivating member:', error)
      setMessage({ type: 'error', text: 'Failed to reactivate member' })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const activeMembers = members.filter((m) => !m.left_at).length
  const totalMembers = members.length

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading beta members...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Beta Program</h1>
        <p className={styles.pageSubtitle}>Manage beta program members and access</p>
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

      {/* Main Panel */}
      <div className={styles.panel}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive
          </label>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{activeMembers}</span>
              <span>active</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalMembers}</span>
              <span>total</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Member</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '18%' }}>Joined</th>
                <th style={{ width: '15%' }}>Left</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    No beta members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id}>
                    {/* Member */}
                    <td>
                      <div className={styles.userCell}>
                        {member.profile?.avatar_url ? (
                          <img
                            src={member.profile.avatar_url}
                            alt=""
                            className={styles.userAvatarImg}
                          />
                        ) : (
                          <div className={styles.userAvatar}>
                            {(member.profile?.email || member.profile?.full_name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>
                            {member.profile?.full_name ||
                              member.profile?.email?.split('@')[0] ||
                              'Unknown'}
                          </div>
                          <div className={styles.userEmail}>
                            {member.profile?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {member.left_at ? (
                        <span className={styles.badgeInactive}>Inactive</span>
                      ) : (
                        <span className={styles.badgeActive}>Active</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td>
                      <span className={styles.dateCell}>
                        {formatDate(member.joined_at)}
                      </span>
                    </td>

                    {/* Left */}
                    <td>
                      <span className={styles.dateCell}>
                        {member.left_at ? formatDate(member.left_at) : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setSelectedMember(member)}
                        >
                          View
                        </button>
                        {member.left_at ? (
                          <button
                            className={styles.actionBtnPrimary}
                            onClick={() => handleReactivateMember(member)}
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            className={styles.actionBtnDanger}
                            onClick={() => handleRemoveMember(member)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMember(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedMember(null)}
              aria-label="Close"
            >
              ×
            </button>

            <h2 className={styles.modalTitle}>Member Details</h2>
            <p className={styles.modalSubtitle}>
              {selectedMember.profile?.email}
            </p>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>User ID</span>
              <div className={styles.modalValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {selectedMember.user_id}
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Full Name</span>
              <div className={styles.modalValue}>
                {selectedMember.profile?.full_name || '—'}
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Discord ID</span>
              <div className={styles.modalValue}>
                {selectedMember.profile?.discord_id || '—'}
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Status</span>
              <div className={styles.modalValue}>
                {selectedMember.left_at ? (
                  <span className={styles.badgeInactive}>Inactive</span>
                ) : (
                  <span className={styles.badgeActive}>Active</span>
                )}
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Joined</span>
              <div className={styles.modalValue}>
                {formatDate(selectedMember.joined_at)}
              </div>
            </div>

            {selectedMember.left_at && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Left</span>
                <div className={styles.modalValue}>
                  {formatDate(selectedMember.left_at)}
                </div>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.modalBtn}
                onClick={() => setSelectedMember(null)}
              >
                Close
              </button>
              {selectedMember.left_at ? (
                <button
                  className={styles.modalBtnPrimary}
                  onClick={() => handleReactivateMember(selectedMember)}
                >
                  Reactivate
                </button>
              ) : (
                <button
                  className={styles.modalBtnDanger}
                  onClick={() => handleRemoveMember(selectedMember)}
                >
                  Remove from Beta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
