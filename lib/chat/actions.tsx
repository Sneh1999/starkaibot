import 'server-only'

import { openai } from '@ai-sdk/openai'
import {
  createAI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI
} from 'ai/rsc'

import { BotCard, BotMessage, Swap } from '@/components/stocks'

import { saveChat } from '@/app/actions'
import { auth } from '@/auth'
import { Balance } from '@/components/stocks/balance'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Send } from '@/components/stocks/send'
import { Chat, Message } from '@/lib/types'
import { nanoid } from '@/lib/utils'
import { Session } from 'next-auth'
import { z } from 'zod'
import { fetchRoute } from '../starknet/swap'
import { getTokenBalance } from '../starknet/utils'
import { getToken } from '../starknet/voyager'

async function submitUserMessage(content: string) {
  'use server'

  const session = (await auth()) as Session

  if (!session) {
    return {
      id: nanoid(),
      display: <p>Please log in to continue</p>
    }
  }
  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    initial: <SpinnerMessage />,
    system: `\
    You are a DeFi bot on Starknet and you can help users with activities like cchecking their balance of a token, transferring tokens to others, swapping tokens on DEXes, and understanding past transactions by simulating them.
    
    If the user requests to swap some token X for token Y and the amount of X to swap, call \`swapTokens\` to swap token to another token.
    If the user requests to send some token X to recipient Y for amount Z, call \`transferToken\` to transfer token to another address.    
    If the user requests to check the balance of a token in a wallet, call \`balanceOf\` to check the balance of a token in a wallet.

    Besides that, you can also chat with users and do some calculations if needed.`,

    // If the user requests to simulate a past transaction, call \`simulateTransaction\` with the transaction hash.
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }
      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      swapTokens: {
        description:
          'Swap one token for another. Use this if the user wants to exchange a certain amount of one token for another.',
        parameters: z.object({
          tokenFromName: z
            .string()
            .describe(
              'The symbol or name of the token that will be swapped to convert to another token. e.g. USDC/STRK/ETH.'
            ),
          tokenToName: z
            .string()
            .describe(
              'The symbol or name of the token that the tokenFrom will be swapped into. e.g. USDC/STRK/ETH.'
            ),
          amount: z
            .number()
            .positive()
            .describe(
              'The amount of the token that will be swapped to the tokenTo. e.g. 100'
            )
        }),
        generate: async function* ({ tokenFromName, tokenToName, amount }) {
          yield (
            <BotCard>
              <SpinnerMessage />
            </BotCard>
          )

          const toolCallId = nanoid()

          const tokenFrom = await getToken(tokenFromName)
          const tokenTo = await getToken(tokenToName)

          const route = await fetchRoute(
            tokenFrom!.address,
            tokenTo!.address,
            BigInt(amount * 10 ** tokenFrom!.decimals)
          )

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'swapTokens',
                    toolCallId,
                    args: { tokenFromName, tokenToName, amount }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'swapTokens',
                    toolCallId,
                    result: { tokenFrom, tokenTo, route }
                  }
                ]
              }
            ]
          })

          if (!tokenFrom || !tokenTo) {
            return `Could not find token ${tokenFromName} or ${tokenToName}`
          }

          return (
            <BotCard>
              <Swap inputToken={tokenFrom} outputToken={tokenTo} {...route} />
            </BotCard>
          )
        }
      },
      transferToken: {
        description:
          'Transfer token X to recipient Y for amount Z. Use this if the user wants to transfer some token to another address.',
        parameters: z.object({
          tokenName: z
            .string()
            .describe(
              'The name of the token that will be swapped to convert to another token. e.g. USDC/STRK/ETH.'
            ),
          recipient: z
            .string()
            .startsWith('0x')
            .describe(
              'The address of the recipient that will receive the token. e.g. 0x06D58289eD6F44C645c2A0286E4f5A36D8b46fe2A7a4f8093bA48191158d4508'
            ),
          amount: z
            .number()
            .positive()
            .describe(
              'The amount of the token that will be transferred to the recipient. e.g. 100'
            )
        }),
        generate: async function* ({ tokenName, recipient, amount }) {
          yield (
            <BotCard>
              <SpinnerMessage />
            </BotCard>
          )
          const token = await getToken(tokenName)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'transferToken',
                    toolCallId,
                    args: { tokenName, recipient, amount }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'transferToken',
                    toolCallId,
                    result: { token, recipient, amount }
                  }
                ]
              }
            ]
          })

          if (!token) {
            return `Could not find token ${token}`
          }

          return (
            <BotCard>
              <Send
                recipient={recipient}
                amount={BigInt(amount * 10 ** token.decimals)}
                token={token}
              />
            </BotCard>
          )
        }
      },
      balanceOf: {
        description:
          'Get the balance of a token in a wallet. Use this if the user wants to check their balance of a token.',
        parameters: z.object({
          tokenName: z
            .string()
            .describe(
              'The name of the token that will be swapped to convert to another token. e.g. USDC/STRK/ETH.'
            )
        }),
        generate: async function* ({ tokenName }) {
          yield (
            <BotCard>
              <SpinnerMessage />
            </BotCard>
          )

          const token = await getToken(tokenName)
          let balance: bigint | null = null
          if (token) {
            balance = await getTokenBalance(token?.address, session.user!.id!)
          }

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'balanceOf',
                    toolCallId,
                    args: { tokenName }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'balanceOf',
                    toolCallId,
                    result: {
                      token,
                      balance: balance?.toString()
                    }
                  }
                ]
              }
            ]
          })

          if (!token) {
            return `Could not find token ${tokenName}`
          }

          return (
            <BotCard>
              <Balance token={token} balance={balance} />
            </BotCard>
          )
        }
      }
      // simulateTransaction: {
      //   description:
      //     'Simulate a transaction executed in the past on Starknet. Call this function with the provided transaction hash. Extract the transaction hash from the block explorer link if given.',
      //   parameters: z.object({
      //     transactionHash: z
      //       .string()
      //       .startsWith('0x')
      //       .describe('The transaction hash')
      //   }),
      //   generate: async function* ({ transactionHash }) {
      //     yield (
      //       <BotCard>
      //         <SpinnerMessage />
      //       </BotCard>
      //     )

      //     const txnSimulation = await getTransactionSimulation({
      //       transactionHash
      //     })

      //     const toolCallId = nanoid()

      //     aiState.done({
      //       ...aiState.get(),
      //       messages: [
      //         ...aiState.get().messages,
      //         {
      //           id: nanoid(),
      //           role: 'assistant',
      //           content: [
      //             {
      //               type: 'tool-call',
      //               toolName: 'simulateTransaction',
      //               toolCallId,
      //               args: { transactionHash }
      //             }
      //           ]
      //         },
      //         {
      //           id: nanoid(),
      //           role: 'tool',
      //           content: [
      //             {
      //               type: 'tool-result',
      //               toolName: 'simulateTransaction',
      //               toolCallId,
      //               result: {
      //                 txnSimulation
      //               }
      //             }
      //           ]
      //         }
      //       ]
      //     })

      //     return (
      //       <BotCard>
      //         <Simulation txnSimulation={txnSimulation} />
      //       </BotCard>
      //     )
      //   }
      // }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        // @ts-expect-error
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      if (!firstMessageContent) return
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            if (tool.toolName === 'swapTokens') {
              return (
                <BotCard key={tool.toolCallId}>
                  <Swap
                    // @ts-expect-error
                    inputToken={tool.result.tokenFrom}
                    // @ts-expect-error
                    outputToken={tool.result.tokenTo}
                    // @ts-expect-error
                    {...tool.result.route}
                  />
                </BotCard>
              )
            }

            if (tool.toolName === 'transferToken') {
              return (
                <BotCard key={tool.toolCallId}>
                  <Send
                    // @ts-expect-error
                    recipient={tool.result.recipient}
                    // @ts-expect-error
                    amount={tool.result.amount}
                    // @ts-expect-error
                    token={tool.result.token}
                  />
                </BotCard>
              )
            }

            if (tool.toolName === 'balanceOf') {
              return (
                <BotCard key={tool.toolCallId}>
                  <Balance
                    // @ts-expect-error
                    token={tool.result.token}
                    balance={
                      // @ts-expect-error
                      !tool.result.balance ? null : BigInt(tool.result.balance)
                    }
                  />
                </BotCard>
              )
            }

            // if (tool.toolName === 'simulateTransaction') {
            //   return (
            //     <BotCard key={tool.toolCallId}>
            //       {/* @ts-expect-error */}
            //       <Simulation txnSimulation={tool.result.txnSimulation} />
            //     </BotCard>
            //   )
            // }

            return null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
