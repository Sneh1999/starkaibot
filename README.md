# StarkBot

StarkBot is an AI powered DeFi chatbot to conduct activities on StarkNet.

## Core Features

- Fetch token balances of connected wallet

  - Integrates with Voyager API to get token information based on name/symbol

- Transfer tokens

  - Integrates with Voyager API to get token information based on name/symbol

- Swap tokens
  - Integrates with Voyager API to get token information based on name/symbol
  - Integrates with Ekubo Protocol to conduct the swap

## Workflow

1. User first must purchase `STRKBOT` token which is used to pay fees for the bot
2. User sends messages to the bot to check their balance, transfer tokens, or conduct a swap
3. Vercel's AI SDK is used with OpenAI to parse their message
4. A UI is generatively created to display the action details
5. User confirms the action, which triggers an onchain transaction (for transfer/swap)

> NOTE: If testing during judging, you will need `STRKBOT` token for executing swaps. You can mint STRKBOT token for free for now by calling the `mint` function on the contract here - https://sepolia.voyager.online/contract/0x05ab9c6b81f1d1a7aac290940584a9d26c49ac1014097ef3bf11710445ebf285#writeContract

## Challenges / Missing Features

We faced a few challenges/issues while building this project.

1. Ekubo's docs are a bit lackluster and the given examples are old compared to the current version of the protocol. It took us a while to figure out how to actually integrate with them and how to call the `swap` function.
2. Dynamic's SDK is great for EVM-based chains, but similar to Ekubo, the docs for StarkNet are a bit lacking - but not that bad
3. The TypeScript types in `starknet.js` are not the same as Nethermind's RPC request/response types for `simulateTransactions`. This caused us a lot of trouble and at the end we were unable to get simulation working properly as by the time we figured out the differences it was a bit late.

---

One thing we really wanted to add was transaction simulation through Nethermind for both past transactions and also transactions that the user is about to make.

We got past transaction simulation working, see `lib/starknet/nethermind.ts` for that. But, pending transaction simulation did not work due to some weird incompatibilities we could not understand.

Using Argent X wallet, the actual calldata sent onchain is different from what we get when using starknet.js' `buildInvocation` or `transaction.getExecuteCalldata` for some reason - which keeps throwing simulation errors then because theres 3-4 additional calldata arguments than what gets sent onchain. We could not determine the root cause of this after hours of trying to fix it.

We spent too much time on trying to figure this out, and at the end did not have enough time left to finist the UI and summarization aspect of even past transaction simulations - so simulation is no longer a feature we support at the time of submission.
