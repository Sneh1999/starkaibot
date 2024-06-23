import { Wallet } from '@dynamic-labs/sdk-react-core'
import StarknetWalletConnector from '@dynamic-labs/starknet/src/starknetWalletConnector'
import { Call, num } from 'starknet'
import StarkbotABI from './abis/starkbot-token.json'

import {
  getStarkBotSwapCall,
  getStarkBotTokenApprovalCall,
  hasFeeBalance
} from './utils'

const EKUBO_API_QUOTE_URL = 'https://sepolia-api.ekubo.org/quote'

export interface SwapTokensArgs {
  wallet: Wallet | null
  inputTokenAddress: string
  outputTokenAddress: string
  amount: bigint
  route: SwapRoute
}

const SWAP_FEES = BigInt(500) * BigInt(10 ** 18)

export async function swapTokens({
  wallet,
  inputTokenAddress,
  outputTokenAddress,
  amount,
  route
}: SwapTokensArgs) {
  if (!wallet) throw new Error('No wallet provided')
  const starknetConnector = wallet.connector as StarknetWalletConnector

  const provider = await starknetConnector.getPublicClient()
  if (!provider) throw new Error('No provider found')

  const signer = await starknetConnector.getSigner()
  if (!signer) throw new Error('No signer found')

  const hasFees = await hasFeeBalance({
    requiredFee: SWAP_FEES,
    address: wallet.address
  })
  if (!hasFees) throw new Error('Insufficient fees')

  const zeroForOne =
    num.cleanHex(route.route[0].pool_key.token0) ===
    num.cleanHex(inputTokenAddress)

  const calls: Call[] = [
    // First call transfers the input token to the starkbot contract
    getStarkBotTokenApprovalCall({ amount, tokenAddress: inputTokenAddress }),
    // Then calls the swap function on the starkbot contract
    // NOTE: We only support single-hop swaps for now
    getStarkBotSwapCall(route, zeroForOne)
  ]

  console.log({ calls })

  const { transaction_hash: txnHash } = await signer.execute(calls, [
    StarkbotABI
  ])
  return txnHash
}

export async function fetchRoute(
  inputTokenAddress: string,
  outputTokenAddress: string,
  amount: BigInt
): Promise<SwapRoute> {
  const quote = await fetch(
    `${EKUBO_API_QUOTE_URL}/${amount}/${inputTokenAddress}/${outputTokenAddress}?maxHops=1`
  )

  if (!quote.ok) {
    throw new Error('Failed to fetch route')
  }

  const route = (await quote.json()) as ApiQuoteSwap
  return {
    ...route,
    inputTokenAddress,
    outputTokenAddress
  }
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

export interface SwapRoute extends ApiQuoteSwap {
  inputTokenAddress: string
  outputTokenAddress: string
}
