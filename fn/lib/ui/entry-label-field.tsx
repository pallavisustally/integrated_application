'use client'

import { useEffect, useId, useRef, useState } from 'react'

import type { LabelSuggestionSet } from '@/lib/ui/label-suggestions'

export function EntryLabelField({
  label = 'Label',
  value,
  onChange,
  suggestions,
  error,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  suggestions: LabelSuggestionSet
  error?: string
}) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    if (!open) setQuery(value)
  }, [value, open])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = suggestions.presets.filter(
    (p) => !q || p.toLowerCase().includes(q),
  )
  const showCustom =
    q.length > 0 && !suggestions.presets.some((p) => p.toLowerCase() === q)

  return (
    <label className="field entry-label-field">
      <span className="field-title">{label}</span>
      <div className="entry-label-combobox" ref={containerRef}>
        <input
          type="text"
          list={listId}
          value={open ? query : value}
          placeholder={suggestions.customPlaceholder ?? 'Pick a preset or type your own'}
          aria-invalid={error ? true : undefined}
          onFocus={() => {
            setOpen(true)
            setQuery(value)
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        {open && (filtered.length > 0 || showCustom) ? (
          <ul className="entry-label-dropdown" role="listbox">
            {filtered.map((preset) => (
              <li key={preset}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === preset}
                  className={value === preset ? 'selected' : ''}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(preset)
                    setQuery(preset)
                    setOpen(false)
                  }}
                >
                  {preset}
                </button>
              </li>
            ))}
            {showCustom ? (
              <li>
                <button
                  type="button"
                  className="entry-label-custom"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(query.trim())
                    setOpen(false)
                  }}
                >
                  Use custom: &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
      <datalist id={listId}>
        {suggestions.presets.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {error ? <div className="field-error">{error}</div> : null}
    </label>
  )
}
