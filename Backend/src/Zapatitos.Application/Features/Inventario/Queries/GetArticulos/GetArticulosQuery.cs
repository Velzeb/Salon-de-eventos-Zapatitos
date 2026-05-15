using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;

namespace Zapatitos.Application.Features.Inventario.Queries.GetArticulos;

public record ArticuloDto(
    long Id, 
    string Nombre, 
    string? Descripcion, 
    int StockActual, 
    int StockMinimo, 
    bool ControlarStock, 
    string? UnidadMedida, 
    decimal PrecioCosto,
    string? ProveedorNombre,
    long? ProveedorId
);

public record GetArticulosQuery : IRequest<List<ArticuloDto>>;

public class GetArticulosQueryHandler : IRequestHandler<GetArticulosQuery, List<ArticuloDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetArticulosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ArticuloDto>> Handle(GetArticulosQuery request, CancellationToken cancellationToken)
    {
        var articulos = await _unitOfWork.Repository<Zapatitos.Domain.Entities.ArticuloInventario>()
            .Query()
            .Include(a => a.Proveedor)
            .Select(a => new ArticuloDto(
                a.Id,
                a.Nombre,
                a.Descripcion,
                a.StockActual,
                a.StockMinimo,
                a.ControlarStock,
                a.UnidadMedida,
                a.PrecioCosto,
                a.Proveedor != null ? a.Proveedor.Nombre : null,
                a.ProveedorId
            ))
            .ToListAsync(cancellationToken);

        return articulos;
    }
}
