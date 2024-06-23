'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import {
  DynamicContextProvider,
  getAuthToken
} from '@dynamic-labs/sdk-react-core'
import { StarknetWalletConnectors } from '@dynamic-labs/starknet'
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider>
      <DynamicContextProvider
        settings={{
          environmentId: process.env
            .NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID as string,
          walletConnectors: [StarknetWalletConnectors],
          events: {
            onAuthSuccess: async event => {
              await signIn('credentials', {
                token: encodeURIComponent(getAuthToken())
              })
            },
            onLogout: async event => {
              console.log('LOGOUT', event)
              await signOut()
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
    </SessionProvider>
  )
}
