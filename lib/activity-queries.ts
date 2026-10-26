import 'server-only'
import { and, count, countDistinct, desc, eq, gte, ilike, inArray, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityLog, user, ROLES, type Role } from '@/lib/db/schema'
import { ACTIVITY_TYPES, type ActivityType } from '@/lib/activity'

export const PAGE_SIZE = 50
const TZ_OFFSET = '-03:00'

export type ActivityFilters = {
  from: string
  to: string
  role: Role | ''
  type: ActivityType | 'descargas' | ''
  q: string
  page: number
}

type RawParams = Record<string, string | string[] | undefined>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function todayAR(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d)
}

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? ''
}

export function parseActivityFilters(params: RawParams): ActivityFilters {
  let from = first(params.from)
  let to = first(params.to)
  if (!DATE_RE.test(from)) from = todayAR(-29)
  if (!DATE_RE.test(to)) to = todayAR()
  if (from > to) [from, to] = [to, from]

  const role = first(params.role)
  const type = first(params.type)
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1)

  return {
    from,
    to,
    role: (ROLES as string[]).includes(role) ? (role as Role) : '',
    type:
      type === 'descargas' || (ACTIVITY_TYPES as string[]).includes(type)
        ? (type as ActivityFilters['type'])
        : '',
    q: first(params.q).slice(0, 120),
    page,
  }
}

export function filtersToSearch(f: ActivityFilters, overrides: Partial<ActivityFilters> = {}) {
  const merged = { ...f, ...overrides }
  const sp = new URLSearchParams()
  sp.set('from', merged.from)
  sp.set('to', merged.to)
  if (merged.role) sp.set('role', merged.role)
  if (merged.type) sp.set('type', merged.type)
  if (merged.q) sp.set('q', merged.q)
  if (merged.page > 1) sp.set('page', String(merged.page))
  return sp.toString()
}

function rangeConditions(f: ActivityFilters): SQL[] {
  return [
    gte(activityLog.createdAt, new Date(`${f.from}T00:00:00${TZ_OFFSET}`)),
    lte(activityLog.createdAt, new Date(`${f.to}T23:59:59.999${TZ_OFFSET}`)),
  ]
}

function scopeConditions(f: ActivityFilters): SQL[] {
  const conds = rangeConditions(f)
  if (f.role) conds.push(eq(activityLog.userRole, f.role))
  if (f.q) {
    const term = `%${f.q.replace(/[%_]/g, '\\$&')}%`
    const match = or(ilike(activityLog.userEmail, term), ilike(activityLog.userName, term))
    if (match) conds.push(match)
  }
  return conds
}

function eventConditions(f: ActivityFilters): SQL[] {
  const conds = scopeConditions(f)
  if (f.type === 'descargas') {
    conds.push(inArray(activityLog.type, ['asset_download', 'ficha_download']))
  } else if (f.type) {
    conds.push(eq(activityLog.type, f.type))
  }
  return conds
}

export async function getActivitySummary(f: ActivityFilters) {
  const where = and(...scopeConditions(f))
  const [row] = await db
    .select({
      activeUsers: countDistinct(activityLog.userEmail),
      logins: sql<number>`count(*) filter (where ${activityLog.type} = 'login')`.mapWith(Number),
      views: sql<number>`count(*) filter (where ${activityLog.type} = 'asset_view')`.mapWith(Number),
      downloads: sql<number>`count(*) filter (where ${activityLog.type} in ('asset_download', 'ficha_download'))`.mapWith(Number),
    })
    .from(activityLog)
    .where(where)
  return row ?? { activeUsers: 0, logins: 0, views: 0, downloads: 0 }
}

export async function getTopDownloads(f: ActivityFilters, limit = 10) {
  const conds = scopeConditions(f)
  conds.push(inArray(activityLog.type, ['asset_download', 'ficha_download']))
  const total = count()
  return db
    .select({
      type: activityLog.type,
      target: activityLog.target,
      detail: activityLog.detail,
      total,
      users: countDistinct(activityLog.userEmail),
    })
    .from(activityLog)
    .where(and(...conds))
    .groupBy(activityLog.type, activityLog.target, activityLog.detail)
    .orderBy(desc(total))
    .limit(limit)
}

export async function getActivityEvents(f: ActivityFilters, limit = PAGE_SIZE) {
  const where = and(...eventConditions(f))
  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(activityLog)
      .where(where)
      .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
      .limit(limit)
      .offset((f.page - 1) * limit),
    db.select({ total: count() }).from(activityLog).where(where),
  ])
  return { rows, total: totalRow?.total ?? 0 }
}

export async function getAllActivityEvents(f: ActivityFilters, max = 50_000) {
  return db
    .select()
    .from(activityLog)
    .where(and(...eventConditions(f)))
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(max)
}

// Usuarios (no admin) sin ningún ingreso conocido: ni en el registro ni en
// el campo lastLoginAt, que existía antes del registro.
export async function getUsersWithoutLogin() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(
      and(
        ne(user.role, 'admin'),
        isNull(user.lastLoginAt),
        sql`not exists (select 1 from ${activityLog} where ${activityLog.userId} = ${user.id} and ${activityLog.type} = 'login')`,
      ),
    )
    .orderBy(user.name)
}
