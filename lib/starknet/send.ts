import { Wallet } from '@dynamic-labs/sdk-react-core'
import StarknetWalletConnector from '@dynamic-labs/starknet/src/starknetWalletConnector'
import { Contract } from 'starknet'

export interface SendTokenArgs {
  wallet: Wallet | null
  tokenAddress: string
  amount: number
  recipient: string
}

export async function sendToken({
  wallet,
  tokenAddress,
  recipient,
  amount
}: SendTokenArgs) {
  if (!wallet) throw new Error('No wallet provided')
  const starknetConnector = wallet.connector as StarknetWalletConnector

  const provider = await starknetConnector.getPublicClient()
  if (!provider) throw new Error('No provider found')

  const signer = await starknetConnector.getSigner()
  if (!signer) throw new Error('No signer found')

  const contractClass = await provider.getClassAt(tokenAddress)
  if (!contractClass) throw new Error('Token class not found')

  const contract = new Contract(contractClass.abi, tokenAddress, signer)

  const { transaction_hash: txnHash } = await contract.transfer(
    recipient,
    amount
  )

  return txnHash
}
