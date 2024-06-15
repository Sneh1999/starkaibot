'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { StarknetWalletConnectors } from '@dynamic-labs/starknet'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'da8ca208-a4ea-41d2-ba4e-7a5465e611b2',
        walletConnectors: [StarknetWalletConnectors]
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
