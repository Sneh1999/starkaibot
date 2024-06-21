import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { SendTokenArgs, sendToken } from '../starknet/send'
import { SwapTokensArgs, swapTokens } from '../starknet/swap'
import { useEffect, useState } from 'react'
import { getFeeBalance } from '../starknet/utils'

export function useStarknet() {
  const { primaryWallet } = useDynamicContext()

  const [feeBalance, setFeeBalance] = useState<bigint>(BigInt(0))

  useEffect(() => {
    if (primaryWallet && primaryWallet.address) {
      getFeeBalance(primaryWallet.address).then(balance => {
        setFeeBalance(balance)
      })
    }
  }, [primaryWallet])

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
    swap,
    feeBalance
  }
}
