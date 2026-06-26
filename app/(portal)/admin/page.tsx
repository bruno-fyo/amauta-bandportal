import { FileStack, Users, ShieldCheck } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/portal/section-heading'
import { AssetUploadForm } from '@/components/admin/asset-upload-form'
import { AssetTable } from '@/components/admin/asset-table'
import { UserTable } from '@/components/admin/user-table'
import { UserCreateForm } from '@/components/admin/user-create-form'
import { getAllAssets } from '@/app/actions/assets'
import { getUsers } from '@/app/actions/users'
import { requireAdmin } from '@/lib/session'
import { ROLE_LABELS } from '@/lib/db/schema'

export default async function AdminPage() {
  const admin = await requireAdmin()
  const [assets, users] = await Promise.all([getAllAssets(), getUsers()])

  const stats = [
    { label: 'Materiales cargados', value: assets.length, icon: FileStack },
    { label: 'Usuarios registrados', value: users.length, icon: Users },
    {
      label: 'Administradores',
      value: users.filter((u) => u.role === 'admin').length,
      icon: ShieldCheck,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Panel de Administración"
        description={`Gestioná los recursos del portal y los permisos de acceso. Sesión de ${ROLE_LABELS[admin.role]}.`}
      />

      {/* Stats */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Carga de assets */}
      <section className="mb-12">
        <SectionHeading
          title="Cargar nuevo material"
          description="Subí un archivo, asigná su categoría y definí qué roles pueden verlo."
        />
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <AssetUploadForm />
        </div>
      </section>

      {/* Listado de assets */}
      <section className="mb-12">
        <SectionHeading
          title="Materiales del portal"
          description="Todos los materiales cargados, con su visibilidad y acciones."
        />
        <AssetTable assets={assets} />
      </section>

      {/* Alta de usuarios */}
      <section className="mb-12">
        <SectionHeading
          title="Crear cuenta"
          description="Solo el administrador da de alta usuarios. Definí su contraseña inicial y su rol."
        />
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <UserCreateForm />
        </div>
      </section>

      {/* Gestión de usuarios */}
      <section>
        <SectionHeading
          title="Usuarios y roles"
          description="Cambiá el rol de cada usuario o eliminá cuentas que ya no necesiten acceso."
        />
        <UserTable users={users} currentUserId={admin.id} />
      </section>
    </div>
  )
}
