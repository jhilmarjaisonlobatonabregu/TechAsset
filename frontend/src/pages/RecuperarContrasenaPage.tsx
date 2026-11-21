import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Info, KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, FormField, Input } from '../components/ui';
import { loginSchema } from '../utils/esquemas';

const recuperarContrasenaSchema = loginSchema.pick({ correo: true });
type RecuperarContrasenaFormValues = z.infer<typeof recuperarContrasenaSchema>;

export interface RecuperarContrasenaPageProps {
  onVolverLogin: () => void;
}

export function RecuperarContrasenaPage({ onVolverLogin }: RecuperarContrasenaPageProps) {
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarContrasenaFormValues>({
    resolver: zodResolver(recuperarContrasenaSchema),
    defaultValues: { correo: '' },
    mode: 'onTouched',
  });

  // Maqueta visual únicamente: no realiza llamadas al backend ni almacena el correo ingresado.
  const onSubmit = handleSubmit(() => {
    setMostrarAviso(true);
  });

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-5 bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Panel izquierdo de marca e institucional — 60% en pantallas grandes (lg:col-span-3) */}
      <aside className="relative hidden lg:col-span-3 lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-16 text-white select-none">
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

        {/* Encabezado del panel de marca */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">TechAsset</p>
            <p className="text-xs font-medium text-slate-300">Innovatech Solutions S.A.C.</p>
          </div>
        </div>

        {/* Titular y párrafo descriptivo */}
        <div className="relative z-10 my-auto py-12 xl:py-16 max-w-xl">
          <h1 className="text-4xl xl:text-5xl leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-sm">
            Control inteligente de activos tecnológicos.
          </h1>
          <p className="mt-6 text-base xl:text-lg leading-relaxed text-slate-200 font-normal">
            Plataforma institucional para el registro, asignación, devolución y seguimiento de
            equipamiento informático con trazabilidad patrimonial y disponibilidad en tiempo real.
          </p>
        </div>

        {/* Pie institucional */}
        <div className="relative z-10">
          <p className="text-xs text-slate-400">
            Innovatech Solutions S.A.C. © 2026 · Sistema Institucional de Gestión Patrimonial
          </p>
        </div>
      </aside>

      {/* Panel derecho — 40% en pantallas grandes (lg:col-span-2) */}
      <main className="col-span-1 lg:col-span-2 flex min-h-screen items-center justify-center bg-slate-50 p-6 sm:p-8 xl:p-12 dark:bg-slate-950">
        <Card className="w-full max-w-[440px] shadow-sm" bodyClassName="p-6 sm:p-8">
          <div className="mb-5">
            <button
              type="button"
              onClick={onVolverLogin}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Volver a iniciar sesión</span>
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recuperar contraseña
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Ingrese su correo institucional.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-6 space-y-4"
            aria-label="Formulario de recuperación de contraseña"
          >
            <FormField
              label="Correo institucional"
              htmlFor="correo-recuperar"
              required
              error={errors.correo?.message}
            >
              <Input
                id="correo-recuperar"
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="usuario@innovatech.pe"
                prefixIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                hasError={Boolean(errors.correo)}
                {...register('correo')}
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                leftIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
              >
                Recuperar acceso
              </Button>
            </div>
          </form>

          <div aria-live="polite" aria-atomic="true">
            {mostrarAviso && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm leading-relaxed text-blue-800 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-200"
              >
                <Info
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300"
                  aria-hidden="true"
                />
                <span>
                  Esta función todavía no está disponible. Para recuperar su acceso, contacte al
                  Administrador.
                </span>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
