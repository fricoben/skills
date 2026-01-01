'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './members.module.css'

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
  role: string
  created_at: string
}

interface License {
  id: string
  user_id: string
  license_type: string
  is_active: boolean
  expires_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface UserWithLicenses extends Profile {
  licenses: License[]
}

type LicenseType = 'oraxen' | 'oraxen_studio' | 'hackedserver'

export function MembersContent() {
  const [users, setUsers] = useState<UserWithLicenses[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithLicenses[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithLicenses | null>(null)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  // Inject global styles to hide nextra chrome
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = globalStyles
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Fetch users with licenses
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch all licenses
      const { data: licenses, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (licensesError) throw licensesError

      // Combine profiles with their licenses
      const usersWithLicenses: UserWithLicenses[] = (profiles || []).map(
        (profile) => ({
          ...profile,
          licenses: (licenses || []).filter((l) => l.user_id === profile.id)
        })
      )

      setUsers(usersWithLicenses)
      setFilteredUsers(usersWithLicenses)
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage({ type: 'error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(query) ||
          u.full_name?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query) ||
          u.licenses.some((l) => l.license_type.toLowerCase().includes(query))
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleAddLicense = (u: UserWithLicenses) => {
    setEditingUser(u)
    setEditingLicense(null)
    setShowLicenseModal(true)
  }

  const handleEditLicense = (u: UserWithLicenses, license: License) => {
    setEditingUser(u)
    setEditingLicense(license)
    setShowLicenseModal(true)
  }

  const handleToggleLicense = async (license: License) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ is_active: !license.is_active })
        .eq('id', license.id)

      if (error) throw error

      setMessage({
        type: 'success',
        text: `License ${license.is_active ? 'deactivated' : 'activated'}`
      })
      fetchUsers()
    } catch (error) {
      console.error('Error toggling license:', error)
      setMessage({ type: 'error', text: 'Failed to update license' })
    }
  }

  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return

    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', licenseId)

      if (error) throw error

      setMessage({ type: 'success', text: 'License deleted' })
      fetchUsers()
    } catch (error) {
      console.error('Error deleting license:', error)
      setMessage({ type: 'error', text: 'Failed to delete license' })
    }
  }

  const getLicenseClassName = (type: string, isActive: boolean) => {
    let base = ''
    switch (type) {
      case 'oraxen':
        base = styles.licenseOraxen
        break
      case 'oraxen_studio':
        base = styles.licenseOraxenStudio
        break
      case 'hackedserver':
        base = styles.licenseHackedserver
        break
      default:
        base = styles.licenseBadge
    }
    return isActive ? base : `${base} ${styles.licenseInactive}`
  }

  const getRoleClassName = (role: string) => {
    switch (role) {
      case 'admin':
        return styles.roleAdmin
      case 'manager':
        return styles.roleManager
      default:
        return styles.roleMember
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const totalLicenses = users.reduce((acc, u) => acc + u.licenses.length, 0)
  const activeLicenses = users.reduce(
    (acc, u) => acc + u.licenses.filter((l) => l.is_active).length,
    0
  )

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading members...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Members</h1>
        <p className={styles.pageSubtitle}>Manage users and their licenses</p>
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
              placeholder="Search by email, name, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{users.length}</span>
              <span>users</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{activeLicenses}</span>
              <span>/ {totalLicenses} licenses</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Licenses</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    {/* User */}
                    <td>
                      <div className={styles.userCell}>
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className={styles.userAvatarImg}
                          />
                        ) : (
                          <div className={styles.userAvatar}>
                            {(u.email || u.full_name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>
                            {u.full_name || u.email?.split('@')[0] || 'Unknown'}
                          </div>
                          <div className={styles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={getRoleClassName(u.role)}>
                        {u.role}
                      </span>
                    </td>

                    {/* Licenses */}
                    <td>
                      {u.licenses.length === 0 ? (
                        <span className={styles.noLicenses}>No licenses</span>
                      ) : (
                        <div className={styles.licenses}>
                          {u.licenses.map((license) => (
                            <span
                              key={license.id}
                              className={getLicenseClassName(
                                license.license_type,
                                license.is_active
                              )}
                              onClick={() => handleEditLicense(u, license)}
                              title={`Click to edit • ${
                                license.is_active ? 'Active' : 'Inactive'
                              }`}
                              style={{ cursor: 'pointer' }}
                            >
                              {license.license_type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Joined */}
                    <td>
                      <span className={styles.dateCell}>
                        {formatDate(u.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtnPrimary}
                          onClick={() => handleAddLicense(u)}
                        >
                          + License
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* License Modal */}
      {showLicenseModal && editingUser && (
        <LicenseModal
          user={editingUser}
          license={editingLicense}
          onClose={() => {
            setShowLicenseModal(false)
            setEditingUser(null)
            setEditingLicense(null)
          }}
          onSuccess={() => {
            setShowLicenseModal(false)
            setEditingUser(null)
            setEditingLicense(null)
            fetchUsers()
          }}
          onToggle={handleToggleLicense}
          onDelete={handleDeleteLicense}
        />
      )}
    </div>
  )
}

function LicenseModal({
  user,
  license,
  onClose,
  onSuccess,
  onToggle,
  onDelete
}: {
  user: UserWithLicenses
  license: License | null
  onClose: () => void
  onSuccess: () => void
  onToggle: (license: License) => Promise<void>
  onDelete: (licenseId: string) => Promise<void>
}) {
  const supabase = createClient()
  const [licenseType, setLicenseType] = useState<LicenseType>(
    (license?.license_type as LicenseType) || 'oraxen'
  )
  const [expiresAt, setExpiresAt] = useState(
    license?.expires_at ? license.expires_at.split('T')[0] : ''
  )
  const [neverExpires, setNeverExpires] = useState(!license?.expires_at)
  const [notes, setNotes] = useState(
    (license?.metadata?.notes as string) || ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const metadata = notes ? { notes } : {}
      const expires = neverExpires
        ? null
        : expiresAt
        ? new Date(expiresAt).toISOString()
        : null

      if (license) {
        // Update existing license
        const { error } = await supabase
          .from('licenses')
          .update({
            expires_at: expires,
            metadata
          })
          .eq('id', license.id)

        if (error) throw error
      } else {
        // Create new license
        const { error } = await supabase.from('licenses').insert({
          user_id: user.id,
          license_type: licenseType,
          is_active: true,
          expires_at: expires,
          metadata
        })

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving license:', error)
      setMessage({ type: 'error', text: 'Failed to save license' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async () => {
    if (license) {
      await onToggle(license)
      onSuccess()
    }
  }

  const handleDelete = async () => {
    if (license) {
      await onDelete(license.id)
      onSuccess()
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className={styles.modalTitle}>
          {license ? 'Edit License' : 'Add License'}
        </h2>
        <p className={styles.modalSubtitle}>
          {user.email}
        </p>

        {message && (
          <div
            className={
              message.type === 'error' ? styles.alertError : styles.alertSuccess
            }
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* License Type (only for new licenses) */}
          {!license && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>License Type</label>
              <div className={styles.licenseTypeGrid}>
                {(['oraxen', 'oraxen_studio', 'hackedserver'] as LicenseType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      className={
                        licenseType === type
                          ? styles.licenseTypeBtnActive
                          : styles.licenseTypeBtn
                      }
                      onClick={() => setLicenseType(type)}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Expiration */}
          <div className={styles.formGroup}>
            <label className={styles.formCheckbox}>
              <input
                type="checkbox"
                checked={neverExpires}
                onChange={(e) => setNeverExpires(e.target.checked)}
              />
              Never expires
            </label>
            {!neverExpires && (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={styles.formInput}
              />
            )}
          </div>

          {/* Notes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this license..."
              className={styles.formTextarea}
            />
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.modalBtnPrimary}
            >
              {submitting ? 'Saving...' : license ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={styles.modalBtn}
            >
              Cancel
            </button>
          </div>

          {/* Edit mode extra actions */}
          {license && (
            <div
              className={styles.modalActions}
              style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}
            >
              <button
                type="button"
                onClick={handleToggle}
                className={styles.modalBtn}
              >
                {license.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.modalBtnDanger}
              >
                Delete
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
