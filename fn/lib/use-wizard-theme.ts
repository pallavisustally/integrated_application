'use client'

import { useCallback, useEffect, useState } from 'react'

export type WizardTheme = 'light' | 'dark'

const STORAGE_KEY = 'sustally-theme'

export function readStoredTheme(): WizardTheme {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

export function storeTheme(theme: WizardTheme) {
  localStorage.setItem(STORAGE_KEY, theme)
  sessionStorage.setItem(STORAGE_KEY, theme)
}

export function useWizardTheme() {
  const [theme, setTheme] = useState<WizardTheme>('light')

  useEffect(() => {
    setTheme(readStoredTheme())
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: WizardTheme = prev === 'dark' ? 'light' : 'dark'
      storeTheme(next)
      return next
    })
  }, [])

  const setWizardTheme = useCallback((next: WizardTheme) => {
    storeTheme(next)
    setTheme(next)
  }, [])

  return { theme, toggleTheme, setWizardTheme }
}
