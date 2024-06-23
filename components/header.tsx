import { DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { FeeBalance } from './fee-balance'

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <DynamicWidget />
      </div>
      <FeeBalance />
    </header>
  )
}
