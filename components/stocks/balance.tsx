'use client'

import { formatUnits } from '@/lib/starknet/utils'
import { TokenInfo } from '@/lib/starknet/voyager'
import { ExternalLinkIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

interface BalanceProps {
  token: TokenInfo
  balance: bigint | null
}

export function Balance(props: BalanceProps) {
  if (!props.balance) {
    return (
      <div className="rounded-xl border bg-background p-4 flex flex-col gap-4">
        <div className="bg-muted p-4 rounded-md flex flex-col gap-4">
          Could not fetch token balance for unknown token {props.token.name}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-background p-4 flex flex-col gap-4">
      <div className="bg-muted p-4 rounded-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold">Token:</span>
          <Link
            href={`https://sepolia.voyager.online/contract/${props.token.address}`}
            target="_blank"
            className="flex items-center"
          >
            {props.token.name}
            <ExternalLinkIcon className="size-4 ml-2" />
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold">Balance:</span>
          <span className="flex items-center">
            {parseFloat(formatUnits(props.balance, props.token.decimals))}{' '}
            {props.token.symbol}
          </span>
        </div>
      </div>
    </div>
  )
}
