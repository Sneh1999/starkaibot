import 'server-only'

import { openai } from '@ai-sdk/openai'
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI
} from 'ai/rsc'

import {
  BotCard,
  BotMessage,
  Swap,
  SystemMessage,
  spinner
} from '@/components/stocks'

import { saveChat } from '@/app/actions'
import { auth } from '@/auth'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { SwapSkeleton } from '@/components/stocks/swap-skeleton'
import { Chat, Message } from '@/lib/types'
import {
  formatNumber,
  nanoid,
  runAsyncFnWithoutBlocking,
  sleep
} from '@/lib/utils'
import { z } from 'zod'
import { getTokenAddress } from '../starknet/voyager'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'
  console.log('submitUserMessage', content)
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

  console.log('bp-1')
  console.log(process.env.OPENAI_API_KEY)
  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    initial: <SpinnerMessage />,
    system: `\
    You are a decentralized finance bot and you can help users to check their balance of a token, transfer tokens or swap tokens step by step.
        
    If the user requests to send some token X to recipient Y for amount Z, call \`transferToken\` to transfer token to another address.    
    Besides that, you can also chat with users and do some calculations if needed.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      console.log('bp-3')
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }
      console.log('content', content)
      console.log('done', done)
      console.log('delta', delta)
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
      // swapTokens: {
      //   description:
      //     'Swap one token for another. Use this if the user wants to swap tokens.',
      //   parameters: z.object({
      //     tokenFrom: z
      //       .string()
      //       .describe(
      //         'The symbol of the token that will be swapped to convert to another token. e.g. USDC/STRK/ETH.'
      //       ),
      //     tokenTo: z
      //       .string()
      //       .describe(
      //         'The symbol of the token that the tokenFrom will be swapped into. e.g. USDC/STRK/ETH.'
      //       )
      //   }),
      //   generate: async function* ({ tokenFrom, tokenTo }) {
      //     yield (
      //       <BotCard>
      //         <SwapSkeleton />
      //       </BotCard>
      //     )

      //     await sleep(1000)

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
      //               toolName: 'swapTokens',
      //               toolCallId,
      //               args: { tokenFrom, tokenTo }
      //             }
      //           ]
      //         },
      //         {
      //           id: nanoid(),
      //           role: 'tool',
      //           content: [
      //             {
      //               type: 'tool-result',
      //               toolName: 'swapTokens',
      //               toolCallId,
      //               result: { tokenFrom, tokenTo }
      //             }
      //           ]
      //         }
      //       ]
      //     })

      //     return (
      //       <BotCard>
      //         <Swap props={{ tokenFrom, tokenTo }} />
      //       </BotCard>
      //     )
      //   }
      // },
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
          console.log('bp-2')
          yield (
            <BotCard>
              <SwapSkeleton />
            </BotCard>
          )
          const tokenAddress = await getTokenAddress(tokenName)

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
                    result: { tokenAddress, recipient, amount }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              {/* <Swap props={{ tokenAddress, recipient, amount }} /> */}
              <p>
                Transferring {amount} {tokenAddress} to {recipient}...
              </p>
            </BotCard>
          )
        }
      }
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
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
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
            return tool.toolName === 'swapTokens' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Swap props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
