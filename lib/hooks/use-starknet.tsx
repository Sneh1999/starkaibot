import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { SendTokenArgs, sendToken } from '../starknet/send'

export function useStarknet() {
  const { primaryWallet } = useDynamicContext()

  async function transferToken(args: Omit<SendTokenArgs, 'wallet'>) {
    return sendToken({
      ...args,
      wallet: primaryWallet
    })
  }

  return {
    transferToken
  }
}
