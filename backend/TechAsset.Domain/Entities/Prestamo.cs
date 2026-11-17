using TechAsset.Domain.Constants;
using TechAsset.Domain.Exceptions;

namespace TechAsset.Domain.Entities;

public class Prestamo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateOnly FechaPrestamo { get; set; }
    public DateOnly FechaDevolucion { get; set; }
    public DateOnly? FechaDevolucionReal { get; set; }
    public string Observacion { get; set; } = string.Empty;
    public string? ObservacionDevolucion { get; set; }
    public string EstadoPrestamo { get; set; } = EstadosPrestamo.Activo;

    public Guid UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public Guid EquipoId { get; set; }
    public Equipo? Equipo { get; set; }

    public Guid ResponsableId { get; set; }
    public Usuario? Responsable { get; set; }

    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

    public static Prestamo Crear(
        Guid equipoId,
        Guid usuarioId,
        Guid responsableId,
        DateOnly fechaPrestamo,
        DateOnly fechaDevolucion,
        string? observacion)
    {
        if (responsableId == Guid.Empty)
        {
            throw new ReglaNegocioException(
                "RN-05",
                "RN-05: Todo préstamo debe tener un usuario responsable registrado.",
                400);
        }

        if (usuarioId == Guid.Empty)
        {
            throw new ReglaNegocioException(
                "VAL-USUARIO",
                "Debe seleccionar un colaborador válido para el préstamo.",
                400);
        }

        if (equipoId == Guid.Empty)
        {
            throw new ReglaNegocioException(
                "VAL-EQUIPO",
                "Debe seleccionar un equipo tecnológico para el préstamo.",
                400);
        }

        if (fechaDevolucion <= fechaPrestamo)
        {
            throw new ReglaNegocioException(
                "RN-04",
                "RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo.",
                400);
        }

        return new Prestamo
        {
            Id = Guid.NewGuid(),
            EquipoId = equipoId,
            UsuarioId = usuarioId,
            ResponsableId = responsableId,
            FechaPrestamo = fechaPrestamo,
            FechaDevolucion = fechaDevolucion,
            Observacion = string.IsNullOrWhiteSpace(observacion)
                ? "Entrega de equipo en óptimas condiciones operativas."
                : observacion.Trim(),
            EstadoPrestamo = EstadosPrestamo.Activo,
            FechaRegistro = DateTime.UtcNow
        };
    }

    public void RegistrarDevolucion(string? observacionDevolucion, DateOnly? fechaDevolucionReal = null)
    {
        if (string.Equals(EstadoPrestamo, EstadosPrestamo.Devuelto, StringComparison.OrdinalIgnoreCase))
        {
            throw new ReglaNegocioException(
                "VAL-DEVOLUCION",
                "El préstamo ya se encuentra en estado 'Devuelto'.",
                409);
        }

        if (string.IsNullOrWhiteSpace(observacionDevolucion))
        {
            throw new ReglaNegocioException(
                "RN-10",
                "RN-10: Toda devolución deberá registrar observaciones.",
                400);
        }

        var fechaReal = fechaDevolucionReal ?? DateOnly.FromDateTime(DateTime.UtcNow);
        if (fechaReal < FechaPrestamo)
        {
            throw new ReglaNegocioException(
                "RN-04",
                "RN-04: La fecha de devolución no puede ser anterior a la fecha de préstamo.",
                400);
        }

        ObservacionDevolucion = observacionDevolucion.Trim();
        FechaDevolucionReal = fechaReal;
        EstadoPrestamo = EstadosPrestamo.Devuelto;
    }
}
