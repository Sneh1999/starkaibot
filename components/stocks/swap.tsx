'use client'

import { useStarknet } from '@/lib/hooks/use-starknet'
import { SwapRoute } from '@/lib/starknet/swap'
import {
  formatUnits,
  getStarkBotSwapCall,
  getStarkBotTokenApprovalCall
} from '@/lib/starknet/utils'
import { TokenInfo } from '@/lib/starknet/voyager'
import { ChevronDownIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { AccountInvocations, TransactionType, num } from 'starknet'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { toast } from 'sonner'

interface SwapProps extends SwapRoute {
  inputToken: TokenInfo
  outputToken: TokenInfo
}

export function Swap(props: SwapProps) {
  const { swap } = useStarknet()

  // async function simulateSwap() {
  //   const zeroForOne =
  //     num.cleanHex(props.route[0].pool_key.token0) ===
  //     num.cleanHex(props.inputTokenAddress)

  //   console.log({ props })
  //   const calls = [
  //     // First call transfers the input token to the starkbot contract
  //     getStarkBotTokenApprovalCall({
  //       amount: BigInt(props.specifiedAmount),
  //       tokenAddress: props.inputTokenAddress
  //     }),

  //     // Then calls the swap function on the starkbot contract
  //     // NOTE: We only support single-hop swaps for now
  //     getStarkBotSwapCall(props, zeroForOne)
  //   ]

  //   await simulate(calls)
  // }

  return (
    <div className="rounded-xl border bg-background p-4 flex flex-col gap-4">
      <div className="bg-muted p-4 text-red-900 dark:text-red-400 rounded-md flex items-center justify-between">
        <span className="text-2xl">
          {props.inputToken.name} ({props.inputToken.symbol})
        </span>

        <span className="text-2xl">
          {parseFloat(
            formatUnits(
              BigInt(props.specifiedAmount),
              props.inputToken.decimals
            )
          ).toFixed(4)}{' '}
        </span>
      </div>

      <ChevronDownIcon className="size-6 mx-auto" />

      <div className="bg-muted text-green-900 dark:text-green-400 p-4 rounded-md flex items-center justify-between">
        <span className="text-2xl">
          {props.outputToken.name} ({props.outputToken.symbol})
        </span>

        <span className="text-2xl">
          {parseFloat(
            formatUnits(BigInt(props.amount), props.outputToken.decimals)
          ).toFixed(4)}{' '}
        </span>
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
          swap({
            inputTokenAddress: props.inputTokenAddress,
            outputTokenAddress: props.outputTokenAddress,
            amount: BigInt(props.specifiedAmount),
            route: props
          })
        }}
      >
        Confirm Swap
      </Button>
    </div>
  )
}
