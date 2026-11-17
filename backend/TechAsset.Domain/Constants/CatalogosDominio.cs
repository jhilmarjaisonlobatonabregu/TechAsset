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
    public const string Activo = "Activo";
    public const string Devuelto = "Devuelto";
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
