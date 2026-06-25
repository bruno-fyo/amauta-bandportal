import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Category } from '@/lib/data'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={category.href}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <Image
        src={category.image || '/placeholder.svg'}
        alt={category.title}
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d1b16]/85 via-[#1d1b16]/25 to-transparent" />

      <div className="relative flex items-end justify-between gap-3 p-5">
        <div>
          <h3 className="text-balance text-lg font-bold leading-tight text-[#fcf9f6]">
            {category.title}
          </h3>
          <p className="mt-1 text-sm text-[#fcf9f6]/80">
            {category.count} recursos
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:scale-110">
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
