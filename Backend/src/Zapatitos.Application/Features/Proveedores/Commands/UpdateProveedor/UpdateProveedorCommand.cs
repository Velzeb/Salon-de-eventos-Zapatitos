using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Proveedores.Commands.UpdateProveedor;

public record UpdateProveedorCommand : IRequest<Result<Unit>>
{
    public long Id { get; init; }
    public string Nombre { get; init; } = null!;
    public string? ContactoNombre { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public string? Direccion { get; init; }
    public int Tipo { get; init; }
}

public class UpdateProveedorCommandHandler : IRequestHandler<UpdateProveedorCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateProveedorCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(UpdateProveedorCommand request, CancellationToken cancellationToken)
    {
        var entity = await _unitOfWork.Repository<Zapatitos.Domain.Entities.Proveedor>()
            .Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El proveedor no existe." });

        entity.Nombre = request.Nombre;
        entity.ContactoNombre = request.ContactoNombre;
        entity.Telefono = request.Telefono;
        entity.Email = request.Email;
        entity.Direccion = request.Direccion;
        entity.Tipo = (Zapatitos.Domain.Enums.TipoProveedor)request.Tipo;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
