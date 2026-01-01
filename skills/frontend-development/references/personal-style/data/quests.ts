export type QuestStatus = 'not_started' | 'in_progress' | 'completed'

export type Quest = {
  id: string
  title: string
  status: QuestStatus
  progress?: number // 0-100
  category?: string
}

export const quests: Quest[] = [
  {
    id: 'soviet-fighter-jet',
    title: 'Rent a soviet fighter jet to go to the edge of space',
    status: 'not_started',
    category: 'Experiences'
  },
  {
    id: 'center-of-the-world',
    title: 'Go to the small island near Sao Tome at center of the world',
    status: 'completed',
    category: 'Experiences'
  },
  {
    id: 'ppl-license',
    title: 'Get a private pilot license',
    status: 'not_started',
    category: 'Skills'
  },
  {
    id: 'garage-lab-workshop',
    title: 'Buy a garage and build a lab and workshop',
    status: 'not_started',
    category: 'Engineering'
  },
  {
    id: 'discover-species',
    title: 'Discover a new animal species and chose its name',
    status: 'in_progress',
    category: 'Biology'
  },
  {
    id: 'master-spearfishing',
    title: 'Master spearfishing',
    status: 'in_progress',
    category: 'Skills'
  },
  {
    id: 'make-sashimi',
    title: 'Make sashimi with my own fish',
    status: 'in_progress',
    category: 'Food'
  },
  {
    id: 'acrobat-ants',
    title: 'Grow a colony of acrobat ants in my appartment',
    status: 'in_progress',
    category: 'Biology'
  },
  {
    id: 'gmo-bacteria',
    title: 'Create a GMO bacteria',
    status: 'in_progress',
    category: 'Biology'
  },
  {
    id: 'nomadic-games',
    title: 'Go to nomadic games with my brother',
    status: 'not_started',
    category: 'Experiences'
  },
  {
    id: 'build-drone',
    title: 'Building a drone from scratch',
    status: 'in_progress',
    category: 'Engineering'
  },
  {
    id: 'marathon',
    title: 'Run a marathon',
    status: 'completed',
    category: 'Sport'
  },
  {
    id: 'open-water-certified',
    title: 'Get open water certified',
    status: 'completed',
    category: 'Skills'
  },
  {
    id: 'ferments',
    title: 'Create my own fermented kefir, kombucha and various yogurts',
    status: 'completed',
    category: 'Food'
  },
  {
    id: 'bungee-victoria-falls',
    title: 'Bungee jumping from Victoria Falls, Zimbabwe',
    status: 'completed',
    category: 'Experiences'
  },
  {
    id: 'parachute-jump',
    title: 'Parachute jump',
    status: 'completed',
    category: 'Experiences'
  },
  {
    id: 'swim-long-distance',
    title: 'Swim a long distance like Africa to Europe',
    status: 'not_started',
    category: 'Sport'
  },
  {
    id: 'basil-self-sufficient',
    title: 'Become basil self-sufficient',
    status: 'in_progress',
    category: 'Biology'
  },
  {
    id: 'cook-peacock',
    title: 'Cooking a peacock',
    status: 'not_started',
    category: 'Food'
  },
  {
    id: 'japanese-knives',
    title: 'Get knives from a legendary knife maker in Japan',
    status: 'completed',
    category: 'Experiences'
  },
  {
    id: 'learn-portuguese',
    title: 'Learn Portuguese',
    status: 'in_progress',
    category: 'Skills'
  },
  {
    id: 'explore-catacombs',
    title: 'Explore catacombs',
    status: 'not_started',
    category: 'Experiences'
  }
]
