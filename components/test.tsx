'use client'

import { Button } from './ui/button'
import { useStarknet } from '@/lib/hooks/use-starknet'

export function Test() {
  const { transfer, swap } = useStarknet()

  return (
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
  )
}
