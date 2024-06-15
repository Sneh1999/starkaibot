'use client'

import dynamic from 'next/dynamic'
import { SwapSkeleton } from './swap-skeleton'
import { EventsSkeleton } from './events-skeleton'

export { spinner } from './spinner'
export { BotCard, BotMessage, SystemMessage } from './message'

const Swap = dynamic(() => import('./swap').then(mod => mod.Swap), {
  ssr: false,
  loading: () => <SwapSkeleton />
})

export { Swap }
