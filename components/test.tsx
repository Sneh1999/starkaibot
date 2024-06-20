'use client'

import { getTransactionSimulation } from '@/lib/starknet/nethermind'
import { Button } from './ui/button'
import { useStarknet } from '@/lib/hooks/use-starknet'

export function Test() {
  const { transfer, swap } = useStarknet()

  return (
    <>
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
        onClick={() => {
          void getTransactionSimulation({
            transactionHash:
              '0x07aeb396a19f724020684b456fe34680c60f487414185007f71c2a996966ba12'
          })
        }}
      >
        Get Transaction Simulation
      </Button>
    </>
  )
}
