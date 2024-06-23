'use client'

import { formatUnits } from '@/lib/starknet/utils'
import { TokenInfo } from '@/lib/starknet/voyager'
import { ExternalLinkIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { sendToken } from '@/lib/starknet/send'
import { useStarknet } from '@/lib/hooks/use-starknet'
import { toast } from 'sonner'

interface SendProps {
  recipient: string
  amount: bigint
  token: TokenInfo
}

export function Send(props: SendProps) {
  const { transfer } = useStarknet()

  return (
    <div className="rounded-xl border bg-background p-4 flex flex-col gap-4">
      <div className="bg-muted p-4 rounded-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-bold">To:</span>
          <Link
            href={`https://sepolia.voyager.online/contract/${props.recipient}`}
            target="_blank"
            className="flex items-center"
          >
            {props.recipient.substring(0, 8)}...{props.recipient.substring(60)}
            <ExternalLinkIcon className="size-4 ml-2" />
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold">Amount:</span>
          <span className="flex items-center text-red-900 dark:text-red-400">
            -{parseFloat(formatUnits(props.amount, props.token.decimals))}{' '}
            {props.token.symbol}
          </span>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md flex flex-col gap-2">
        <span className="font-medium">
          Simulation Results{' '}
          <Tooltip>
            <TooltipTrigger>
              <InfoCircledIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              Run a simulation using Nethermind to understand the result of this
              transaction.
            </TooltipContent>
          </Tooltip>
        </span>

        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            toast.info('Coming Soon!', {
              description: 'Simulation is not yet available.'
            })
          }}
        >
          Simulate
        </Button>
      </div>

      <Button
        variant={'secondary'}
        onClick={() => {
          void transfer({
            tokenAddress: props.token.address,
            recipient: props.recipient,
            amount: props.amount
          })
        }}
      >
        Confirm Transfer
      </Button>
    </div>
  )
}
