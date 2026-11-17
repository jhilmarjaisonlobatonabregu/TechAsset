import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormField, Input, StatusBadge } from '../components/ui';
import { DEMO_USERS_FALLBACK } from '../constants/catalogos';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { DemoUserDto } from '../types';
import { mensajeError } from '../utils/errores';
import { loginSchema, type LoginFormValues } from '../utils/esquemas';

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [cuentasDemo, setCuentasDemo] = useState<readonly DemoUserDto[]>(DEMO_USERS_FALLBACK);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { correo: '', password: '' } });

  useEffect(() => {
    void authService.obtenerDemoUsers().then(setCuentasDemo);
  }, []);

  const onSubmit = handleSubmit(async (valores) => {
    setErrorServidor(null);
    try {
      await iniciarSesion(valores.correo.trim(), valores.password);
    } catch (err: unknown) {
      setErrorServidor(mensajeError(err));
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/40 via-slate-900 to-slate-950" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold">TechAsset</p>
            <p className="text-xs text-slate-300">Innovatech Solutions S.A.C.</p>
          </div>
        </div>
        <div className="relative">
          <h1 className="max-w-md text-4xl leading-tight font-bold">Control inteligente de activos tecnológicos.</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200/90">
            Registre, preste y recupere laptops, equipos y periféricos con trazabilidad completa y disponibilidad en tiempo real.
          </p>
        </div>
        <p className="relative text-xs text-slate-300">Innovatech Solutions S.A.C. © 2026</p>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Acceso seguro con JWT
            </span>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ingrese con su correo institucional.</p>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Formulario de inicio de sesión">
            {errorServidor && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {errorServidor}
              </div>
            )}
            <FormField label="Correo institucional" htmlFor="correo" required error={errors.correo?.message}>
              <Input id="correo" type="email" autoComplete="username" placeholder="usuario@innovatech.pe" prefixIcon={<Mail className="h-4 w-4" />} hasError={Boolean(errors.correo)} {...register('correo')} />
            </FormField>
            <FormField label="Contraseña" htmlFor="password" required error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" prefixIcon={<KeyRound className="h-4 w-4" />} hasError={Boolean(errors.password)} {...register('password')} />
            </FormField>
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} leftIcon={<LogIn className="h-4 w-4" />}>
              Ingresar al sistema
            </Button>
          </form>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" aria-label="Acceso rápido para evaluación">
            <p className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">Acceso rápido por rol (demostración)</p>
            <div className="space-y-2">
              {cuentasDemo.map((cuenta) => (
                <button
                  key={cuenta.correo}
                  type="button"
                  onClick={() => {
                    setValue('correo', cuenta.correo, { shouldValidate: true });
                    setValue('password', cuenta.passwordDemo, { shouldValidate: true });
                    setErrorServidor(null);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{cuenta.nombreCompleto}</span>
                    <span className="block truncate text-xs text-slate-500">{cuenta.correo}</span>
                  </span>
                  <StatusBadge status={cuenta.rol} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
