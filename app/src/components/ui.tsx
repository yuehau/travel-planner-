import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-ink-100 bg-white shadow-[0_1px_2px_rgba(15,23,32,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-500">{children}</h2>
      {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
    </div>
  )
}

type Tone = 'neutral' | 'brand' | 'broken' | 'shifted' | 'safe'

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-50 text-ink-700 border-ink-100',
  brand: 'bg-brand-100 text-brand-600 border-brand-100',
  broken: 'bg-break-100 text-break-600 border-break-100',
  shifted: 'bg-warn-100 text-warn-600 border-warn-100',
  safe: 'bg-safe-100 text-safe-600 border-safe-100',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function Button({
  children, onClick, variant = 'primary', disabled, className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-ink-900 text-white hover:bg-ink-700',
    ghost: 'bg-white text-ink-700 border border-ink-100 hover:bg-ink-50',
    danger: 'bg-break-600 text-white hover:brightness-110',
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Money({ value, signed = false }: { value: number; signed?: boolean }) {
  const sign = signed && value > 0 ? '+' : value < 0 ? '−' : ''
  return <span className="tabular-nums">{sign}RM{Math.abs(value)}</span>
}

export function Avatar({ name, tone, size = 28 }: { name: string; tone: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ background: tone, width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {name[0]}
    </span>
  )
}
