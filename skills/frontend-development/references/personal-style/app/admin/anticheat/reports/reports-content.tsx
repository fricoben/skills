'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './reports.module.css'

type ObservationType = 'false_positive' | 'undetected' | 'recording'
type ObservationSource = 'dashboard' | 'ingame' | 'api'
type ObservationStatus = 'new' | 'pending' | 'reviewed' | 'confirmed' | 'resolved' | 'dismissed'

interface CheatObservation {
  id: string
  server_id: string
  observation_type: ObservationType
  source: ObservationSource
  player_uuid: string
  player_name: string | null
  cheat_type: string | null
  label: string | null
  started_at: string | null
  ended_at: string | null
  finding_id: string | null
  player_activity: string | null
  suspected_cause: string | null
  session_id: string | null
  additional_context: string | null
  evidence_url: string | null
  reporter_user_id: string | null
  recorded_by_uuid: string | null
  recorded_by_name: string | null
  status: ObservationStatus
  admin_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  finding?: {
    id: string
    player_uuid: string
    detector_name: string
    title: string
    occurrences: number
  }
  reporter?: {
    email: string | null
    full_name: string | null
  }
  server?: {
  id: string
    name: string
  }
}

const CHEAT_TYPE_LABELS: Record<string, string> = {
  killaura: 'KillAura',
  speed: 'Speed',
  fly: 'Fly',
  reach: 'Reach',
  autoclicker: 'Auto Clicker',
  aimbot: 'Aimbot',
  xray: 'X-Ray',
  scaffold: 'Scaffold',
  bhop: 'Bunny Hop',
  nofall: 'No Fall',
  antiknockback: 'Anti KB',
  other: 'Other'
}

const OBSERVATION_TYPE_LABELS: Record<ObservationType, string> = {
  false_positive: 'False Positive',
  undetected: 'Undetected',
  recording: 'Recording'
}

const SOURCE_LABELS: Record<ObservationSource, string> = {
  dashboard: 'Dashboard',
  ingame: 'In-Game',
  api: 'API'
}

export function ReportsContent() {
  const [observations, setObservations] = useState<CheatObservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ObservationStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ObservationType | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<ObservationSource | 'all'>('all')
  const [selectedObservation, setSelectedObservation] = useState<CheatObservation | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  const fetchObservations = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all observations
      const { data: obsData, error: obsError } = await supabase
        .from('cheat_observations')
        .select('*')
        .order('created_at', { ascending: false })

      if (obsError) throw obsError

      // Fetch findings for false positive reports
      const findingIds = obsData?.filter(o => o.finding_id).map(o => o.finding_id) || []
      const { data: findings } = findingIds.length > 0
        ? await supabase.from('findings').select('id, player_uuid, detector_name, title, occurrences').in('id', findingIds)
        : { data: [] }

      // Fetch reporter profiles
      const reporterIds = obsData?.filter(o => o.reporter_user_id).map(o => o.reporter_user_id) || []
      const { data: profiles } = reporterIds.length > 0
        ? await supabase.from('profiles').select('id, email, full_name').in('id', reporterIds)
        : { data: [] }

      // Fetch server info
      const serverIds = [...new Set(obsData?.map(o => o.server_id).filter(Boolean) || [])]
      const { data: servers } = serverIds.length > 0
        ? await supabase.from('servers').select('id, name').in('id', serverIds)
        : { data: [] }

      // Join data
      const obsWithJoins: CheatObservation[] = (obsData || []).map((o) => ({
        ...o,
        finding: findings?.find(f => f.id === o.finding_id),
        reporter: profiles?.find(p => p.id === o.reporter_user_id),
        server: servers?.find(s => s.id === o.server_id)
      }))

      setObservations(obsWithJoins)
    } catch (error) {
      console.error('Error fetching observations:', error)
      setMessage({ type: 'error', text: 'Failed to load observations' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchObservations()
  }, [fetchObservations])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const updateObservationStatus = async (
    id: string,
    status: ObservationStatus,
    adminNotes?: string
  ) => {
    try {
      const updateData: Record<string, unknown> = { 
        status, 
        updated_at: new Date().toISOString() 
      }
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes
      }
      if (['reviewed', 'confirmed', 'resolved', 'dismissed'].includes(status)) {
        updateData.reviewed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('cheat_observations')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Observation updated' })
      setSelectedObservation(null)
      fetchObservations()
    } catch (error) {
      console.error('Error updating observation:', error)
      setMessage({ type: 'error', text: 'Failed to update observation' })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateLong = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: ObservationStatus) => {
    switch (status) {
      case 'new':
      case 'pending':
        return styles.badgeNew
      case 'reviewed':
        return styles.badgeReviewed
      case 'confirmed':
      case 'resolved':
        return styles.badgeResolved
      case 'dismissed':
        return styles.badgeDismissed
      default:
        return styles.badgeNew
    }
  }

  const getTypeBadge = (type: ObservationType) => {
    switch (type) {
      case 'false_positive':
        return styles.badgeFalsePositive
      case 'undetected':
        return styles.badgeUndetected
      case 'recording':
        return styles.badgeRecording
      default:
        return ''
    }
  }

  const getSourceBadge = (source: ObservationSource) => {
    switch (source) {
      case 'dashboard':
        return styles.badgeSourceDashboard
      case 'ingame':
        return styles.badgeSourceIngame
      case 'api':
        return styles.badgeSourceApi
      default:
        return ''
    }
  }

  // Filter observations
  const filteredObservations = observations.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (typeFilter !== 'all' && o.observation_type !== typeFilter) return false
    if (sourceFilter !== 'all' && o.source !== sourceFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        o.cheat_type?.toLowerCase().includes(query) ||
        o.label?.toLowerCase().includes(query) ||
        o.player_name?.toLowerCase().includes(query) ||
        o.player_uuid?.toLowerCase().includes(query) ||
        o.recorded_by_name?.toLowerCase().includes(query) ||
        o.finding?.detector_name?.toLowerCase().includes(query) ||
        o.finding?.title?.toLowerCase().includes(query) ||
        o.reporter?.email?.toLowerCase().includes(query) ||
        o.server?.name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const newCount = observations.filter(o => o.status === 'new').length
  const fpCount = observations.filter(o => o.observation_type === 'false_positive').length
  const undetectedCount = observations.filter(o => o.observation_type === 'undetected').length
  const recordingCount = observations.filter(o => o.observation_type === 'recording').length

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading observations...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Cheat Observations</h1>
        <p className={styles.pageSubtitle}>
          Unified view of false positives, undetected cheats, and in-game recordings
        </p>
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

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{newCount}</span>
          <span className={styles.statLabel}>New</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{fpCount}</span>
          <span className={styles.statLabel}>False Positives</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{undetectedCount}</span>
          <span className={styles.statLabel}>Undetected</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{recordingCount}</span>
          <span className={styles.statLabel}>Recordings</span>
        </div>
      </div>

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
              placeholder="Search by player, cheat type, detector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ObservationType | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All types</option>
            <option value="false_positive">False Positives</option>
            <option value="undetected">Undetected</option>
            <option value="recording">Recordings</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as ObservationSource | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All sources</option>
            <option value="dashboard">Dashboard</option>
            <option value="ingame">In-Game</option>
            <option value="api">API</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ObservationStatus | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="confirmed">Confirmed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{filteredObservations.length}</span>
              <span>observations</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                <th>Type</th>
                <th>Detection / Cheat</th>
                  <th>Player</th>
                <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredObservations.length === 0 ? (
                  <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    No observations found
                    </td>
                  </tr>
                ) : (
                filteredObservations.map((obs) => (
                  <tr key={obs.id}>
                    <td>
                      <span className={`${styles.typeBadge} ${getTypeBadge(obs.observation_type)}`}>
                        {OBSERVATION_TYPE_LABELS[obs.observation_type]}
                        </span>
                      </td>
                      <td>
                      <div className={styles.detectionCell}>
                        {obs.observation_type === 'false_positive' ? (
                          <>
                            <div className={styles.detectionTitle}>
                              {obs.finding?.title || 'Unknown Detection'}
                            </div>
                            <div className={styles.detectionMeta}>
                              {obs.finding?.detector_name || 'Unknown detector'}
                        </div>
                          </>
                        ) : (
                          <>
                            <div className={styles.cheatType}>
                              {obs.cheat_type ? (CHEAT_TYPE_LABELS[obs.cheat_type] || obs.cheat_type) : '—'}
                            </div>
                            {obs.label && (
                              <div className={styles.cheatDesc}>
                                {obs.label.slice(0, 40)}{obs.label.length > 40 ? '...' : ''}
                              </div>
                            )}
                          </>
                          )}
                        </div>
                      </td>
                      <td>
                      <div className={styles.playerCell}>
                        {obs.player_name && (
                          <span className={styles.playerName}>{obs.player_name}</span>
                        )}
                        <span className={styles.monoText}>
                          {obs.player_uuid?.slice(0, 8) || '—'}...
                        </span>
                      </div>
                      </td>
                      <td>
                      <span className={`${styles.sourceBadge} ${getSourceBadge(obs.source)}`}>
                        {SOURCE_LABELS[obs.source]}
                        </span>
                      </td>
                      <td>
                      <span className={getStatusBadge(obs.status)}>
                        {obs.status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateCell}>
                        {formatDate(obs.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                          onClick={() => setSelectedObservation(obs)}
                          >
                            View
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

      {/* Observation Detail Modal */}
      {selectedObservation && (
        <ObservationDetailModal
          observation={selectedObservation}
          onClose={() => setSelectedObservation(null)}
          onUpdateStatus={(status, notes) =>
            updateObservationStatus(selectedObservation.id, status, notes)
          }
          formatDate={formatDateLong}
        />
      )}
    </div>
  )
}

function ObservationDetailModal({
  observation,
  onClose,
  onUpdateStatus,
  formatDate
}: {
  observation: CheatObservation
  onClose: () => void
  onUpdateStatus: (status: ObservationStatus, notes?: string) => void
  formatDate: (date: string) => string
}) {
  const [adminNotes, setAdminNotes] = useState(observation.admin_notes || '')
  const [copySuccess, setCopySuccess] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const isFalsePositive = observation.observation_type === 'false_positive'
  const isUndetected = observation.observation_type === 'undetected'
  const isRecording = observation.observation_type === 'recording'

  // Generate markdown for the observation
  const generateMarkdown = () => {
    const lines: string[] = []
    
    lines.push(`# ${OBSERVATION_TYPE_LABELS[observation.observation_type]}`)
    lines.push(``)
    lines.push(`**Submitted:** ${formatDate(observation.created_at)}`)
    lines.push(`**Status:** ${observation.status}`)
    lines.push(`**Source:** ${SOURCE_LABELS[observation.source]}`)
    lines.push(``)

    if (isFalsePositive && observation.finding) {
      lines.push(`## Detection`)
      lines.push(`- **Title:** ${observation.finding.title}`)
      lines.push(`- **Detector:** ${observation.finding.detector_name}`)
      lines.push(`- **Occurrences:** ${observation.finding.occurrences}`)
      lines.push(``)
    }

    if (observation.cheat_type) {
      lines.push(`## Cheat Type`)
      lines.push(`**${CHEAT_TYPE_LABELS[observation.cheat_type] || observation.cheat_type}**`)
      lines.push(``)
    }

    if (observation.label) {
      lines.push(`## Label`)
      lines.push(observation.label)
      lines.push(``)
    }

    lines.push(`## Player`)
    if (observation.player_name) {
      lines.push(`- **Name:** ${observation.player_name}`)
    }
    lines.push(`- **UUID:**`)
    lines.push(`\`\`\``)
    lines.push(observation.player_uuid)
    lines.push(`\`\`\``)
    lines.push(``)

    if (observation.started_at) {
      lines.push(`## Time Window`)
      lines.push(`- **Start:** ${formatDate(observation.started_at)}`)
      if (observation.ended_at) {
        lines.push(`- **End:** ${formatDate(observation.ended_at)}`)
      }
      lines.push(``)
    }

    if (observation.player_activity) {
      lines.push(`## What was player doing?`)
      lines.push(observation.player_activity)
      lines.push(``)
    }

    if (observation.suspected_cause) {
      lines.push(`## Suspected cause`)
      lines.push(observation.suspected_cause)
      lines.push(``)
    }

    if (observation.additional_context) {
      lines.push(`## Additional Context`)
      lines.push(observation.additional_context)
      lines.push(``)
    }

    if (observation.evidence_url) {
      lines.push(`## Evidence`)
      lines.push(`[${observation.evidence_url}](${observation.evidence_url})`)
      lines.push(``)
    }

    if (isRecording && observation.recorded_by_name) {
      lines.push(`## Recorded By`)
      lines.push(`- **Name:** ${observation.recorded_by_name}`)
      if (observation.recorded_by_uuid) {
        lines.push(`- **UUID:** ${observation.recorded_by_uuid}`)
      }
      lines.push(``)
    }

    if (observation.reporter?.email) {
      lines.push(`## Reporter`)
      lines.push(observation.reporter.email)
      lines.push(``)
    }

    lines.push(`## Server`)
    lines.push(observation.server?.name || observation.server_id)

    if (observation.admin_notes) {
      lines.push(``)
      lines.push(`## Admin Notes`)
      lines.push(observation.admin_notes)
    }

    return lines.join('\n')
  }

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdown()
    try {
      await navigator.clipboard.writeText(markdown)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = markdown
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleExportLogs = async () => {
    if (!observation.started_at) return
    
    setExportingLogs(true)
    setExportError(null)
    
    try {
      const params = new URLSearchParams({
        player_uuid: observation.player_uuid,
        start_time: observation.started_at,
      })
      if (observation.ended_at) {
        params.set('end_time', observation.ended_at)
      }
      
      const response = await fetch(`/api/admin/logs/export?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anticheat-logs-${observation.player_uuid.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export logs')
    } finally {
      setExportingLogs(false)
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

        <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>
            {OBSERVATION_TYPE_LABELS[observation.observation_type]}
        </h2>
          <span className={`${styles.sourceBadge} ${getSourceBadge(observation.source)}`}>
            {SOURCE_LABELS[observation.source]}
          </span>
        </div>
        <p className={styles.modalSubtitle}>
          Submitted {formatDate(observation.created_at)}
        </p>

        {/* Status */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Current Status</span>
          <div className={styles.statusButtons}>
            {(['new', 'pending', 'reviewed', 'confirmed', 'resolved', 'dismissed'] as ObservationStatus[]).map((status) => (
              <button
                key={status}
                className={`${styles.statusBtn} ${observation.status === status ? styles.statusBtnActive : ''}`}
                onClick={() => onUpdateStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* False Positive specific */}
        {isFalsePositive && observation.finding && (
          <>
            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Detection</span>
              <div className={styles.modalValue}>
                <strong>{observation.finding.title}</strong>
                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>
                  {observation.finding.detector_name} • {observation.finding.occurrences} occurrences
                </div>
              </div>
            </div>

            {observation.player_activity && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>What was player doing?</span>
                <div className={styles.modalValue}>{observation.player_activity}</div>
              </div>
            )}

            {observation.suspected_cause && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Suspected cause</span>
                <div className={styles.modalValue}>{observation.suspected_cause}</div>
              </div>
            )}
          </>
        )}

        {/* Cheat Type (undetected/recording) */}
        {(isUndetected || isRecording) && observation.cheat_type && (
            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Cheat Type</span>
              <div className={styles.modalValue}>
              <strong>{CHEAT_TYPE_LABELS[observation.cheat_type] || observation.cheat_type}</strong>
            </div>
          </div>
        )}

        {/* Label */}
        {observation.label && (
            <div className={styles.modalSection}>
            <span className={styles.modalLabel}>Label</span>
            <div className={styles.modalValue}>{observation.label}</div>
          </div>
        )}

        {/* Player */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Player</span>
          <div className={styles.modalValue}>
            {observation.player_name && <strong>{observation.player_name}</strong>}
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
              {observation.player_uuid}
            </div>
              </div>
            </div>

        {/* Time Window */}
        {observation.started_at && (
            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Time Window</span>
              <div className={styles.modalValue}>
              {formatDate(observation.started_at)}
              {observation.ended_at && ` → ${formatDate(observation.ended_at)}`}
            </div>
          </div>
        )}

        {/* Recorded By (recording specific) */}
        {isRecording && observation.recorded_by_name && (
          <div className={styles.modalSection}>
            <span className={styles.modalLabel}>Recorded By</span>
            <div className={styles.modalValue}>
              {observation.recorded_by_name}
              {observation.recorded_by_uuid && (
                <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
                  {observation.recorded_by_uuid}
              </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Context */}
        {observation.additional_context && (
              <div className={styles.modalSection}>
            <span className={styles.modalLabel}>Additional Context</span>
            <div className={styles.modalValue}>{observation.additional_context}</div>
              </div>
            )}

        {/* Evidence URL */}
        {observation.evidence_url && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Evidence</span>
                <div className={styles.modalValue}>
                  <a
                href={observation.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.evidenceLink}
                  >
                {observation.evidence_url.slice(0, 50)}...
                  </a>
                </div>
              </div>
        )}

        {/* Reporter */}
        {observation.reporter?.email && (
          <div className={styles.modalSection}>
            <span className={styles.modalLabel}>Reporter</span>
            <div className={styles.modalValue}>{observation.reporter.email}</div>
          </div>
        )}

        {/* Server */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Server</span>
          <div className={styles.modalValue}>
            {observation.server?.name || observation.server_id}
          </div>
        </div>

        {/* Admin Notes */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Admin Notes</span>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes about this observation..."
            className={styles.adminNotesInput}
          />
        </div>

        {exportError && (
          <div className={styles.exportError}>
            {exportError}
          </div>
        )}

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <button
            className={`${styles.quickActionBtn} ${copySuccess ? styles.quickActionBtnSuccess : ''}`}
            onClick={handleCopyMarkdown}
            title="Copy as markdown"
          >
            {copySuccess ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy as Markdown
              </>
            )}
          </button>
          
          {(isUndetected || isRecording) && observation.started_at && (
            <button
              className={styles.quickActionBtn}
              onClick={handleExportLogs}
              disabled={exportingLogs}
              title="Export anticheat logs for this timeframe"
            >
              {exportingLogs ? (
                <>
                  <div className={styles.miniSpinner} />
                  Exporting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Logs
                </>
              )}
            </button>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalBtn} onClick={onClose}>
            Close
          </button>
          <button
            className={styles.modalBtnPrimary}
            onClick={() => onUpdateStatus(observation.status, adminNotes)}
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}

function getSourceBadge(source: ObservationSource) {
  switch (source) {
    case 'dashboard':
      return styles.badgeSourceDashboard
    case 'ingame':
      return styles.badgeSourceIngame
    case 'api':
      return styles.badgeSourceApi
    default:
      return ''
  }
}

