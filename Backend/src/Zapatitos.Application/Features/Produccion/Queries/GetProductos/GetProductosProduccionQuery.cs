using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Produccion.Queries.GetProductos;

public record IngredienteDto(
    long Id,
    long ArticuloInventarioId,
    string ArticuloNombre,
    decimal CantidadRequerida,
    string? UnidadMedida
);

public record ProductoProduccionDto(
    long Id,
    string Nombre,
    string? Descripcion,
    int CantidadProducida,
    string? UnidadMedida,
    string Estado,
    List<IngredienteDto> Ingredientes
);

public record GetProductosProduccionQuery : IRequest<Result<IEnumerable<ProductoProduccionDto>>>;

public class GetProductosProduccionQueryHandler : IRequestHandler<GetProductosProduccionQuery, Result<IEnumerable<ProductoProduccionDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetProductosProduccionQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<ProductoProduccionDto>>> Handle(GetProductosProduccionQuery request, CancellationToken cancellationToken)
    {
        var productos = await _unitOfWork.Repository<ProductoProduccion>()
            .Query()
            .Include(p => p.Ingredientes)
                .ThenInclude(i => i.Articulo)
            .OrderBy(p => p.Nombre)
            .ToListAsync(cancellationToken);

        var dtos = productos.Select(p => new ProductoProduccionDto(
            p.Id,
            p.Nombre,
            p.Descripcion,
            p.CantidadProducida,
            p.UnidadMedida,
            p.Estado.ToString(),
            p.Ingredientes.Select(i => new IngredienteDto(
                i.Id,
                i.ArticuloInventarioId,
                i.Articulo?.Nombre ?? "Desconocido",
                i.CantidadRequerida,
                i.UnidadMedida
            )).ToList()
        ));

        return Result<IEnumerable<ProductoProduccionDto>>.Success(dtos);
    }
}
