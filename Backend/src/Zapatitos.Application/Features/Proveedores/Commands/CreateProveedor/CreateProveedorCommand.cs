using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Proveedores.Commands.CreateProveedor;

public record CreateProveedorCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string? ContactoNombre { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public string? Direccion { get; init; }
    public int Tipo { get; init; }
}

public class CreateProveedorCommandHandler : IRequestHandler<CreateProveedorCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateProveedorCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateProveedorCommand request, CancellationToken cancellationToken)
    {
        var proveedor = new Proveedor
        {
            Nombre = request.Nombre,
            ContactoNombre = request.ContactoNombre,
            Telefono = request.Telefono,
            Email = request.Email,
            Direccion = request.Direccion,
            Tipo = (Zapatitos.Domain.Enums.TipoProveedor)request.Tipo
        };

        await _unitOfWork.Repository<Proveedor>().AddAsync(proveedor);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(proveedor.Id);
    }
}
