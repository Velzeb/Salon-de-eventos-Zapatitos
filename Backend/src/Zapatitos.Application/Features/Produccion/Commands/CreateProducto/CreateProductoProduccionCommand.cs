using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Produccion.Commands.CreateProducto;

public record IngredienteCommand
{
    public long ArticuloInventarioId { get; init; }
    public decimal CantidadRequerida { get; init; }
    public string? UnidadMedida { get; init; }
}

public record CreateProductoProduccionCommand : IRequest<Result<long>>
{
    public string Nombre { get; init; } = null!;
    public string? Descripcion { get; init; }
    public int CantidadProducida { get; init; } = 1;
    public string? UnidadMedida { get; init; }
    public List<IngredienteCommand> Ingredientes { get; init; } = new();
}

public class CreateProductoProduccionCommandHandler : IRequestHandler<CreateProductoProduccionCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateProductoProduccionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateProductoProduccionCommand request, CancellationToken cancellationToken)
    {
        var producto = new ProductoProduccion
        {
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            CantidadProducida = request.CantidadProducida,
            UnidadMedida = request.UnidadMedida,
            Ingredientes = request.Ingredientes.Select(i => new RecetaIngrediente
            {
                ArticuloInventarioId = i.ArticuloInventarioId,
                CantidadRequerida = i.CantidadRequerida,
                UnidadMedida = i.UnidadMedida
            }).ToList()
        };

        await _unitOfWork.Repository<ProductoProduccion>().AddAsync(producto);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(producto.Id);
    }
}
