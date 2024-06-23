'use client'

import { useStarknet } from '@/lib/hooks/use-starknet'

export function FeeBalance() {
  const { feeBalance } = useStarknet()
  return (
    <span className="text-sm border px-4 py-2 rounded-md">
      Fee Balance: {(feeBalance / BigInt(10 ** 18)).toLocaleString()} STRKBOT
    </span>
  )
}
