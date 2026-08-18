'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Muestra un texto recortado a `clampClass` líneas y, solo si el contenido
 * realmente se desborda, ofrece un botón "Ver más / Ver menos" para leerlo
 * completo. La detección de desbordamiento se hace midiendo el nodo, así que
 * el botón no aparece cuando el texto entra entero.
 */
export function ExpandableText({
  text,
  className,
  clampClass = 'line-clamp-2',
}: {
  text: string
  className?: string
  clampClass?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    // Con el recorte aplicado, si el contenido real supera al visible, hay más.
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  return (
    <div className={className}>
      <p
        ref={ref}
        className={cn(
          'text-pretty text-sm text-muted-foreground',
          !expanded && clampClass,
        )}
      >
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  )
}
