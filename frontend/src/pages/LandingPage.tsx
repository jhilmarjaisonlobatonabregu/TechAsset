import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  FileSpreadsheet,
  Laptop,
  LogIn,
  MapPinOff,
  Monitor,
  Moon,
  Network,
  PackageCheck,
  Printer,
  Projector,
  ShieldCheck,
  Sun,
  Tablet,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import landingHero from '../assets/images/landing-hero.png';
import { Badge, Button, Card } from '../components/ui';
import { useTheme } from '../context/ThemeContext';

export interface LandingPageProps {
  onIniciarSesion: () => void;
}

function OndaDecorativa({
  posicion,
  className,
}: {
  posicion: 'arriba' | 'abajo';
  className: string;
}) {
  const path =
    posicion === 'arriba'
      ? 'M0,0 L1440,0 L1440,48 C1140,104 720,16 360,64 C180,88 80,68 0,44 Z'
      : 'M0,120 L1440,120 L1440,68 C1140,12 720,100 360,52 C180,28 80,48 0,72 Z';

  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-16 w-full sm:h-24 ${
        posicion === 'arriba' ? 'top-0' : 'bottom-0'
      } ${className}`}
    >
      <path fill="currentColor" d={path} />
    </svg>
  );
}

const PROBLEMAS_RESUELTOS = [
  {
    titulo: 'Pérdida de información',
    descripcion: 'Una base de datos centralizada reemplaza las hojas de cálculo.',
    icono: FileSpreadsheet,
  },
  {
    titulo: 'Duplicidad de registros',
    descripcion: 'El código patrimonial y el correo electrónico no se pueden repetir.',
    icono: AlertTriangle,
  },
  {
    titulo: 'Falta de control de préstamos',
    descripcion:
      'Cada préstamo se solicita, se aprueba y se devuelve con responsable y observaciones.',
    icono: ArrowLeftRight,
  },
  {
    titulo: 'Desconocimiento de la ubicación de los equipos',
    descripcion: 'Cada equipo prestado queda asociado a su usuario y a su área.',
    icono: MapPinOff,
  },
  {
    titulo: 'Dificultad para conocer la disponibilidad de activos',
    descripcion:
      'El inventario muestra qué equipos están disponibles, prestados, en mantenimiento o de baja.',
    icono: PackageCheck,
  },
  {
    titulo: 'Ausencia de indicadores para la toma de decisiones',
    descripcion: 'El dashboard muestra los indicadores de equipos y préstamos.',
    icono: BarChart3,
  },
  {
    titulo: 'Procesos lentos para la asignación y devolución de equipos',
    descripcion: 'La solicitud, la aprobación y la devolución se registran en el mismo sistema.',
    icono: Clock,
  },
] as const;

const MODULOS_SISTEMA = [
  {
    titulo: 'Gestión de Usuarios',
    etiqueta: 'Usuarios',
    variante: 'purple' as const,
    icono: Users,
    funciones: [
      'Registrar usuarios.',
      'Modificar usuarios.',
      'Consultar usuarios.',
      'Deshabilitar usuarios.',
    ],
  },
  {
    titulo: 'Gestión de Equipos',
    etiqueta: 'Inventario',
    variante: 'blue' as const,
    icono: Laptop,
    funciones: [
      'Registrar equipos tecnológicos.',
      'Modificar equipos.',
      'Consultar inventario.',
      'Actualizar estado del equipo.',
    ],
  },
  {
    titulo: 'Gestión de Préstamos',
    etiqueta: 'Préstamos',
    variante: 'emerald' as const,
    icono: ArrowLeftRight,
    funciones: [
      'Solicitar, aprobar y registrar préstamos.',
      'Registrar devoluciones.',
      'Consultar historial de préstamos.',
      'Consultar préstamos activos.',
    ],
  },
  {
    titulo: 'Gestión de Reportes y Dashboard',
    etiqueta: 'Indicadores',
    variante: 'amber' as const,
    icono: BarChart3,
    funciones: [
      'Visualizar indicadores en el dashboard general.',
      'Consultar equipos disponibles y prestados.',
      'Consultar préstamos por área y equipos más utilizados.',
      'Consultar movimientos históricos.',
    ],
  },
] as const;

const TIPOS_EQUIPOS = [
  { nombre: 'Laptops', icono: Laptop },
  { nombre: 'Computadoras de escritorio', icono: Cpu },
  { nombre: 'Monitores', icono: Monitor },
  { nombre: 'Impresoras', icono: Printer },
  { nombre: 'Tablets', icono: Tablet },
  { nombre: 'Proyectores multimedia', icono: Projector },
  { nombre: 'Equipos de red', icono: Network },
] as const;

const ROLES_SISTEMA = [
  {
    rol: 'Administrador',
    variante: 'purple' as const,
    icono: ShieldCheck,
    resumen: 'Responsable de administrar la información del sistema.',
    detalle:
      'Gestiona usuarios (único autorizado para deshabilitar cuentas), gestiona equipos, consulta reportes y supervisa préstamos.',
  },
  {
    rol: 'Responsable de Tecnología',
    variante: 'blue' as const,
    icono: Wrench,
    resumen: 'Responsable de la asignación y control de los equipos tecnológicos.',
    detalle:
      'Registra equipos, aprueba préstamos solicitados, registra devoluciones y consulta el inventario institucional.',
  },
  {
    rol: 'Colaborador',
    variante: 'emerald' as const,
    icono: UserCheck,
    resumen: 'Usuario que solicita equipos tecnológicos para el desarrollo de sus actividades.',
    detalle:
      'Solicita préstamos de equipos, consulta su historial de préstamos y verifica la disponibilidad de activos.',
  },
] as const;

export function LandingPage({ onIniciarSesion }: LandingPageProps) {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Encabezado institucional fijo y opaco */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                TechAsset
              </span>
              <span className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                Innovatech Solutions S.A.C.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={onIniciarSesion}
              leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Presentación y propósito del sistema */}
        <section
          aria-labelledby="titulo-principal"
          className="relative overflow-hidden border-b border-sky-100/90 bg-sky-50 py-14 sm:py-16 lg:py-20 dark:border-slate-800 dark:bg-[#0B1120]"
        >
          <img
            src={landingHero}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[#f8fbff]/88 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#f8fbff]/85 lg:via-[#f8fbff]/70 lg:to-transparent dark:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-[#0B1120]/88 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#0B1120]/90 lg:via-[#0B1120]/85 lg:to-[#0B1120]/70 dark:block"
          />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl space-y-5 lg:max-w-[54%]">
              <Badge variant="blue" dot>
                Innovatech Solutions S.A.C. · Gerencia de Tecnología
              </Badge>
              <h1
                id="titulo-principal"
                className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white"
              >
                Sistema de Gestión de Inventario y Préstamo de Equipos Tecnológicos
              </h1>
              <p className="text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-200">
                <strong>TechAsset</strong> tiene como propósito administrar el inventario tecnológico
                institucional y controlar el préstamo de equipos a los colaboradores de{' '}
                <strong>Innovatech Solutions S.A.C.</strong> en sus diversas áreas funcionales.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onIniciarSesion}
                  leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
                >
                  Iniciar sesión
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Problema que resuelve */}
        <section
          aria-labelledby="titulo-problema"
          className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-slate-50 to-slate-50 py-12 sm:py-14 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950"
        >
          <OndaDecorativa
            posicion="abajo"
            className="text-sky-100/80 dark:text-sky-950/30"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2
                id="titulo-problema"
                className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
              >
                Problema que resuelve
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Reemplaza el control manual mediante hojas de cálculo para evitar los inconvenientes
                operativos en la asignación y devolución de activos:
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PROBLEMAS_RESUELTOS.map((item) => {
                const Icono = item.icono;
                return (
                  <Card key={item.titulo} className="h-full" bodyClassName="p-5 space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                      <Icono className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.titulo}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.descripcion}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Qué ofrece el sistema: 4 módulos del alcance funcional */}
        <section
          aria-labelledby="titulo-modulos"
          className="relative overflow-hidden border-y border-sky-100/80 bg-white py-12 sm:py-14 dark:border-slate-800/80 dark:bg-slate-900"
        >
          <OndaDecorativa
            posicion="arriba"
            className="text-sky-50 dark:text-slate-800/40"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2
                id="titulo-modulos"
                className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
              >
                Alcance funcional del sistema
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                La plataforma integra cuatro módulos para administrar usuarios, equipos, préstamos e
                indicadores de gestión:
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {MODULOS_SISTEMA.map((mod) => {
                const Icono = mod.icono;
                return (
                  <Card
                    key={mod.titulo}
                    title={mod.titulo}
                    headerRight={<Badge variant={mod.variante}>{mod.etiqueta}</Badge>}
                    bodyClassName="p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Icono className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {mod.funciones.map((fn) => (
                          <li key={fn} className="flex items-center gap-2">
                            <CheckCircle2
                              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tipos de equipos tecnológicos que gestiona */}
        <section
          aria-labelledby="titulo-equipos"
          className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 via-slate-50 to-sky-50/40 py-12 sm:py-14 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/60"
        >
          <OndaDecorativa
            posicion="abajo"
            className="text-sky-100/75 dark:text-blue-950/30"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2
                id="titulo-equipos"
                className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
              >
                Activos tecnológicos que administra
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Catálogo organizado en las siete categorías de equipamiento utilizadas por los
                colaboradores:
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {TIPOS_EQUIPOS.map((eq) => {
                const Icono = eq.icono;
                return (
                  <Card
                    key={eq.nombre}
                    className="h-full"
                    bodyClassName="p-4 flex flex-col items-center text-center gap-2.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                      <Icono className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {eq.nombre}
                    </span>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Actores y roles del sistema */}
        <section
          aria-labelledby="titulo-roles"
          className="relative overflow-hidden border-t border-sky-100/80 bg-white py-12 sm:py-14 dark:border-slate-800/80 dark:bg-slate-900"
        >
          <OndaDecorativa
            posicion="arriba"
            className="text-sky-50/90 dark:text-slate-800/35"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <h2
                id="titulo-roles"
                className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white"
              >
                Actores del sistema
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                Acceso con usuario y contraseña, con permisos según el rol dentro de la organización.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {ROLES_SISTEMA.map((actor) => {
                const Icono = actor.icono;
                return (
                  <Card
                    key={actor.rol}
                    className="h-full"
                    bodyClassName="p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Icono className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <Badge variant={actor.variante} dot>
                          {actor.rol}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {actor.rol}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {actor.resumen}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {actor.detalle}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Pie de página institucional */}
      <footer className="border-t border-slate-200 bg-slate-100/80 py-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 text-sm text-slate-600 sm:px-6 dark:text-slate-400">
          <p>
            <strong>TechAsset</strong> · Innovatech Solutions S.A.C. · Sistema de Gestión de
            Inventario y Préstamo de Equipos Tecnológicos
          </p>
        </div>
      </footer>
    </div>
  );
}
