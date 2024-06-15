'use client'

import { Button } from './ui/button'
import { useStarknet } from '@/lib/hooks/use-starknet'

export function Test() {
  const { transferToken } = useStarknet()

  return (
    <Button
      onClick={() => {
        void transferToken({
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
  )
}
