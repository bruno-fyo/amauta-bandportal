'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

type Step = 'request' | 'verify' | 'reset' | 'done'

const GENERIC_MSG =
  'Si existe una cuenta asociada a ese correo, te enviaremos un código para recuperar tu contraseña.'
const RESEND_SECONDS = 45
const OTP_LENGTH = 6
const MIN_PASSWORD = 8

const inputBase =
  'h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15'

// Oculta parcialmente el email: b***@empresa.com
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const first = local.slice(0, 1)
  return `${first}***@${domain}`
}

export function PasswordRecovery({
  defaultEmail = '',
  onBackToLogin,
}: {
  defaultEmail?: string
  onBackToLogin: () => void
}) {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState(defaultEmail)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  return (
    <div className="mt-10">
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {info && step !== 'done' && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{info}</span>
        </div>
      )}

      {step === 'request' && (
        <RequestStep
          email={email}
          setEmail={setEmail}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          setInfo={setInfo}
          onSent={() => setStep('verify')}
          onBackToLogin={onBackToLogin}
        />
      )}

      {step === 'verify' && (
        <VerifyStep
          email={email}
          otp={otp}
          setOtp={setOtp}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          setInfo={setInfo}
          onVerified={() => {
            setError(null)
            setInfo(null)
            setStep('reset')
          }}
          onChangeEmail={() => {
            setOtp('')
            setError(null)
            setInfo(null)
            setStep('request')
          }}
        />
      )}

      {step === 'reset' && (
        <ResetStep
          email={email}
          otp={otp}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
          onDone={() => {
            setError(null)
            setInfo(null)
            setStep('done')
          }}
        />
      )}

      {step === 'done' && <DoneStep onBackToLogin={onBackToLogin} />}
    </div>
  )
}

// --------------------------------------------------------------------------
// Paso 1 — Solicitud del código
// --------------------------------------------------------------------------
function RequestStep({
  email,
  setEmail,
  loading,
  setLoading,
  setError,
  setInfo,
  onSent,
  onBackToLogin,
}: {
  email: string
  setEmail: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
  setInfo: (v: string | null) => void
  onSent: () => void
  onBackToLogin: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const normalized = email.trim().toLowerCase()
    try {
      // Respuesta genérica siempre: no revelamos si el email existe o no.
      await authClient.emailOtp.requestPasswordReset({ email: normalized })
    } catch (err) {
      console.error('[v0] requestPasswordReset error:', err)
    } finally {
      setEmail(normalized)
      setInfo(GENERIC_MSG)
      setLoading(false)
      onSent()
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Ingresá el email asociado a tu cuenta y te enviaremos un código para crear una nueva
          contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="recover-email"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              id="recover-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              placeholder="nombre@amauta.ag"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Enviar código
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al inicio de sesión
      </button>
    </>
  )
}

// --------------------------------------------------------------------------
// Paso 2 — Validación del código
// --------------------------------------------------------------------------
function VerifyStep({
  email,
  otp,
  setOtp,
  loading,
  setLoading,
  setError,
  setInfo,
  onVerified,
  onChangeEmail,
}: {
  email: string
  otp: string
  setOtp: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
  setInfo: (v: string | null) => void
  onVerified: () => void
  onChangeEmail: () => void
}) {
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [seconds])

  const digits = otp.padEnd(OTP_LENGTH).split('').slice(0, OTP_LENGTH)

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      // Borrado
      const arr = otp.split('')
      arr[index] = ''
      setOtp(arr.join('').slice(0, OTP_LENGTH))
      return
    }
    const arr = digits.map((d) => (d === ' ' ? '' : d))
    // Si pegan varios dígitos, distribuirlos desde la posición actual.
    for (let i = 0; i < clean.length && index + i < OTP_LENGTH; i++) {
      arr[index + i] = clean[i]
    }
    const next = arr.join('').slice(0, OTP_LENGTH)
    setOtp(next)
    const focusIndex = Math.min(index + clean.length, OTP_LENGTH - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)
      inputsRef.current[index + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted) {
      setOtp(pasted)
      inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.replace(/\s/g, '')
    if (code.length !== OTP_LENGTH) {
      setError('Ingresá los 6 dígitos del código.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.checkVerificationOtp({
        email,
        type: 'forget-password',
        otp: code,
      })
      if (error) {
        setError(traducirOtpError(error.code, error.message))
        setLoading(false)
        return
      }
      setLoading(false)
      onVerified()
    } catch (err) {
      console.error('[v0] checkVerificationOtp error:', err)
      setError('No pudimos verificar el código. Intentá de nuevo.')
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(null)
    setLoading(true)
    try {
      await authClient.emailOtp.requestPasswordReset({ email })
      setInfo('Si existe una cuenta, te reenviamos un nuevo código.')
      setSeconds(RESEND_SECONDS)
    } catch (err) {
      console.error('[v0] resend error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Ingresá el código
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Enviamos un código de 6 dígitos a{' '}
          <span className="font-semibold text-foreground">{maskEmail(email)}</span>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-5">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={OTP_LENGTH}
              value={digits[i]?.trim() ?? ''}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`Dígito ${i + 1} del código`}
              className="h-14 w-full rounded-xl border border-border bg-card text-center text-lg font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Verificar código
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || seconds > 0}
          className="font-semibold text-primary transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-100"
        >
          {seconds > 0 ? `Reenviar código en ${seconds}s` : 'Reenviar código'}
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Cambiar el email
        </button>
      </div>
    </>
  )
}

// --------------------------------------------------------------------------
// Paso 3 — Nueva contraseña
// --------------------------------------------------------------------------
function ResetStep({
  email,
  otp,
  loading,
  setLoading,
  setError,
  onDone,
}: {
  email: string
  otp: string
  loading: boolean
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
  onDone: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const longEnough = password.length >= MIN_PASSWORD
  const matches = password.length > 0 && password === confirm
  const canSubmit = longEnough && matches && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!longEnough) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (!matches) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp: otp.replace(/\s/g, ''),
        password,
      })
      if (error) {
        setError(traducirOtpError(error.code, error.message))
        setLoading(false)
        return
      }
      setLoading(false)
      onDone()
    } catch (err) {
      console.error('[v0] resetPassword error:', err)
      setError('No pudimos actualizar la contraseña. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Creá una nueva contraseña
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          Elegí una contraseña segura para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="new-password"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              id="new-password"
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputBase} pr-11`}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputBase} pr-11`}
              placeholder="Repetí la contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <li className={longEnough ? 'text-primary' : ''}>
            {longEnough ? '✓' : '•'} Al menos {MIN_PASSWORD} caracteres
          </li>
          <li className={matches ? 'text-primary' : ''}>
            {matches ? '✓' : '•'} Ambas contraseñas coinciden
          </li>
        </ul>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            'Actualizar contraseña'
          )}
        </button>
      </form>
    </>
  )
}

// --------------------------------------------------------------------------
// Paso final — Confirmación
// --------------------------------------------------------------------------
function DoneStep({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-7 text-primary" aria-hidden="true" />
      </div>
      <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
        Tu contraseña fue actualizada correctamente.
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        Ya podés iniciar sesión con tu nueva contraseña.
      </p>
      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Volver a iniciar sesión
      </button>
    </div>
  )
}

function traducirOtpError(code?: string, message?: string): string {
  switch (code) {
    case 'INVALID_OTP':
      return 'El código es incorrecto. Revisalo e intentá de nuevo.'
    case 'OTP_EXPIRED':
      return 'El código venció. Solicitá uno nuevo para continuar.'
    case 'TOO_MANY_ATTEMPTS':
      return 'Demasiados intentos. Solicitá un código nuevo e intentá otra vez.'
    default:
      if (message?.toLowerCase().includes('password')) {
        return 'La contraseña no cumple los requisitos mínimos.'
      }
      return 'No pudimos procesar el código. Solicitá uno nuevo e intentá de nuevo.'
  }
}
