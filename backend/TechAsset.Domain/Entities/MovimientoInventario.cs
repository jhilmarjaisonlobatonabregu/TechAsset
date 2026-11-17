namespace TechAsset.Domain.Entities;

public class MovimientoInventario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string TipoMovimiento { get; set; } = string.Empty;

    public Guid EquipoId { get; set; }
    public Equipo? Equipo { get; set; }

    public string EstadoAnterior { get; set; } = string.Empty;
    public string EstadoNuevo { get; set; } = string.Empty;

    public Guid? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public Guid? ResponsableId { get; set; }
    public Usuario? Responsable { get; set; }

    public string Area { get; set; } = string.Empty;
    public string Observacion { get; set; } = string.Empty;
}
