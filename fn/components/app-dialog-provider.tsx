'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type DialogVariant = 'alert' | 'confirm' | 'success' | 'error'

type DialogRequest = {
  variant: DialogVariant
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}

export type AppDialogContextValue = {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
  notify: (message: string, type: 'success' | 'error', title?: string) => Promise<void>
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null)

export function useAppDialog(): AppDialogContextValue {
  const ctx = useContext(AppDialogContext)
  if (!ctx) {
    throw new Error('useAppDialog must be used within AppDialogProvider')
  }
  return ctx
}

function defaultTitle(variant: DialogVariant): string {
  switch (variant) {
    case 'confirm':
      return 'Confirm'
    case 'success':
      return 'Success'
    case 'error':
      return 'Error'
    default:
      return 'Notice'
  }
}

function variantClass(variant: DialogVariant): string {
  if (variant === 'success') return 'app-dialog-card--success'
  if (variant === 'error') return 'app-dialog-card--error'
  return ''
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }, [])

  const openDialog = useCallback((req: Omit<DialogRequest, 'confirmLabel' | 'cancelLabel'> & Partial<Pick<DialogRequest, 'confirmLabel' | 'cancelLabel'>>): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        variant: req.variant,
        title: req.title,
        message: req.message,
        confirmLabel: req.confirmLabel ?? (req.variant === 'confirm' ? 'Continue' : 'OK'),
        cancelLabel: req.cancelLabel ?? 'Cancel',
      })
    })
  }, [])

  const alert = useCallback(
    async (message: string, title?: string) => {
      await openDialog({
        variant: 'alert',
        title: title ?? defaultTitle('alert'),
        message,
      })
    },
    [openDialog],
  )

  const notify = useCallback(
    async (message: string, type: 'success' | 'error', title?: string) => {
      await openDialog({
        variant: type,
        title: title ?? defaultTitle(type),
        message,
      })
    },
    [openDialog],
  )

  const confirm = useCallback(
    async (message: string, title?: string) => {
      return openDialog({
        variant: 'confirm',
        title: title ?? defaultTitle('confirm'),
        message,
      })
    },
    [openDialog],
  )

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(dialog.variant === 'confirm' ? false : true)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const btn = cardRef.current?.querySelector<HTMLButtonElement>('[data-app-dialog-primary]')
      btn?.focus()
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [dialog, close])

  const value: AppDialogContextValue = { alert, confirm, notify }

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <div
          className="modal-backdrop app-dialog-backdrop"
          role="presentation"
          onClick={() => close(dialog.variant === 'confirm' ? false : true)}
        >
          <div
            ref={cardRef}
            className={`modal-card app-dialog-card ${variantClass(dialog.variant)}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3 id="app-dialog-title">{dialog.title}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => close(dialog.variant === 'confirm' ? false : true)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p id="app-dialog-message">{dialog.message}</p>
            </div>
            <div className="modal-footer app-dialog-footer">
              {dialog.variant === 'confirm' ? (
                <button
                  type="button"
                  className="app-dialog-cancel"
                  onClick={() => close(false)}
                >
                  {dialog.cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                className="modal-ok"
                data-app-dialog-primary
                onClick={() => close(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppDialogContext.Provider>
  )
}
