'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-12">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group mb-6 flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {typeof count === 'number' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {count}
              </span>
            )}
          </div>
          {description ? (
            <p className="mt-1 max-w-xl text-pretty text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
          <ChevronDown
            className={`size-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {open && children}
    </section>
  )
}
