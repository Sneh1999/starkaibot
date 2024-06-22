import { Call, Contract, RpcProvider, Uint256, num, uint256 } from 'starknet'
import StarkbotABI from './abis/starkbot-token.json'
import { ApiQuoteSwap } from './swap'

const STARKBOT_TOKEN_CLASS_HASH =
  '0x027a3e8664d9e5989e7a853e15399dc69987d029540f8d33a5e2d37643fb7744'
export const STARKBOT_TOKEN_CONTRACT_ADDRESS =
  '0x06b530a5c8f3af4a5ba7be66b3a59b6b94aaf5d9794baac75d85fc49d5bf174f'

export async function getFeeBalance(address: string) {
  const provider = new RpcProvider({
    nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno'
  })

  const contract = new Contract(
    StarkbotABI,
    STARKBOT_TOKEN_CONTRACT_ADDRESS,
    provider
  )

  const balance = (await contract.balanceOf(address)) as bigint
  return balance
}

export interface HasFeeBalanceArgs {
  requiredFee: bigint
  address: string
}

export async function hasFeeBalance({
  requiredFee,
  address
}: HasFeeBalanceArgs) {
  const balance = await getFeeBalance(address)
  return balance >= requiredFee
}

export interface ApproveStarkBotArgs {
  amount: bigint
  tokenAddress: string
}

export function getStarkBotTokenApprovalCall({
  amount,
  tokenAddress
}: ApproveStarkBotArgs) {
  const call: Call = {
    contractAddress: tokenAddress,
    entrypoint: 'approve',
    calldata: [STARKBOT_TOKEN_CONTRACT_ADDRESS, num.toHex(amount), '0x0']
  }

  console.log(call)

  return call
}

export function getStarkBotSwapCall(quote: ApiQuoteSwap, zeroForOne: boolean) {
  const provider = new RpcProvider({
    nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno'
  })

  const contract = new Contract(
    StarkbotABI,
    STARKBOT_TOKEN_CONTRACT_ADDRESS,
    provider
  )

  console.log({ quote })
  const call: Call = contract.populate('swap', [
    {
      pool_key: {
        token0: quote.route[0].pool_key.token0,
        token1: quote.route[0].pool_key.token1,
        fee: num.toHex(quote.route[0].pool_key.fee),
        tick_spacing: num.toHex(quote.route[0].pool_key.tick_spacing),
        extension: quote.route[0].pool_key.extension
      },
      params: {
        amount: {
          mag: num.toHex(quote.specifiedAmount),
          sign: BigInt(quote.specifiedAmount) < 0
        },
        is_token1: !zeroForOne,
        sqrt_ratio_limit: num.toHex(quote.route[0].sqrt_ratio_limit),
        skip_ahead: num.toHex(quote.route[0].skip_ahead)
      }
    }
  ])

  return call
}
