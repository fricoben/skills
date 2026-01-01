import type { Metadata } from 'next'
import { quests } from '../../data/quests'
import QuestsBoard from './QuestsBoard'

export const metadata: Metadata = {
  title: 'Quests'
}

function statusLabel(s: string): string {
  if (s === 'completed') return 'Completed'
  if (s === 'in_progress') return 'In progress'
  return 'Not started'
}

export default function QuestsPage() {
  return <QuestsBoard quests={quests} />
}
