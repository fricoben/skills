'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Quest } from '../../data/quests'

type Props = {
  quests: Quest[]
}

const STATUS_ORDER: Array<{ key: Quest['status']; label: string }> = [
  { key: 'not_started', label: 'QUEUED' },
  { key: 'in_progress', label: 'RUNNING' },
  { key: 'completed', label: 'COMPLETED' }
]

export default function QuestsBoard({ quests }: Props) {
  const [visibleStatuses, setVisibleStatuses] = useState<Set<Quest['status']>>(
    () => new Set<Quest['status']>(['not_started', 'in_progress', 'completed'])
  )

  const byStatus = useMemo(() => {
    return {
      not_started: quests.filter((q) => q.status === 'not_started'),
      in_progress: quests.filter((q) => q.status === 'in_progress'),
      completed: quests.filter((q) => q.status === 'completed')
    }
  }, [quests])

  const categories = useMemo(
    () => Array.from(new Set(quests.map((q) => q.category || 'Other'))),
    [quests]
  )

  const isStatusVisible = (status: Quest['status']) =>
    visibleStatuses.has(status)

  const statusRank: Record<Quest['status'], number> = {
    in_progress: 0, // RUNNING first
    not_started: 1, // QUEUED second
    completed: 2 // COMPLETED last
  }

  return (
    <div className="quests-retro">
      <header className="qr-header">
        <h1>My Quest Board</h1>
        <p className="qr-context">
          For context you can read{' '}
          <Link href="/posts/how-to-play-the-game">How to play the game</Link>.
          If you want to suggest something or join me on an adventure, please
          reach out at hey@thomas.md.
        </p>
        <div className="qr-divider" />
        <div className="qr-counters">
          {STATUS_ORDER.map((s) => (
            <button
              key={s.key}
              className={`qr-counter qr-filter${
                isStatusVisible(s.key) ? ' is-active' : ''
              }`}
              onClick={() => {
                setVisibleStatuses((prev) => {
                  const next = new Set(prev)
                  if (next.has(s.key)) next.delete(s.key)
                  else next.add(s.key)
                  return next
                })
              }}
              type="button"
            >
              <span className="qr-counter-label">{s.label}</span>
              <span className="qr-counter-value">{byStatus[s.key].length}</span>
            </button>
          ))}
        </div>
      </header>

      <section className="qr-section">
        {categories.map((cat) => {
          const items = quests
            .filter((q) => (q.category || 'Other') === cat)
            .filter((q) => isStatusVisible(q.status))
            .slice()
            .sort((a, b) => statusRank[a.status] - statusRank[b.status])
          if (!items.length) return null
          return (
            <div className="qr-category" key={`cat-${cat}`}>
              <div className="qr-category-head">
                <span className="qr-category-label">{cat}</span>
                <div className="qr-category-line" />
              </div>
              <ul className="qr-grid">
                {items.map((q) => (
                  <li key={q.id} className={`qr-card status-${q.status}`}>
                    <div className="qr-card-head">
                      <span className="qr-card-title">{q.title}</span>
                    </div>
                    <div className={`qr-chip chip-${q.status}`}>
                      {STATUS_ORDER.find((s) => s.key === q.status)?.label}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </section>
    </div>
  )
}
