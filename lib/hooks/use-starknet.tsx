import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { SendTokenArgs, sendToken } from '../starknet/send'
import { SwapTokensArgs, swapTokens } from '../starknet/swap'

export function useStarknet() {
  const { primaryWallet } = useDynamicContext()

  async function transfer(args: Omit<SendTokenArgs, 'wallet'>) {
    return sendToken({
      ...args,
      wallet: primaryWallet
    })
  }

  async function swap(args: Omit<SwapTokensArgs, 'wallet'>) {
    return swapTokens({
      ...args,
      wallet: primaryWallet
    })
  }

  return {
    transfer,
    swap
  }
}
