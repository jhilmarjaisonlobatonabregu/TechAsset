using FluentValidation;
using TechAsset.Application.DTOs;
using TechAsset.Domain.Constants;

namespace TechAsset.Application.Validators;

public class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    public CrearUsuarioValidator()
    {
        RuleFor(x => x.Nombres)
            .NotEmpty().WithMessage("El nombre del colaborador es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres.");

        RuleFor(x => x.Apellidos)
            .NotEmpty().WithMessage("Los apellidos del colaborador son obligatorios.")
            .MaximumLength(100).WithMessage("Los apellidos no pueden exceder 100 caracteres.");

        RuleFor(x => x.Correo)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .MaximumLength(150).WithMessage("El correo no puede exceder 150 caracteres.")
            .EmailAddress().WithMessage("El formato del correo electrónico no es válido.");

        RuleFor(x => x.Area)
            .NotEmpty().WithMessage("El área o departamento es obligatorio.")
            .MaximumLength(100).WithMessage("El área no puede exceder 100 caracteres.");

        RuleFor(x => x.Rol)
            .NotEmpty().WithMessage("El rol del usuario es obligatorio.")
            .Must(rol => Roles.Todos.Contains(rol.Trim()))
            .WithMessage($"El rol debe ser uno de: {string.Join(", ", Roles.Todos)}.");
    }
}

public class ActualizarUsuarioValidator : AbstractValidator<ActualizarUsuarioDto>
{
    public ActualizarUsuarioValidator()
    {
        RuleFor(x => x.Nombres)
            .NotEmpty().WithMessage("El nombre del colaborador es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres.");

        RuleFor(x => x.Apellidos)
            .NotEmpty().WithMessage("Los apellidos del colaborador son obligatorios.")
            .MaximumLength(100).WithMessage("Los apellidos no pueden exceder 100 caracteres.");

        RuleFor(x => x.Correo)
            .NotEmpty().WithMessage("El correo electrónico es obligatorio.")
            .MaximumLength(150).WithMessage("El correo no puede exceder 150 caracteres.")
            .EmailAddress().WithMessage("El formato del correo electrónico no es válido.");

        RuleFor(x => x.Area)
            .NotEmpty().WithMessage("El área o departamento es obligatorio.")
            .MaximumLength(100).WithMessage("El área no puede exceder 100 caracteres.");

        RuleFor(x => x.Rol)
            .NotEmpty().WithMessage("El rol del usuario es obligatorio.")
            .Must(rol => Roles.Todos.Contains(rol.Trim()))
            .WithMessage($"El rol debe ser uno de: {string.Join(", ", Roles.Todos)}.");
    }
}

public class CrearEquipoValidator : AbstractValidator<CrearEquipoDto>
{
    public CrearEquipoValidator()
    {
        RuleFor(x => x.CodigoPatrimonial)
            .NotEmpty().WithMessage("El código patrimonial es obligatorio.")
            .MaximumLength(50).WithMessage("El código patrimonial no puede exceder 50 caracteres.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del equipo es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del equipo no puede exceder 100 caracteres.");

        RuleFor(x => x.Categoria)
            .NotEmpty().WithMessage("La categoría del equipo es obligatoria.")
            .MaximumLength(50).WithMessage("La categoría no puede exceder 50 caracteres.")
            .Must(cat => CategoriasEquipo.Todas.Contains(cat.Trim()))
            .WithMessage($"La categoría debe ser una de: {string.Join(", ", CategoriasEquipo.Todas)}.");

        RuleFor(x => x.Marca)
            .NotEmpty().WithMessage("La marca del equipo es obligatoria.")
            .MaximumLength(50).WithMessage("La marca no puede exceder 50 caracteres.");
    }
}

public class ActualizarEquipoValidator : AbstractValidator<ActualizarEquipoDto>
{
    public ActualizarEquipoValidator()
    {
        RuleFor(x => x.CodigoPatrimonial)
            .NotEmpty().WithMessage("El código patrimonial es obligatorio.")
            .MaximumLength(50).WithMessage("El código patrimonial no puede exceder 50 caracteres.");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del equipo es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre del equipo no puede exceder 100 caracteres.");

        RuleFor(x => x.Categoria)
            .NotEmpty().WithMessage("La categoría del equipo es obligatoria.")
            .MaximumLength(50).WithMessage("La categoría no puede exceder 50 caracteres.")
            .Must(cat => CategoriasEquipo.Todas.Contains(cat.Trim()))
            .WithMessage($"La categoría debe ser una de: {string.Join(", ", CategoriasEquipo.Todas)}.");

        RuleFor(x => x.Marca)
            .NotEmpty().WithMessage("La marca del equipo es obligatoria.")
            .MaximumLength(50).WithMessage("La marca no puede exceder 50 caracteres.");

        RuleFor(x => x.Estado)
            .NotEmpty().WithMessage("El estado del equipo es obligatorio.")
            .Must(est => EstadosEquipo.Todos.Contains(est.Trim()))
            .WithMessage($"El estado debe ser uno de: {string.Join(", ", EstadosEquipo.Todos)}.");
    }
}

public class CrearPrestamoValidator : AbstractValidator<CrearPrestamoDto>
{
    public CrearPrestamoValidator()
    {
        RuleFor(x => x.EquipoId)
            .NotEmpty().WithMessage("Debe seleccionar un equipo tecnológico.");

        RuleFor(x => x.UsuarioId)
            .NotEmpty().WithMessage("Debe seleccionar un colaborador receptor.");

        RuleFor(x => x.ResponsableId)
            .Must(r => r is null || r != Guid.Empty)
            .WithMessage("RN-05: Todo préstamo debe tener un usuario responsable registrado.");

        RuleFor(x => x.FechaDevolucion)
            .GreaterThan(x => x.FechaPrestamo)
            .WithMessage("RN-04: La fecha de devolución debe ser posterior a la fecha de préstamo.");
    }
}

public class RegistrarDevolucionValidator : AbstractValidator<RegistrarDevolucionDto>
{
    public RegistrarDevolucionValidator()
    {
        RuleFor(x => x.Observacion)
            .NotEmpty().WithMessage("RN-10: Toda devolución deberá registrar observaciones.");
    }
}
