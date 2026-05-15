using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Identity.Commands.UpdateStaff;

public record UpdateStaffCommand : IRequest<Result<bool>>
{
    public long EmpleadoId { get; init; }
    public string NombreCompleto { get; init; } = null!;
    public string? Puesto { get; init; }
    public string Rol { get; init; } = null!; // "Administrador" o "Empleado"
    public bool Activo { get; init; }
}

public class UpdateStaffCommandHandler : IRequestHandler<UpdateStaffCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateStaffCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdateStaffCommand request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().GetByIdAsync(request.EmpleadoId);
        if (empleado == null) return Result<bool>.Failure("Empleado no encontrado.");

        var usuario = await _unitOfWork.Repository<Usuario>().GetByIdAsync(empleado.UsuarioId);
        if (usuario == null) return Result<bool>.Failure("Usuario no encontrado.");

        // Actualizar datos de empleado
        empleado.NombreCompleto = request.NombreCompleto;
        empleado.Puesto = request.Puesto;

        // Actualizar estado del usuario
        usuario.Activo = request.Activo;

        // Actualizar rol si cambió
        var rol = (await _unitOfWork.Repository<Rol>().FindAsync(r => r.Nombre == request.Rol)).FirstOrDefault();
        if (rol == null) return Result<bool>.Failure($"El rol '{request.Rol}' no es válido.");

        // Para simplificar, limpiamos los roles y asignamos el nuevo, asumiendo que Identity lo permite o lo hacemos manualmente
        // Nota: En la entidad Usuario parece ser un ICollection<Rol>
        var currentRoles = usuario.Roles.ToList();
        foreach (var r in currentRoles)
        {
            usuario.Roles.Remove(r);
        }
        usuario.Roles.Add(rol);

        _unitOfWork.Repository<Empleado>().Update(empleado);
        _unitOfWork.Repository<Usuario>().Update(usuario);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}