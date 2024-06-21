import { Call, Contract, RpcProvider, Uint256, num, uint256 } from 'starknet'
import StarkbotABI from './abis/starkbot-token.json'
import { ApiQuoteSwap } from './swap'

const STARKBOT_TOKEN_CLASS_HASH =
  '0x001f42e9ecb8fe6dc58bdafc9052800db720ab60e82340376b945d4e1560028a'
export const STARKBOT_TOKEN_CONTRACT_ADDRESS =
  '0x024c01e58dc3693bcddba981caf1dcf804e40d8c14bb2b579a275d09048bc62b'

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

  console.log({ amount: quote.amount, specifiedAmount: quote.specifiedAmount })
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
