import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import loginBg from '../assets/images/login.png';
import logoOficial from '../assets/images/logo.png';
import { Button, Card, FormField, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/apiClient';
import { mensajeError } from '../utils/errores';
import { loginSchema, type LoginFormValues } from '../utils/esquemas';

export interface LoginPageProps {
  mensajeSesion?: string | null;
  onVolverLanding?: () => void;
  onRecuperarContrasena?: () => void;
}

export function LoginPage({ mensajeSesion, onVolverLanding, onRecuperarContrasena }: LoginPageProps) {
  const { iniciarSesion, limpiarAvisoSesion } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const alerta = errorServidor ?? mensajeSesion;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    limpiarAvisoSesion();
    try {
      await iniciarSesion(valores.correo.trim(), valores.password);
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403 || err.codigo?.startsWith('AUTH'))
      ) {
        setErrorServidor('Credenciales de acceso incorrectas o usuario no habilitado.');
      } else {
        setErrorServidor(mensajeError(err));
      }
    }
  });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Panel izquierdo de marca e institucional — 60% en pantallas grandes (lg:col-span-3) */}
      <aside className="relative hidden lg:col-span-3 lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-16 text-white select-none">
        {/* Imagen tecnológica de fondo decorativa y nítida */}
        <img
          src={loginBg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Degradado direccional izquierda → derecha y degradado inferior para garantizar contraste WCAG */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#040B1A]/90 via-[#040B1A]/55 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040B1A]/85 via-transparent to-transparent"
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-px h-full w-12 lg:w-16"
        >
          <path
            className="fill-sky-300/25 dark:fill-sky-500/15"
            d="M100,0 L60,0 C16,280 84,680 28,1000 L100,1000 Z"
          />
          <path
            className="fill-[#F4F8FD] dark:fill-slate-950"
            d="M100,0 L72,0 C30,280 96,680 42,1000 L100,1000 Z"
          />
        </svg>

        {/* Encabezado del panel de marca: Logotipo oficial */}
        <div className="relative z-10 flex items-center">
          <img
            src={logoOficial}
            alt="TechAsset - Innovatech Solutions S.A.C."
            className="h-20 lg:h-24 w-auto object-contain"
          />
        </div>

        {/* Titular y párrafo descriptivo — alineados verticalmente al centro con mayor jerarquía y espaciado */}
        <div className="relative z-10 my-auto py-12 xl:py-16 max-w-xl">
          <h1 className="text-4xl xl:text-5xl leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-sm">
            Control inteligente de activos tecnológicos.
          </h1>
          <p className="mt-6 text-base xl:text-lg leading-relaxed text-slate-200 font-normal drop-shadow-sm">
            Plataforma institucional para el registro, asignación, devolución y seguimiento de
            equipamiento informático con trazabilidad patrimonial y disponibilidad en tiempo real.
          </p>
        </div>

        {/* Pie con el copyright abajo */}
        <div className="relative z-10">
          <p className="text-xs text-slate-300">
            Innovatech Solutions S.A.C. © 2026 · Sistema Institucional de Gestión Patrimonial
          </p>
        </div>
      </aside>

      {/* Panel derecho del formulario — 40% en pantallas grandes (lg:col-span-2) */}
      <main className="relative overflow-hidden col-span-1 lg:col-span-2 flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 via-slate-50 to-sky-50/70 p-6 sm:p-8 xl:p-12 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 w-full text-sky-100/85 dark:text-sky-950/35"
        >
          <path
            fill="currentColor"
            d="M0,0 L1440,0 L1440,48 C1140,104 720,16 360,64 C180,88 80,68 0,44 Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 w-full text-sky-100/90 dark:text-blue-950/35"
        >
          <path
            fill="currentColor"
            d="M0,120 L1440,120 L1440,68 C1140,12 720,100 360,52 C180,28 80,48 0,72 Z"
          />
        </svg>

        <Card className="relative z-10 w-full max-w-[440px] shadow-lg" bodyClassName="p-6 sm:p-8">
          <div>
            {onVolverLanding && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={onVolverLanding}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Volver a la presentación</span>
                </button>
              </div>
            )}
            <div className="mb-5 flex items-center justify-center rounded-xl border border-slate-800/80 bg-[#0B1120] px-6 py-3">
              <img
                src={logoOficial}
                alt="TechAsset - Innovatech Solutions S.A.C."
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Iniciar sesión
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Ingrese sus credenciales institucionales para acceder a la plataforma.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 space-y-4"
            aria-label="Formulario de inicio de sesión"
          >
            {alerta && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{alerta}</span>
              </div>
            )}

            <FormField
              label="Correo institucional"
              htmlFor="correo"
              required
              error={errors.correo?.message}
            >
              <Input
                id="correo"
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="usuario@innovatech.pe"
                prefixIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                hasError={Boolean(errors.correo)}
                {...register('correo')}
              />
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <Input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                prefixIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
                hasError={Boolean(errors.password)}
                suffixElement={
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    className="cursor-pointer rounded p-1 text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
                {...register('password')}
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isSubmitting}
                leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
              >
                Iniciar sesión
              </Button>
            </div>
          </form>

          {onRecuperarContrasena && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onRecuperarContrasena}
                className="inline-flex cursor-pointer items-center rounded-sm text-sm font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
            ¿Problemas para ingresar? Contacte al Administrador.
          </p>
        </Card>
      </main>
    </div>
  );
}
