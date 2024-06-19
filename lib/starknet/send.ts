import { Wallet } from '@dynamic-labs/sdk-react-core'
import StarknetWalletConnector from '@dynamic-labs/starknet/src/starknetWalletConnector'
import { Contract } from 'starknet'
import { getToken } from './voyager'

export interface SendTokenArgs {
  wallet: Wallet | null
  tokenName: string
  amount: number
  recipient: string
}

export async function sendToken({
  wallet,
  tokenName,
  recipient,
  amount
}: SendTokenArgs) {
  if (!wallet) throw new Error('No wallet provided')
  const starknetConnector = wallet.connector as StarknetWalletConnector

  const provider = await starknetConnector.getPublicClient()
  if (!provider) throw new Error('No provider found')

  const signer = await starknetConnector.getSigner()
  if (!signer) throw new Error('No signer found')

  const token = await getToken(tokenName)
  if (!token) throw new Error('Token  not found')

  const tokenAddress = token.address
  const contractClass = await provider.getClassAt(tokenAddress)
  if (!contractClass) throw new Error('Token class not found')

  const contract = new Contract(contractClass.abi, tokenAddress, signer)

  const { transaction_hash: txnHash } = await contract.transfer(
    recipient,
    amount
  )

  return txnHash
}
