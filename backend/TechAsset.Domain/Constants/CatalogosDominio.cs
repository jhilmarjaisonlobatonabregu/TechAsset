namespace TechAsset.Domain.Constants;

public static class Roles
{
    public const string Administrador = "Administrador";
    public const string ResponsableTecnologia = "Responsable de Tecnología";
    public const string Colaborador = "Colaborador";

    public static readonly IReadOnlyList<string> Todos = new[]
    {
        Administrador,
        ResponsableTecnologia,
        Colaborador
    };
}

public static class CategoriasEquipo
{
    public const string Laptops = "Laptops";
    public const string ComputadorasEscritorio = "Computadoras de escritorio";
    public const string Monitores = "Monitores";
    public const string Impresoras = "Impresoras";
    public const string Tablets = "Tablets";
    public const string ProyectoresMultimedia = "Proyectores multimedia";
    public const string EquiposRed = "Equipos de red";

    public static readonly IReadOnlyList<string> Todas = new[]
    {
        Laptops,
        ComputadorasEscritorio,
        Monitores,
        Impresoras,
        Tablets,
        ProyectoresMultimedia,
        EquiposRed
    };
}

public static class EstadosEquipo
{
    public const string Disponible = "Disponible";
    public const string Prestado = "Prestado";
    public const string Mantenimiento = "Mantenimiento";
    public const string Baja = "Baja";

    public static readonly IReadOnlyList<string> Todos = new[]
    {
        Disponible,
        Prestado,
        Mantenimiento,
        Baja
    };
}

public static class EstadosPrestamo
{
    public const string Pendiente = "Pendiente";
    public const string Activo = "Activo";
    public const string Devuelto = "Devuelto";

    public static readonly IReadOnlyList<string> Todos = new[]
    {
        Pendiente,
        Activo,
        Devuelto
    };
}

public static class TiposMovimiento
{
    public const string AltaEquipo = "AltaEquipo";
    public const string ActualizacionEquipo = "ActualizacionEquipo";
    public const string Prestamo = "Prestamo";
    public const string Devolucion = "Devolucion";
    public const string CambioEstado = "CambioEstado";
    public const string BajaLogica = "BajaLogica";
}

public static class Areas
{
    public const string InfraestructuraSoporte = "Infraestructura y Soporte";
}

public static class CredencialesPorDefecto
{
    public const string ContrasenaColaborador = "Colab2026!";
}

public static class MensajesRegla
{
    public const string Rn01EquipoConPrestamoActivo = "RN-01: Un equipo solo puede estar asociado a un préstamo activo.";
    public const string Rn04DevolucionPosteriorAPrestamo = "RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo.";
    public const string Rn05ResponsableRegistrado = "RN-05: Todo préstamo debe tener un usuario responsable registrado.";
    public const string Rn05ResponsableValidoYActivo = "RN-05: Todo préstamo debe tener un usuario responsable válido y activo registrado.";
    public const string Rn10DevolucionConObservacion = "RN-10: Toda devolución deberá registrar observaciones.";
}
