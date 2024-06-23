import {
  BlockIdentifier,
  RpcProvider,
  SimulateTransactionResponse,
  num,
  transaction
} from 'starknet'

const NODE_URL = 'https://free-rpc.nethermind.io/sepolia-juno/'

type TransactionSimulationRequest = {
  transactionHash?: string
  transactionToSimulate?: TransactionToSimulate[]
}

export type TransactionToSimulate = {
  type: 'INVOKE'
  version: '0x1'
  sender_address: string
  calldata: string[]
  max_fee: string
  signature: string[2]
  nonce: string
}

export const getTransactionSimulation = async ({
  transactionHash,
  transactionToSimulate
}: TransactionSimulationRequest) => {
  let transaction: any
  let blockId: 'pending' | 'latest' | { block_number: number }

  const provider = new RpcProvider({
    nodeUrl: NODE_URL
  })

  if (!transactionHash && !transactionToSimulate) {
    throw new Error('No transaction hash or transaction to simulate provided')
  }

  if (transactionHash) {
    const transactionReceipt =
      await provider.getTransactionReceipt(transactionHash)

    if (!transactionReceipt) throw new Error('Transaction Reciept not found')

    if (!('block_hash' in transactionReceipt)) {
      throw new Error('Transaction still pending')
    }

    const block = await provider.getBlockWithTxs(
      transactionReceipt.block_number
    )
    const transactionInBlock = block.transactions.find(
      t => num.cleanHex(t.transaction_hash) === num.cleanHex(transactionHash)
    )

    if (!transactionInBlock)
      throw new Error('Transaction not found in block not found')

    transaction =
      transactionInBlock as unknown as (typeof block.transactions)[number]['transaction']

    if (transaction.type === 'L1_HANDLER') {
      console.info('L1_HANDLER txn type cannot be simulate: ', transaction)
      throw new Error('L1_HANDLER txn type cannot be simulate')
    }

    if (transaction.type === 'DEPLOY') {
      console.info("Can't simulate legacy DEPLOY txn type: ", transaction)
      throw new Error("Can't simulate legacy DEPLOY txn type")
    }

    if (transaction.type === 'DEPLOY_ACCOUNT') {
      console.info(
        "Can't simulate legacy DEPLOY_ACCOUNT_TXN_V1 txn type: ",
        transaction
      )
      throw new Error("Can't simulate legacy DEPLOY_ACCOUNT_TXN_V1 txn type")
    }

    if (transaction.type === 'DECLARE') {
      console.info("Can't simulate DECLARE txn type: ", transaction)
      throw new Error("Can't simulate DECLARE txn type")
    }
    blockId = {
      block_number: transactionReceipt.block_number - 1
    }
  } else {
    transaction = transactionToSimulate
    blockId = 'latest'
  }
  try {
    const response = await handleRequest('starknet_simulateTransactions', {
      transactions: [transaction],
      simulation_flags: [],
      block_id: blockId
    })
    return response as { result: SimulateTransactionResponse }
  } catch (error) {
    console.error(error)
    throw new Error('Error simulating transaction')
  }
}

const handleRequest = async (method: string, params: any) => {
  let payload = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: 1
  }

  const response = await fetch(NODE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (response.status !== 200 || !response.body) {
    throw new Error(`Failed to simulate transaction`)
  }
  return response.json()
}
