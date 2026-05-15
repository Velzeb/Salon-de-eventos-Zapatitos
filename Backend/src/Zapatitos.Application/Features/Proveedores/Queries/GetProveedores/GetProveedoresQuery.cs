using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Proveedores.Queries.GetProveedores;

public record ProveedorDto(long Id, string Nombre, string? ContactoNombre, string? Telefono, string? Email, int Tipo);

public record GetProveedoresQuery : IRequest<Result<IEnumerable<ProveedorDto>>>;

public class GetProveedoresQueryHandler : IRequestHandler<GetProveedoresQuery, Result<IEnumerable<ProveedorDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetProveedoresQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<ProveedorDto>>> Handle(GetProveedoresQuery request, CancellationToken cancellationToken)
    {
        var proveedoresList = await _unitOfWork.Repository<Proveedor>().Query()
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);

        var proveedoresDto = proveedoresList.Select(p => new ProveedorDto(
            p.Id, 
            p.Nombre, 
            p.ContactoNombre, 
            p.Telefono, 
            p.Email, 
            (int)p.Tipo
        ));

        return Result<IEnumerable<ProveedorDto>>.Success(proveedoresDto);
    }
}
