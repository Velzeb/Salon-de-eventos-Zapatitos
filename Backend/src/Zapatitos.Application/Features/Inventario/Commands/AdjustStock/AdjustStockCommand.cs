using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Inventario.Commands.AdjustStock;

public record AdjustStockCommand(long ArticuloId, int Delta) : IRequest<Result<long>>;

public class AdjustStockCommandHandler : IRequestHandler<AdjustStockCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AdjustStockCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AdjustStockCommand request, CancellationToken cancellationToken)
    {
        var articulo = await _unitOfWork.Repository<ArticuloInventario>().GetByIdAsync(request.ArticuloId);
        if (articulo == null) return Result<long>.Failure("El articulo no existe.");

        if (!articulo.ControlarStock)
        {
            return Result<long>.Failure("Este articulo tiene stock infinito y no requiere ajustes.");
        }

        var nuevoStock = articulo.StockActual + request.Delta;
        if (nuevoStock < 0)
        {
            return Result<long>.Failure("El ajuste no puede dejar el stock en negativo.");
        }

        articulo.StockActual = nuevoStock;
        _unitOfWork.Repository<ArticuloInventario>().Update(articulo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(articulo.Id);
    }
}
