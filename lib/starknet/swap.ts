import { Wallet } from '@dynamic-labs/sdk-react-core'
import StarknetWalletConnector from '@dynamic-labs/starknet/src/starknetWalletConnector'
import { Call, Contract, num } from 'starknet'

import EKUBO_ROUTER_ABI from './abis/ekubo-router.json'

const EKUBO_ROUTER_ADDRESS =
  '0x0045f933adf0607292468ad1c1dedaa74d5ad166392590e72676a34d01d7b763'
const EKUBO_API_QUOTE_URL = 'https://sepolia-api.ekubo.org/quote'

export interface SwapTokensArgs {
  wallet: Wallet | null
  inputTokenAddress: string
  outputTokenAddress: string
  amount: bigint
}

export async function swapTokens({
  wallet,
  inputTokenAddress,
  outputTokenAddress,
  amount
}: SwapTokensArgs) {
  if (!wallet) throw new Error('No wallet provided')
  const starknetConnector = wallet.connector as StarknetWalletConnector

  const provider = await starknetConnector.getPublicClient()
  if (!provider) throw new Error('No provider found')

  const signer = await starknetConnector.getSigner()
  if (!signer) throw new Error('No signer found')

  const ekuboRouter = new Contract(
    EKUBO_ROUTER_ABI,
    EKUBO_ROUTER_ADDRESS,
    signer
  )

  const route = await fetchRoute(inputTokenAddress, outputTokenAddress, amount)

  console.log({ route })
  const calls: Call[] = [
    // First call transfers the input token to the router
    {
      contractAddress: inputTokenAddress,
      entrypoint: 'transfer',
      calldata: [EKUBO_ROUTER_ADDRESS, num.toHex(amount), '0x0']
    },
    // Then the route
    {
      contractAddress: EKUBO_ROUTER_ADDRESS,
      entrypoint: 'multihop_swap',
      calldata: ekuboRouter.populate('multihop_swap', [
        route.route,
        {
          token: inputTokenAddress
        }
      ])
    }
  ]

  const { transaction_hash: txnHash } = await signer.execute(calls)
  console.log(txnHash)
  return txnHash
}

async function fetchRoute(
  inputTokenAddress: string,
  outputTokenAddress: string,
  amount: BigInt
) {
  const quote = await fetch(
    `${EKUBO_API_QUOTE_URL}/${amount}/${inputTokenAddress}/${outputTokenAddress}?maxHops=3`
  )

  if (!quote.ok) {
    throw new Error('Failed to fetch route')
  }

  const route = (await quote.json()) as ApiQuoteSwap
  return route
}

export interface ApiQuoteSwap {
  specifiedAmount: string
  amount: string
  route: {
    pool_key: {
      token0: string
      token1: string
      fee: string
      tick_spacing: number
      extension: string
    }
    sqrt_ratio_limit: string
    skip_ahead: string
  }[]
}
