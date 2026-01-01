'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './logs.module.css'

interface BatchLog {
  id: string
  server_id: string
  session_id: string | null
  s3_key: string | null
  received_at: string
  payload_bytes: number | null
  event_count: number | null
  min_ts: number | null
  max_ts: number | null
  server?: {
    id: string
    name: string
  }
}

interface Server {
  id: string
  name: string
}

type SortField = 'received_at' | 'event_count' | 'payload_bytes'
type SortDirection = 'asc' | 'desc'

export function LogsContent() {
  const [logs, setLogs] = useState<BatchLog[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<BatchLog | null>(null)
  
  // Filters
  const [serverFilter, setServerFilter] = useState<string>('all')
  const [sessionFilter, setSessionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('received_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 50
  const [totalCount, setTotalCount] = useState(0)

  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  // Fetch servers for filter dropdown
  useEffect(() => {
    const fetchServers = async () => {
      const { data } = await supabase
        .from('servers')
        .select('id, name')
        .order('name')
      setServers(data || [])
    }
    fetchServers()
  }, [supabase])

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)

      // Build query
      let query = supabase
        .from('batch_index')
        .select('*', { count: 'exact' })

      // Apply filters
      if (serverFilter !== 'all') {
        query = query.eq('server_id', serverFilter)
      }

      if (sessionFilter.trim()) {
        query = query.ilike('session_id', `%${sessionFilter.trim()}%`)
      }

      if (dateFrom) {
        query = query.gte('received_at', new Date(dateFrom).toISOString())
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('received_at', endOfDay.toISOString())
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      // Apply pagination
      query = query.range(page * pageSize, (page + 1) * pageSize - 1)

      const { data: logsData, error, count } = await query

      if (error) throw error

      // Fetch server names
      const serverIds = [...new Set(logsData?.map((l) => l.server_id) || [])]
      const { data: serverData } = serverIds.length > 0
        ? await supabase.from('servers').select('id, name').in('id', serverIds)
        : { data: [] }

      // Join server names
      const logsWithServers = (logsData || []).map((log) => ({
        ...log,
        server: serverData?.find((s) => s.id === log.server_id)
      }))

      setLogs(logsWithServers)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching logs:', error)
      setMessage({ type: 'error', text: 'Failed to load logs' })
    } finally {
      setLoading(false)
    }
  }, [supabase, serverFilter, sessionFilter, dateFrom, dateTo, sortField, sortDirection, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [serverFilter, sessionFilter, dateFrom, dateTo])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleDownload = async (log: BatchLog) => {
    if (!log.s3_key) {
      setMessage({ type: 'error', text: 'No S3 key available for this log' })
      return
    }
    
    try {
      setDownloading(log.id)
      
      // The s3_key contains the path in the object store
      // We'll create a download URL using the API
      const response = await fetch(`/api/admin/logs/download?key=${encodeURIComponent(log.s3_key)}`)
      
      if (!response.ok) {
        throw new Error('Failed to download log')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `batch-${log.id.slice(0, 8)}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: 'success', text: 'Log downloaded' })
    } catch (error) {
      console.error('Error downloading log:', error)
      setMessage({ type: 'error', text: 'Failed to download log. The file may not be available.' })
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatMaybeTimestamp = (ts: number | null) => {
    if (ts === null || ts === undefined) return '—'
    // Heuristic: interpret as epoch ms if it looks like epoch milliseconds; otherwise epoch seconds.
    const date = new Date(ts > 100_000_000_000 ? ts : ts * 1000)
    if (Number.isNaN(date.getTime())) return String(ts)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && logs.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading logs...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Logs</h1>
        <p className={styles.pageSubtitle}>Browse and download packet batch logs for debugging</p>
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

      {/* Filters */}
      <div className={styles.filtersPanel}>
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Server</label>
            <select
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All servers</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Session ID</label>
            <input
              type="text"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              placeholder="Search by session..."
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>

        <div className={styles.filtersActions}>
          <button
            className={styles.actionBtnSecondary}
            onClick={() => {
              setServerFilter('all')
              setSessionFilter('')
              setDateFrom('')
              setDateTo('')
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className={styles.panel}>
        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statsInfo}>
            Showing {logs.length} of {totalCount.toLocaleString()} logs
            {loading && <span className={styles.loadingText}> (loading...)</span>}
          </div>
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              ← Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Server</th>
                <th>Session</th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('received_at')}
                >
                  Received {getSortIcon('received_at')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('event_count')}
                >
                  Events {getSortIcon('event_count')}
                </th>
                <th 
                  className={styles.sortableHeader}
                  onClick={() => handleSort('payload_bytes')}
                >
                  Size {getSortIcon('payload_bytes')}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    No logs found matching your filters
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={styles.serverCell}>
                        {log.server?.name || log.server_id.slice(0, 8)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.monoText}>
                        {log.session_id ? `${log.session_id.slice(0, 8)}...` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateCell}>
                        {formatDate(log.received_at)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.countCell}>
                        {log.event_count?.toLocaleString() || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.sizeCell}>
                        {formatBytes(log.payload_bytes)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setSelectedLog(log)}
                        >
                          Details
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleDownload(log)}
                          disabled={downloading === log.id || !log.s3_key}
                        >
                          {downloading === log.id ? 'Downloading...' : 'Download'}
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onDownload={handleDownload}
          downloading={downloading}
          formatDate={formatDate}
          formatBytes={formatBytes}
          formatMaybeTimestamp={formatMaybeTimestamp}
        />
      )}
    </div>
  )
}

function LogDetailModal({
  log,
  onClose,
  onDownload,
  downloading,
  formatDate,
  formatBytes,
  formatMaybeTimestamp
}: {
  log: BatchLog
  onClose: () => void
  onDownload: (log: BatchLog) => void
  downloading: string | null
  formatDate: (date: string) => string
  formatBytes: (bytes: number | null) => string
  formatMaybeTimestamp: (ts: number | null) => string
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const hasDownload = Boolean(log.s3_key)

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

        <h2 className={styles.modalTitle}>Log Details</h2>
        <p className={styles.modalSubtitle}>
          {log.server?.name ? `${log.server.name} • ` : ''}
          Received {formatDate(log.received_at)}
        </p>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Log ID</span>
          <div
            className={styles.modalValue}
            style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}
          >
            {log.id}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Server</span>
          <div className={styles.modalValue}>
            {log.server?.name || log.server_id.slice(0, 8)}
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', marginTop: '0.25rem', wordBreak: 'break-all' }}>
              {log.server_id}
            </div>
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Session ID</span>
          <div
            className={styles.modalValue}
            style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}
          >
            {log.session_id || '—'}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Received At</span>
          <div className={styles.modalValue}>
            {formatDate(log.received_at)}
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
              {new Date(log.received_at).toISOString()}
            </div>
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Events</span>
          <div className={styles.modalValue}>{log.event_count?.toLocaleString() || '—'}</div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Payload Size</span>
          <div className={styles.modalValue}>{formatBytes(log.payload_bytes)}</div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Time Window</span>
          <div className={styles.modalValue}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Min</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.min_ts ?? '—'}</div>
                {log.min_ts !== null && log.min_ts !== undefined && (
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.125rem' }}>
                    {formatMaybeTimestamp(log.min_ts)}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Max</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.max_ts ?? '—'}</div>
                {log.max_ts !== null && log.max_ts !== undefined && (
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.125rem' }}>
                    {formatMaybeTimestamp(log.max_ts)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Object Key</span>
          <div
            className={styles.modalValue}
            style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}
          >
            {log.s3_key || '—'}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalBtn} onClick={onClose}>
            Close
          </button>
          <button
            className={styles.modalBtnPrimary}
            onClick={() => onDownload(log)}
            disabled={!hasDownload || downloading === log.id}
            title={!hasDownload ? 'No S3 key available for this log' : undefined}
          >
            {downloading === log.id ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
