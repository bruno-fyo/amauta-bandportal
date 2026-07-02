import { cn } from '@/lib/utils'
import type { FichaCountry } from '@/lib/db/schema'
import { FICHA_COUNTRY_LABELS } from '@/lib/db/schema'

// Mini bandera para diferenciar la ficha de Argentina y la de Uruguay.
// Usa los SVG oficiales alojados en /public/flags.
export function Flag({
  country,
  className,
}: {
  country: FichaCountry
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country}.svg`}
      alt={`Bandera de ${FICHA_COUNTRY_LABELS[country]}`}
      width={20}
      height={14}
      className={cn(
        'inline-block h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10',
        className,
      )}
    />
  )
}
