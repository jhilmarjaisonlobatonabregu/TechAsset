using Microsoft.EntityFrameworkCore;
using TechAsset.Domain.Entities;

namespace TechAsset.Infrastructure.Persistence;

public class TechAssetDbContext : DbContext
{
    public TechAssetDbContext(DbContextOptions<TechAssetDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<Prestamo> Prestamos => Set<Prestamo>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Nombres).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Apellidos).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Correo).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Area).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Estado).IsRequired();
            entity.Property(x => x.Rol).HasMaxLength(50).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(x => x.FechaRegistro).IsRequired();

            entity.Ignore(x => x.NombreCompleto);

            // RN-08: El correo electrónico del usuario debe ser único
            entity.HasIndex(x => x.Correo).IsUnique().HasDatabaseName("IX_Usuarios_Correo");
        });

        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.ToTable("equipos");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.CodigoPatrimonial).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Categoria).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Marca).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Estado).HasMaxLength(30).IsRequired();
            entity.Property(x => x.FechaRegistro).IsRequired();

            // RN-07: El código patrimonial del equipo debe ser único
            entity.HasIndex(x => x.CodigoPatrimonial).IsUnique().HasDatabaseName("IX_Equipos_CodigoPatrimonial");
        });

        modelBuilder.Entity<Prestamo>(entity =>
        {
            entity.ToTable("prestamos");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FechaPrestamo).IsRequired();
            entity.Property(x => x.FechaDevolucion).IsRequired();
            entity.Property(x => x.FechaDevolucionReal);
            entity.Property(x => x.Observacion).HasColumnType("text").IsRequired();
            entity.Property(x => x.ObservacionDevolucion).HasColumnType("text");
            entity.Property(x => x.EstadoPrestamo).HasMaxLength(30).IsRequired();
            entity.Property(x => x.FechaRegistro).IsRequired();

            entity.HasOne(x => x.Usuario)
                .WithMany(u => u.PrestamosRecibidos)
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Responsable)
                .WithMany(u => u.PrestamosGestionados)
                .HasForeignKey(x => x.ResponsableId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Equipo)
                .WithMany(e => e.Prestamos)
                .HasForeignKey(x => x.EquipoId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.EquipoId, x.EstadoPrestamo });
        });

        modelBuilder.Entity<MovimientoInventario>(entity =>
        {
            entity.ToTable("movimientos_inventario");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Fecha).IsRequired();
            entity.Property(x => x.TipoMovimiento).HasMaxLength(40).IsRequired();
            entity.Property(x => x.EstadoAnterior).HasMaxLength(30).IsRequired();
            entity.Property(x => x.EstadoNuevo).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Area).HasMaxLength(100);
            entity.Property(x => x.Observacion).HasColumnType("text").IsRequired();

            entity.HasOne(x => x.Equipo)
                .WithMany(e => e.Movimientos)
                .HasForeignKey(x => x.EquipoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Usuario)
                .WithMany()
                .HasForeignKey(x => x.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.Responsable)
                .WithMany()
                .HasForeignKey(x => x.ResponsableId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
