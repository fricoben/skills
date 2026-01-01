'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import styles from './servers.module.css'

interface Server {
  id: string
  name: string
  platform: string | null
  owner_user_id: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  registered_at: string | null
  webhook_enabled: boolean | null
  owner?: {
    email: string | null
    full_name: string | null
    avatar_url: string | null
  }
  module_count?: number
  player_count?: number
  finding_count?: number
}

export function ServersContent() {
  const [servers, setServers] = useState<Server[]>([])
  const [filteredServers, setFilteredServers] = useState<Server[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch servers
      const { data: serversData, error: serversError } = await supabase
        .from('servers')
        .select('*')
        .order('registered_at', { ascending: false })

      if (serversError) throw serversError

      // Fetch owner profiles
      const ownerIds = serversData?.map((s) => s.owner_user_id).filter(Boolean) || []
      const { data: profiles } = ownerIds.length > 0
        ? await supabase.from('profiles').select('id, email, full_name, avatar_url').in('id', ownerIds)
        : { data: [] }

      // Fetch server modules count
      const { data: moduleCounts } = await supabase
        .from('server_modules')
        .select('server_id')

      // Fetch player counts per server
      const { data: playerCounts } = await supabase
        .from('players')
        .select('server_id')

      // Fetch finding counts per server
      const { data: findingCounts } = await supabase
        .from('findings')
        .select('server_id')

      // Aggregate counts
      const moduleCountMap: Record<string, number> = {}
      moduleCounts?.forEach((m) => {
        moduleCountMap[m.server_id] = (moduleCountMap[m.server_id] || 0) + 1
      })

      const playerCountMap: Record<string, number> = {}
      playerCounts?.forEach((p) => {
        playerCountMap[p.server_id] = (playerCountMap[p.server_id] || 0) + 1
      })

      const findingCountMap: Record<string, number> = {}
      findingCounts?.forEach((f) => {
        findingCountMap[f.server_id] = (findingCountMap[f.server_id] || 0) + 1
      })

      // Join data
      const serversWithJoins: Server[] = (serversData || []).map((server) => ({
        ...server,
        owner: profiles?.find((p) => p.id === server.owner_user_id),
        module_count: moduleCountMap[server.id] || 0,
        player_count: playerCountMap[server.id] || 0,
        finding_count: findingCountMap[server.id] || 0
      }))

      setServers(serversWithJoins)
      setFilteredServers(serversWithJoins)
    } catch (error) {
      console.error('Error fetching servers:', error)
      setMessage({ type: 'error', text: 'Failed to load servers' })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  // Filter servers based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServers(servers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = servers.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.owner?.email?.toLowerCase().includes(query) ||
          s.owner?.full_name?.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      )
      setFilteredServers(filtered)
    }
  }, [searchQuery, servers])

  // Auto-hide success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const isServerActive = (server: Server) => {
    // Server is considered active if it was seen in the last 24 hours
    if (!server.last_seen_at) return false
    const lastSeen = new Date(server.last_seen_at)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return lastSeen > dayAgo
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const activeCount = servers.filter((s) => isServerActive(s)).length
  const totalPlayers = servers.reduce((acc, s) => acc + (s.player_count || 0), 0)
  const totalFindings = servers.reduce((acc, s) => acc + (s.finding_count || 0), 0)

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading servers...</p>
      </div>
    )
  }

  return (
    <div className={styles.content}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Servers</h1>
        <p className={styles.pageSubtitle}>Manage registered AsyncAnticheat servers</p>
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{servers.length}</div>
          <div className={styles.statLabel}>Total Servers</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{activeCount}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalPlayers.toLocaleString()}</div>
          <div className={styles.statLabel}>Players Tracked</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalFindings.toLocaleString()}</div>
          <div className={styles.statLabel}>Findings</div>
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
              placeholder="Search by server name, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Server</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Modules</th>
                <th>Players</th>
                <th>Findings</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServers.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyRow}>
                    No servers found
                  </td>
                </tr>
              ) : (
                filteredServers.map((server) => (
                  <tr key={server.id}>
                    {/* Server */}
                    <td>
                      <div className={styles.serverCell}>
                        <div className={styles.serverName}>{server.name || 'Unnamed'}</div>
                        <div className={styles.serverId}>{server.id.slice(0, 8)}...</div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td>
                      <div className={styles.userCell}>
                        {server.owner?.avatar_url ? (
                          <img
                            src={server.owner.avatar_url}
                            alt=""
                            className={styles.userAvatarImg}
                          />
                        ) : (
                          <div className={styles.userAvatar}>
                            {(server.owner?.email || server.owner?.full_name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>
                            {server.owner?.full_name || server.owner?.email?.split('@')[0] || 'Unknown'}
                          </div>
                          <div className={styles.userEmail}>{server.owner?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={isServerActive(server) ? styles.badgeActive : styles.badgeInactive}>
                        {isServerActive(server) ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Modules */}
                    <td>
                      <span className={styles.countCell}>{server.module_count}</span>
                    </td>

                    {/* Players */}
                    <td>
                      <span className={styles.countCell}>{server.player_count?.toLocaleString()}</span>
                    </td>

                    {/* Findings */}
                    <td>
                      <span className={styles.countCell}>{server.finding_count?.toLocaleString()}</span>
                    </td>

                    {/* Registered */}
                    <td>
                      <span className={styles.dateCell}>
                        {server.registered_at ? formatDate(server.registered_at) : '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setSelectedServer(server)}
                        >
                          Details
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

      {/* Server Detail Modal */}
      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          onClose={() => setSelectedServer(null)}
          formatDate={formatDate}
          isServerActive={isServerActive}
        />
      )}
    </div>
  )
}

function ServerDetailModal({
  server,
  onClose,
  formatDate,
  isServerActive
}: {
  server: Server
  onClose: () => void
  formatDate: (date: string) => string
  isServerActive: (server: Server) => boolean
}) {
  const [modules, setModules] = useState<Array<{
    id: string
    name: string
    base_url: string
    enabled: boolean
  }>>([])
  const [loadingModules, setLoadingModules] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchModules = async () => {
      const { data } = await supabase
        .from('server_modules')
        .select('id, name, base_url, enabled')
        .eq('server_id', server.id)
        .order('name')
      
      setModules(data || [])
      setLoadingModules(false)
    }
    fetchModules()
  }, [server.id, supabase])

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

        <h2 className={styles.modalTitle}>{server.name || 'Server Details'}</h2>
        <p className={styles.modalSubtitle}>
          {server.registered_at ? `Registered ${formatDate(server.registered_at)}` : 'Not registered'}
        </p>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Server ID</span>
          <div className={styles.modalValue} style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {server.id}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Platform</span>
          <div className={styles.modalValue}>
            {server.platform || '—'}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Owner</span>
          <div className={styles.modalValue}>
            {server.owner?.full_name || server.owner?.email || 'Unknown'}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Status</span>
          <div className={styles.modalValue}>
            <span className={isServerActive(server) ? styles.badgeActive : styles.badgeInactive}>
              {isServerActive(server) ? 'Active' : 'Inactive'}
            </span>
            {server.last_seen_at && (
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                Last seen: {formatDate(server.last_seen_at)}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Statistics</span>
          <div className={styles.modalStatsRow}>
            <div className={styles.modalStat}>
              <span className={styles.modalStatValue}>{server.player_count?.toLocaleString() || 0}</span>
              <span className={styles.modalStatLabel}>Players</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatValue}>{server.finding_count?.toLocaleString() || 0}</span>
              <span className={styles.modalStatLabel}>Findings</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatValue}>{server.module_count || 0}</span>
              <span className={styles.modalStatLabel}>Modules</span>
            </div>
          </div>
        </div>

        <div className={styles.modalSection}>
          <span className={styles.modalLabel}>Modules</span>
          {loadingModules ? (
            <div className={styles.modalValue}>Loading...</div>
          ) : modules.length === 0 ? (
            <div className={styles.modalValue} style={{ color: '#888', fontStyle: 'italic' }}>
              No modules configured
            </div>
          ) : (
            <div className={styles.modulesList}>
              {modules.map((mod) => (
                <div key={mod.id} className={styles.moduleItem}>
                  <div className={styles.moduleInfo}>
                    <span className={styles.moduleName}>{mod.name}</span>
                  </div>
                  <span className={mod.enabled ? styles.badgeActive : styles.badgeInactive}>
                    {mod.enabled ? 'On' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
