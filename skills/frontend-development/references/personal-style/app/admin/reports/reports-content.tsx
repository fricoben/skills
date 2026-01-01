'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './reports.module.css'

type ReportStatus = 'new' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'
type TabType = 'false_positives' | 'undetected'

interface FalsePositiveReport {
  id: string
  finding_id: string
  server_id: string
  reporter_user_id: string | null
  player_activity: string | null
  suspected_cause: string | null
  additional_context: string | null
  status: ReportStatus
  admin_notes: string | null
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
}

interface UndetectedCheatReport {
  id: string
  server_id: string
  player_uuid: string
  session_id: string | null
  reporter_user_id: string | null
  cheat_type: string
  cheat_description: string | null
  occurred_at_start: string
  occurred_at_end: string | null
  additional_context: string | null
  evidence_url: string | null
  status: ReportStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  reporter?: {
    email: string | null
    full_name: string | null
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

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState<TabType>('false_positives')
  const [falsePositives, setFalsePositives] = useState<FalsePositiveReport[]>([])
  const [undetectedCheats, setUndetectedCheats] = useState<UndetectedCheatReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [selectedReport, setSelectedReport] = useState<FalsePositiveReport | UndetectedCheatReport | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch false positive reports
      const { data: fpData, error: fpError } = await supabase
        .from('false_positive_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (fpError) throw fpError

      // Fetch undetected cheat reports
      const { data: ucData, error: ucError } = await supabase
        .from('undetected_cheat_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (ucError) throw ucError

      // Fetch findings for false positive reports
      const findingIds = fpData?.map((r) => r.finding_id).filter(Boolean) || []
      const { data: findings } = findingIds.length > 0
        ? await supabase.from('findings').select('id, player_uuid, detector_name, title, occurrences').in('id', findingIds)
        : { data: [] }

      // Fetch reporter profiles
      const reporterIds = [
        ...(fpData?.map((r) => r.reporter_user_id).filter(Boolean) || []),
        ...(ucData?.map((r) => r.reporter_user_id).filter(Boolean) || [])
      ]
      const { data: profiles } = reporterIds.length > 0
        ? await supabase.from('profiles').select('id, email, full_name').in('id', reporterIds)
        : { data: [] }

      // Join data
      const fpWithJoins: FalsePositiveReport[] = (fpData || []).map((r) => ({
        ...r,
        finding: findings?.find((f) => f.id === r.finding_id),
        reporter: profiles?.find((p) => p.id === r.reporter_user_id)
      }))

      const ucWithJoins: UndetectedCheatReport[] = (ucData || []).map((r) => ({
        ...r,
        reporter: profiles?.find((p) => p.id === r.reporter_user_id)
      }))

      setFalsePositives(fpWithJoins)
      setUndetectedCheats(ucWithJoins)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setMessage({ type: 'error', text: 'Failed to load reports' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const updateReportStatus = async (
    table: 'false_positive_reports' | 'undetected_cheat_reports',
    id: string,
    status: ReportStatus,
    adminNotes?: string
  ) => {
    try {
      const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Report updated' })
      setSelectedReport(null)
      fetchReports()
    } catch (error) {
      console.error('Error updating report:', error)
      setMessage({ type: 'error', text: 'Failed to update report' })
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

  const getStatusBadge = (status: ReportStatus | string) => {
    switch (status) {
      case 'new':
      case 'pending':
        return styles.badgeNew
      case 'reviewed':
        return styles.badgeReviewed
      case 'resolved':
        return styles.badgeResolved
      case 'dismissed':
        return styles.badgeDismissed
      default:
        return styles.badgeNew
    }
  }

  // Filter reports
  const filteredFP = falsePositives.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        r.finding?.detector_name?.toLowerCase().includes(query) ||
        r.finding?.title?.toLowerCase().includes(query) ||
        r.reporter?.email?.toLowerCase().includes(query) ||
        r.finding?.player_uuid?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const filteredUC = undetectedCheats.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        r.cheat_type?.toLowerCase().includes(query) ||
        r.cheat_description?.toLowerCase().includes(query) ||
        r.reporter?.email?.toLowerCase().includes(query) ||
        r.player_uuid?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const fpNewCount = falsePositives.filter((r) => r.status === 'new').length
  const ucNewCount = undetectedCheats.filter((r) => r.status === 'new').length

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading reports...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AsyncAnticheat Reports</h1>
        <p className={styles.pageSubtitle}>Review false positives and undetected cheat reports</p>
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

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'false_positives' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('false_positives')}
          >
            False Positives
            {fpNewCount > 0 && <span className={styles.tabBadge}>{fpNewCount}</span>}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'undetected' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('undetected')}
          >
            Undetected Cheats
            {ucNewCount > 0 && <span className={styles.tabBadge}>{ucNewCount}</span>}
          </button>
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
              placeholder="Search by detector, cheat type, player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            className={styles.filterSelect}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {activeTab === 'false_positives' ? filteredFP.length : filteredUC.length}
              </span>
              <span>reports</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {activeTab === 'false_positives' ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Detection</th>
                  <th>Player</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFP.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      No false positive reports found
                    </td>
                  </tr>
                ) : (
                  filteredFP.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className={styles.detectionCell}>
                          <div className={styles.detectionTitle}>
                            {report.finding?.title || 'Unknown Detection'}
                          </div>
                          <div className={styles.detectionMeta}>
                            {report.finding?.detector_name || 'Unknown detector'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.monoText}>
                          {report.finding?.player_uuid?.slice(0, 8) || '—'}...
                        </span>
                      </td>
                      <td>
                        <span className={styles.reporterCell}>
                          {report.reporter?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(report.status)}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateCell}>
                          {formatDate(report.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setSelectedReport(report)}
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
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cheat Type</th>
                  <th>Player</th>
                  <th>Reporter</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUC.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      No undetected cheat reports found
                    </td>
                  </tr>
                ) : (
                  filteredUC.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div className={styles.cheatCell}>
                          <span className={styles.cheatType}>
                            {CHEAT_TYPE_LABELS[report.cheat_type] || report.cheat_type}
                          </span>
                          {report.cheat_description && (
                            <div className={styles.cheatDesc}>
                              {report.cheat_description.slice(0, 50)}
                              {report.cheat_description.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.monoText}>
                          {report.player_uuid?.slice(0, 8) || '—'}...
                        </span>
                      </td>
                      <td>
                        <span className={styles.reporterCell}>
                          {report.reporter?.email?.split('@')[0] || 'Anonymous'}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(report.status)}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <span className={styles.dateCell}>
                          {formatDate(report.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setSelectedReport(report)}
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
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          type={activeTab}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={(status, notes) =>
            updateReportStatus(
              activeTab === 'false_positives'
                ? 'false_positive_reports'
                : 'undetected_cheat_reports',
              selectedReport.id,
              status,
              notes
            )
          }
          formatDate={formatDateLong}
        />
      )}
    </div>
  )
}

function ReportDetailModal({
  report,
  type,
  onClose,
  onUpdateStatus,
  formatDate
}: {
  report: FalsePositiveReport | UndetectedCheatReport
  type: TabType
  onClose: () => void
  onUpdateStatus: (status: ReportStatus, notes?: string) => void
  formatDate: (date: string) => string
}) {
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || '')

  const isFalsePositive = type === 'false_positives'
  const fp = isFalsePositive ? (report as FalsePositiveReport) : null
  const uc = !isFalsePositive ? (report as UndetectedCheatReport) : null

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
          {isFalsePositive ? 'False Positive Report' : 'Undetected Cheat Report'}
        </h2>
        <p className={styles.modalSubtitle}>
          Submitted {formatDate(report.created_at)}
        </p>

        {/* Status */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Current Status</span>
          <div className={styles.statusButtons}>
            {(['pending', 'new', 'reviewed', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
              <button
                key={status}
                className={`${styles.statusBtn} ${report.status === status ? styles.statusBtnActive : ''}`}
                onClick={() => onUpdateStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* False Positive specific */}
        {fp && (
          <>
            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Detection</span>
              <div className={styles.modalValue}>
                <strong>{fp.finding?.title || 'Unknown'}</strong>
                <div style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>
                  {fp.finding?.detector_name}
                </div>
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Player UUID</span>
              <div className={styles.modalValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {fp.finding?.player_uuid || '—'}
              </div>
            </div>

            {fp.player_activity && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>What was player doing?</span>
                <div className={styles.modalValue}>{fp.player_activity}</div>
              </div>
            )}

            {fp.suspected_cause && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Suspected cause</span>
                <div className={styles.modalValue}>{fp.suspected_cause}</div>
              </div>
            )}
          </>
        )}

        {/* Undetected Cheat specific */}
        {uc && (
          <>
            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Cheat Type</span>
              <div className={styles.modalValue}>
                <strong>{CHEAT_TYPE_LABELS[uc.cheat_type] || uc.cheat_type}</strong>
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Player UUID</span>
              <div className={styles.modalValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {uc.player_uuid}
              </div>
            </div>

            <div className={styles.modalSection}>
              <span className={styles.modalLabel}>Time Window</span>
              <div className={styles.modalValue}>
                {formatDate(uc.occurred_at_start)}
                {uc.occurred_at_end && ` → ${formatDate(uc.occurred_at_end)}`}
              </div>
            </div>

            {uc.cheat_description && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Description</span>
                <div className={styles.modalValue}>{uc.cheat_description}</div>
              </div>
            )}

            {uc.evidence_url && (
              <div className={styles.modalSection}>
                <span className={styles.modalLabel}>Evidence</span>
                <div className={styles.modalValue}>
                  <a
                    href={uc.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.evidenceLink}
                  >
                    {uc.evidence_url.slice(0, 50)}...
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Additional Context */}
        {report.additional_context && (
          <div className={styles.modalSection}>
            <span className={styles.modalLabel}>Additional Context</span>
            <div className={styles.modalValue}>{report.additional_context}</div>
          </div>
        )}

        {/* Reporter */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Reporter</span>
          <div className={styles.modalValue}>
            {(report as FalsePositiveReport).reporter?.email ||
              (report as UndetectedCheatReport).reporter?.email ||
              'Anonymous'}
          </div>
        </div>

        {/* Admin Notes */}
        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Admin Notes</span>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes about this report..."
            className={styles.adminNotesInput}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalBtn} onClick={onClose}>
            Close
          </button>
          <button
            className={styles.modalBtnPrimary}
            onClick={() => onUpdateStatus(report.status, adminNotes)}
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}
