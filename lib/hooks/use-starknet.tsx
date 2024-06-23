import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { SendTokenArgs, sendToken } from '../starknet/send'
import { SwapTokensArgs, swapTokens } from '../starknet/swap'
import { useEffect, useState } from 'react'
import { getFeeBalance } from '../starknet/utils'
import {
  Account,
  AccountInvocationItem,
  Invocation,
  transaction
} from 'starknet'
import {
  AccountInvocations,
  Call,
  InvocationsSignerDetails,
  RpcProvider,
  TransactionType
} from 'starknet'
import StarknetWalletConnector from '@dynamic-labs/starknet/src/starknetWalletConnector'

export function useStarknet() {
  const { primaryWallet } = useDynamicContext()

  const [feeBalance, setFeeBalance] = useState<bigint>(BigInt(0))

  async function updateFeeBalance(address: string) {
    const balance = await getFeeBalance(address)
    setFeeBalance(balance)
  }

  useEffect(() => {
    if (primaryWallet && primaryWallet.address) {
      updateFeeBalance(primaryWallet.address)
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

  async function simulate(calls: Call[]) {
    const provider = new RpcProvider({
      nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno'
    })

    if (!primaryWallet) throw new Error('No wallet provided')
    const starknetConnector = primaryWallet.connector as StarknetWalletConnector

    const signer = await starknetConnector.getSigner()
    if (!signer) throw new Error('No signer found')

    const chainId = await signer.getChainId()

    console.log({ calls })
    const calldata = transaction.fromCallsToExecuteCalldata(calls)
    console.log({ calldata })

    // const accountInvocation: AccountInvocationItem = {
    //   ...invocation,
    //   type: TransactionType.INVOKE,
    //   nonce: await getNonce(),
    //   signature: ['0x0', '0x0'],
    //   version: '0x1'
    // }

    // // const signature = await signer.signer.signTransaction(calls, signerDetails)
    // // const calldata = transaction.getExecuteCalldata(calls, signer.cairoVersion)
    // // const invocation: Invocation = {
    // //   contractAddress: primaryWallet.address,
    // //   calldata: calldata,
    // //   signature: signature
    // // }

    // const simulationResults = await provider.simulateTransaction(
    //   [accountInvocation],
    //   {
    //     blockIdentifier: 'latest',
    //     skipValidate: true
    //   }
    // )

    // console.log({ simulationResults })
  }

  async function getNonce() {
    const provider = new RpcProvider({
      nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno'
    })

    const nonce = await provider.getNonceForAddress(
      primaryWallet!.address,
      'latest'
    )
    return nonce
  }

  return {
    transfer,
    swap,
    feeBalance,
    updateFeeBalance,
    simulate,
    getNonce
  }
}
