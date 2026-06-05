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

export type DialogVariant = 'alert' | 'confirm' | 'success' | 'error' | 'prompt'

type DialogRequest = {
  variant: DialogVariant
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  promptPlaceholder?: string
}

export type AppDialogContextValue = {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
  notify: (message: string, type: 'success' | 'error', title?: string) => Promise<void>
  prompt: (message: string, title?: string, placeholder?: string) => Promise<string | null>
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
    case 'prompt':
      return 'Input required'
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
  const [promptValue, setPromptValue] = useState('')
  const boolResolverRef = useRef<((value: boolean) => void) | null>(null)
  const stringResolverRef = useRef<((value: string | null) => void) | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const closeBool = useCallback((result: boolean) => {
    boolResolverRef.current?.(result)
    boolResolverRef.current = null
    setDialog(null)
    setPromptValue('')
  }, [])

  const closePrompt = useCallback((result: string | null) => {
    stringResolverRef.current?.(result)
    stringResolverRef.current = null
    setDialog(null)
    setPromptValue('')
  }, [])

  const openBoolDialog = useCallback(
    (
      req: Omit<DialogRequest, 'confirmLabel' | 'cancelLabel'> &
        Partial<Pick<DialogRequest, 'confirmLabel' | 'cancelLabel'>>,
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        boolResolverRef.current = resolve
        setDialog({
          variant: req.variant,
          title: req.title,
          message: req.message,
          confirmLabel: req.confirmLabel ?? (req.variant === 'confirm' ? 'Continue' : 'OK'),
          cancelLabel: req.cancelLabel ?? 'Cancel',
        })
      })
    },
    [],
  )

  const alert = useCallback(
    async (message: string, title?: string) => {
      await openBoolDialog({
        variant: 'alert',
        title: title ?? defaultTitle('alert'),
        message,
      })
    },
    [openBoolDialog],
  )

  const notify = useCallback(
    async (message: string, type: 'success' | 'error', title?: string) => {
      await openBoolDialog({
        variant: type,
        title: title ?? defaultTitle(type),
        message,
      })
    },
    [openBoolDialog],
  )

  const confirm = useCallback(
    async (message: string, title?: string) => {
      return openBoolDialog({
        variant: 'confirm',
        title: title ?? defaultTitle('confirm'),
        message,
      })
    },
    [openBoolDialog],
  )

  const prompt = useCallback(
    async (message: string, title?: string, placeholder?: string) => {
      return new Promise<string | null>((resolve) => {
        stringResolverRef.current = resolve
        setPromptValue('')
        setDialog({
          variant: 'prompt',
          title: title ?? defaultTitle('prompt'),
          message,
          confirmLabel: 'Submit',
          cancelLabel: 'Cancel',
          promptPlaceholder: placeholder,
        })
      })
    },
    [],
  )

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (dialog.variant === 'prompt') {
        closePrompt(null)
      } else {
        closeBool(dialog.variant === 'confirm' ? false : true)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      if (dialog.variant === 'prompt') {
        const input = cardRef.current?.querySelector<HTMLTextAreaElement>('[data-app-dialog-input]')
        input?.focus()
        return
      }
      const btn = cardRef.current?.querySelector<HTMLButtonElement>('[data-app-dialog-primary]')
      btn?.focus()
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [dialog, closeBool, closePrompt])

  const value: AppDialogContextValue = { alert, confirm, notify, prompt }

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <div
          className="modal-backdrop app-dialog-backdrop"
          role="presentation"
          onClick={() =>
            dialog.variant === 'prompt'
              ? closePrompt(null)
              : closeBool(dialog.variant === 'confirm' ? false : true)
          }
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
                onClick={() =>
                  dialog.variant === 'prompt'
                    ? closePrompt(null)
                    : closeBool(dialog.variant === 'confirm' ? false : true)
                }
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p id="app-dialog-message">{dialog.message}</p>
              {dialog.variant === 'prompt' ? (
                <textarea
                  data-app-dialog-input
                  className="app-dialog-prompt-input"
                  rows={4}
                  placeholder={dialog.promptPlaceholder}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                />
              ) : null}
            </div>
            <div className="modal-footer app-dialog-footer">
              {dialog.variant === 'confirm' || dialog.variant === 'prompt' ? (
                <button
                  type="button"
                  className="app-dialog-cancel"
                  onClick={() =>
                    dialog.variant === 'prompt' ? closePrompt(null) : closeBool(false)
                  }
                >
                  {dialog.cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                className="modal-ok"
                data-app-dialog-primary
                onClick={() =>
                  dialog.variant === 'prompt'
                    ? closePrompt(promptValue)
                    : closeBool(true)
                }
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
