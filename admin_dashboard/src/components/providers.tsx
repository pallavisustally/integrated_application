'use client'

import type { ReactNode } from 'react'

import { AppDialogProvider } from '@/components/app-dialog-provider'

export function Providers({ children }: { children: ReactNode }) {
  return <AppDialogProvider>{children}</AppDialogProvider>
}
