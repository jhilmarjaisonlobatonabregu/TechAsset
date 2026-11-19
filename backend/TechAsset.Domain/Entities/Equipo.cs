using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;

namespace TechAsset.Domain.Entities;

public class Equipo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CodigoPatrimonial { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Categoria { get; set; } = CategoriasEquipo.Laptops;
    public string Marca { get; set; } = string.Empty;
    public string Estado { get; set; } = EstadosEquipo.Disponible;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public ICollection<Prestamo> Prestamos { get; set; } = new List<Prestamo>();
    public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();

    public void ValidarDisponibleParaPrestamo()
    {
        if (string.Equals(Estado, EstadosEquipo.Mantenimiento, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "RN-02",
                "RN-02: No se puede prestar un equipo en estado 'Mantenimiento'.",
                422);
        }

        if (string.Equals(Estado, EstadosEquipo.Baja, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "RN-03",
                "RN-03: No se puede prestar un equipo en estado 'Baja'.",
                422);
        }

        if (string.Equals(Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "RN-01",
                MensajesRegla.Rn01EquipoConPrestamoActivo,
                409);
        }
    }

    public void MarcarComoPrestado()
    {
        ValidarDisponibleParaPrestamo();
        Estado = EstadosEquipo.Prestado;
    }

    public void MarcarComoDevuelto(string? estadoDestino = null)
    {
        Estado = string.Equals(estadoDestino?.Trim(), EstadosEquipo.Mantenimiento, StringComparison.OrdinalIgnoreCase)
            ? EstadosEquipo.Mantenimiento
            : EstadosEquipo.Disponible;
    }

    public void CambiarEstado(string nuevoEstado)
    {
        var estadoNormalizado = nuevoEstado?.Trim() ?? string.Empty;
        if (!EstadosEquipo.Todos.Contains(estadoNormalizado))
        {
            throw new ReglaNegocioException(
                "VAL-ESTADO",
                $"El estado '{nuevoEstado}' no es válido. Estados permitidos: {string.Join(", ", EstadosEquipo.Todos)}.",
                400);
        }

        if (string.Equals(Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(estadoNormalizado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "RN-01",
                "RN-01: El equipo tiene un préstamo activo. Debe registrar la devolución antes de cambiar su estado.",
                409);
        }

        Estado = estadoNormalizado;
    }

    public void Actualizar(string codigoPatrimonial, string nombre, string categoria, string marca, string? nuevoEstado = null)
    {
        CodigoPatrimonial = codigoPatrimonial.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        Categoria = categoria.Trim();
        Marca = marca.Trim();

        if (!string.IsNullOrWhiteSpace(nuevoEstado) && !string.Equals(Estado, nuevoEstado.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            CambiarEstado(nuevoEstado);
        }
    }

    public void DarDeBajaLogica(bool aplicarBajaLogica)
    {
        var tienePrestamoActivo = Prestamos.Any(p => p.EstadoPrestamo == EstadosPrestamo.Activo) ||
                                  string.Equals(Estado, EstadosEquipo.Prestado, StringComparison.OrdinalIgnoreCase);

        if (tienePrestamoActivo)
        {
            throw new ReglaNegocioException(
                "RN-01",
                "RN-01: No se puede eliminar ni dar de baja un equipo que tiene un préstamo activo.",
                409);
        }

        if (Prestamos.Count > 0 && !aplicarBajaLogica)
        {
            throw new ReglaNegocioException(
                "RN-06",
                "RN-06: No se puede eliminar un equipo con historial de préstamos. Utilice la baja lógica cambiando su estado a 'Baja'.",
                409);
        }

        Estado = EstadosEquipo.Baja;
    }
}
