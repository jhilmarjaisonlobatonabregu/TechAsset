import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormField, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/apiClient';
import { mensajeError } from '../utils/errores';
import { loginSchema, type LoginFormValues } from '../utils/esquemas';

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

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
        {/* Capa de imagen de fondo opcional (object-cover) */}
        {/* Para habilitar una imagen de fondo institucional, descomentar: */}
        {/* <img src="/images/login-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none" /> */}

        {/* Degradado azul de fondo y capa oscura (overlay) para contraste accesible WCAG AAA */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-900/95 to-slate-950"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl"
          aria-hidden="true"
        />

        {/* Encabezado del panel de marca: Logo + TechAsset / Innovatech Solutions S.A.C. */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">TechAsset</p>
            <p className="text-xs font-medium text-slate-300">Innovatech Solutions S.A.C.</p>
          </div>
        </div>

        {/* Titular y párrafo descriptivo — alineados verticalmente al centro con mayor jerarquía y espaciado */}
        <div className="relative z-10 my-auto py-12 xl:py-16 max-w-xl">
          <h1 className="text-4xl xl:text-5xl leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-sm">
            Control inteligente de activos tecnológicos.
          </h1>
          <p className="mt-6 text-base xl:text-lg leading-relaxed text-slate-200 font-normal">
            Plataforma institucional para el registro, asignación, devolución y seguimiento de
            equipamiento informático con trazabilidad patrimonial y disponibilidad en tiempo real.
          </p>
        </div>

        {/* Pie con el copyright abajo */}
        <div className="relative z-10">
          <p className="text-xs text-slate-400">
            Innovatech Solutions S.A.C. © 2026 · Sistema Institucional de Gestión Patrimonial
          </p>
        </div>
      </aside>

      {/* Panel derecho del formulario — 40% en pantallas grandes (lg:col-span-2) */}
      <main className="col-span-1 lg:col-span-2 flex min-h-screen items-center justify-center p-6 sm:p-8 xl:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-[420px] my-auto flex flex-col justify-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300 w-fit">
              <ShieldCheck className="h-3.5 w-3.5" /> Acceso seguro con JWT
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ingrese sus credenciales institucionales para acceder a la plataforma.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 space-y-4"
            aria-label="Formulario de inicio de sesión"
          >
            {errorServidor && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{errorServidor}</span>
              </div>
            )}

            <FormField
              label="Correo institucional o usuario"
              htmlFor="correo"
              required
              error={errors.correo?.message}
            >
              <Input
                id="correo"
                type="text"
                autoFocus
                autoComplete="username"
                placeholder="usuario@innovatech.pe o admin"
                prefixIcon={<Mail className="h-4 w-4" />}
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
                prefixIcon={<KeyRound className="h-4 w-4" />}
                hasError={Boolean(errors.password)}
                suffixElement={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    className="cursor-pointer p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                Ingresar al sistema
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            ¿Problemas para ingresar? Contacte al Administrador.
          </p>
        </div>
      </main>
    </div>
  );
}
