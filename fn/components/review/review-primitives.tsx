'use client'

import type { CSSProperties, ReactNode } from 'react'

export type ReviewField = {
  label: string
  value: string | ReactNode
  subLabel?: string
  fullWidth?: boolean
}

export type ReviewCardData = {
  title: string
  accentColor: string
  fields: ReviewField[]
}

export const ReviewCard = ({
  title,
  icon,
  children,
  accentColor,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  accentColor: string
}) => (
  <div className="review-card" style={{ '--review-accent': accentColor } as CSSProperties}>
    <div className="review-card-accent" aria-hidden />
    <div className="review-card-head">
      <div className="review-card-icon">{icon}</div>
      <h3>{title}</h3>
    </div>
    <div className="review-card-body">{children}</div>
  </div>
)

export const DetailRow = ({
  label,
  value,
  subLabel,
  fullWidth = false,
}: {
  label: string
  value: string | ReactNode
  subLabel?: string
  fullWidth?: boolean
}) => {
  const muted = value === 'Not specified' || value === '-'
  return (
    <div className={`review-detail-row ${fullWidth ? 'review-detail-row-full' : ''}`}>
      <p className="review-detail-label">{label}</p>
      <div className={`review-detail-value ${muted ? 'is-muted' : ''}`}>{value}</div>
      {subLabel ? <p className="review-detail-sublabel">{subLabel}</p> : null}
    </div>
  )
}

export const DetailGrid = ({ children }: { children: ReactNode }) => (
  <div className="review-detail-grid">{children}</div>
)

export function ReviewCardFields({ fields }: { fields: ReviewField[] }) {
  return (
    <DetailGrid>
      {fields.map((f) => (
        <DetailRow
          key={f.label}
          label={f.label}
          value={f.value}
          subLabel={f.subLabel}
          fullWidth={f.fullWidth}
        />
      ))}
    </DetailGrid>
  )
}

export const BoundaryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const EnergyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export const CalcIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
)

export const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)
