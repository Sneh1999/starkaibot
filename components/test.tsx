'use client'

import { Button } from './ui/button'
import { useStarknet } from '@/lib/hooks/use-starknet'

export function Test() {
  const { transfer, swap } = useStarknet()

  return (
    <>
      <Button
        onClick={() => {
          void transfer({
            tokenAddress:
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            amount: 100000,
            recipient:
              '0x072afB63Cb5C2b7B2Cd4958408Ca9BDF7ef4f1eb7162E132c10143Ce311549D2'
          })
        }}
      >
        Transfer Tokens
      </Button>
      <Button
        onClick={() => {
          void swap({
            inputTokenAddress:
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            outputTokenAddress:
              '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
            amount: BigInt(100000)
          })
        }}
      >
        Swap ETH for STRK
      </Button>
    </>
  )
}
