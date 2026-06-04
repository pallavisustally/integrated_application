'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

import { OPERATING_COUNTRIES } from '@/lib/ui/countries'
import { NUM_FIELD_PLACEHOLDER, numFieldStatusHint } from '@/lib/ui/labels'

type Num = number | null

export function describedByIds(...ids: Array<string | undefined | false>): string | undefined {
  const joined = ids.filter(Boolean).join(' ')
  return joined || undefined
}

export function AccessibleNumField({
  label,
  value,
  onChange,
  unit,
  step = 'any',
  hint,
  error,
  required,
  span,
  fieldPath,
}: {
  label: string
  value: Num
  onChange: (v: Num) => void
  unit?: string
  step?: string
  hint?: string
  error?: string
  required?: boolean
  span?: number
  fieldPath?: string
}) {
  const hintId = useId()
  const errId = useId()
  const autoId = useId()
  const inputId = fieldPath ? `fp-${fieldPath.replace(/[^a-zA-Z0-9._-]/g, '_')}` : autoId
  const status = numFieldStatusHint(value, hint)
  const hasError = Boolean(error)

  return (
    <label className="field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="field-title">
        {label}
        {required ? <span className="required-mark">*</span> : null}
      </span>
      <div className="input-with-unit">
        <input
          id={inputId}
          data-field-path={fieldPath}
          type="number"
          step={step}
          value={value === null ? '' : value}
          placeholder={NUM_FIELD_PLACEHOLDER}
          aria-invalid={hasError || undefined}
          aria-describedby={describedByIds(status ? hintId : undefined, hasError ? errId : undefined)}
          onChange={(e) => onChange(toNum(e.target.value))}
        />
        {unit ? <span>{unit}</span> : null}
      </div>
      {status ? (
        <small id={hintId} className="form-sub">
          {status}
        </small>
      ) : null}
      {hasError ? (
        <div id={errId} className="field-error" role="alert">
          {error}
        </div>
      ) : null}
    </label>
  )
}

export function AccessibleSelect({
  label,
  value,
  onChange,
  options,
  error,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  error?: string
  required?: boolean
}) {
  const errId = useId()
  const hasError = Boolean(error)
  return (
    <label className="field">
      <span className="field-title">
        {label}
        {required ? <span className="required-mark">*</span> : null}
      </span>
      <select
        value={value}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errId : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hasError ? (
        <div id={errId} className="field-error" role="alert">
          {error}
        </div>
      ) : null}
    </label>
  )
}

export function CountrySelect({
  value,
  onChange,
  label = 'Operating country',
}: {
  value: string
  onChange: (code: string) => void
  label?: string
}) {
  return (
    <AccessibleSelect
      label={label}
      value={value}
      onChange={onChange}
      options={OPERATING_COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
    />
  )
}

export function AccessibleTextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  required?: boolean
  type?: 'text' | 'email' | 'tel'
}) {
  const errId = useId()
  const hasError = Boolean(error)

  return (
    <label className="field">
      <span className="field-title">
        {label}
        {required ? <span className="required-mark">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errId : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasError ? (
        <div id={errId} className="field-error" role="alert">
          {error}
        </div>
      ) : null}
    </label>
  )
}

function toNum(v: string): Num {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export function FocusTrapModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const nodes = cardRef.current ? getFocusable(cardRef.current) : []
      nodes[0]?.focus()
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !cardRef.current) return
    const root = cardRef.current
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const nodes = getFocusable(root)
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="modal-ok" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
