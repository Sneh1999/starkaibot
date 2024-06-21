'use client'

import { Button } from './ui/button'
import { useStarknet } from '@/lib/hooks/use-starknet'

export function Test() {
  const { transfer, swap, feeBalance } = useStarknet()

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm border p-4 rounded-md">
        Fee Balance: {(feeBalance / BigInt(10 ** 18)).toLocaleString()} STRKBOT
      </span>
      <Button
        onClick={() => {
          void transfer({
            tokenName: 'Ether',
            amount: 100000,
            recipient:
              '0x072afB63Cb5C2b7B2Cd4958408Ca9BDF7ef4f1eb7162E132c10143Ce311549D2'
          })
        }}
      >
        Transfer Tokens
      </Button>
      <Button
        variant={'secondary'}
        onClick={() => {
          void swap({
            inputTokenAddress:
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            outputTokenAddress:
              '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            amount: BigInt(10e14)
          })
        }}
      >
        Swap 0.0001 ETH for STRK
      </Button>
    </div>
  )
}
