'use client'

import dynamic from 'next/dynamic'
import { EventsSkeleton } from './events-skeleton'
import { SpinnerMessage } from './message'

export { spinner } from './spinner'
export { BotCard, BotMessage, SystemMessage } from './message'

const Swap = dynamic(() => import('./swap').then(mod => mod.Swap), {
  ssr: false,
  loading: () => <SpinnerMessage />
})

export { Swap }
