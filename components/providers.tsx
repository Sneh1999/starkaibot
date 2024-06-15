'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import getCsrfToken from 'next-auth'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { StarknetWalletConnectors } from '@dynamic-labs/starknet'
import { config } from 'auth'
export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID as string,
        walletConnectors: [StarknetWalletConnectors],
        events: {
          onAuthSuccess: async event => {
            const { authToken } = event

            const csrfToken = await getCsrfToken(config)

            fetch('/api/auth/callback/credentials', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `csrfToken=${encodeURIComponent(
                csrfToken as any
              )}&token=${encodeURIComponent(authToken)}`
            })
              .then(res => {
                console.log('RESPONSE', res)
                if (res.ok) {
                  console.log('LOGGED IN', res)
                  // Handle success - maybe redirect to the home page or user dashboard
                } else {
                  // Handle any errors - maybe show an error message to the user
                  console.error('Failed to log in')
                }
              })
              .catch(error => {
                // Handle any exceptions
                console.error('Error logging in', error)
              })
          }
        }
      }}
    >
      <NextThemesProvider {...props}>
        <SidebarProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </SidebarProvider>
      </NextThemesProvider>
    </DynamicContextProvider>
  )
}
