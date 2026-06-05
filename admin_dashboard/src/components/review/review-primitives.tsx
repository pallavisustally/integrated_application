'use client'

import type { ReactNode } from 'react'

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
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative group hover:shadow-md transition-shadow duration-300 h-[420px]">
    <div
      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
      style={{ backgroundColor: accentColor }}
    />
    <div className="flex items-center gap-3 mb-6 flex-shrink-0">
      <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `${accentColor}20` }}>
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm tracking-wide">{title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      {children}
    </div>
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
}) => (
  <div className={`mb-4 last:mb-0 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
    <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">{label}</p>
    <div
      className={`font-semibold text-gray-900 text-sm ${
        value === 'Not specified' || value === '-' ? 'text-gray-400 italic' : ''
      }`}
    >
      {value}
    </div>
    {subLabel ? <p className="text-xs text-gray-500 mt-1">{subLabel}</p> : null}
  </div>
)

export const DetailGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">{children}</div>
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
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const EnergyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

export const CalcIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
)
