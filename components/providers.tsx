'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getCsrfToken, signIn, signOut } from 'next-auth/react'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { StarknetWalletConnectors } from '@dynamic-labs/starknet'
export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID as string,
        walletConnectors: [StarknetWalletConnectors],
        events: {
          onAuthSuccess: async event => {
            await signIn('credentials', {
              token: encodeURIComponent(event.authToken)
            })
          },
          onLogout: async event => {
            console.log('LOGOUT', event)
            await signOut({})
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
