using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Produccion.Commands.DeleteProducto;

public record DeleteProductoProduccionCommand(long Id) : IRequest<Result<Unit>>;

public class DeleteProductoProduccionCommandHandler : IRequestHandler<DeleteProductoProduccionCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProductoProduccionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteProductoProduccionCommand request, CancellationToken cancellationToken)
    {
        var producto = await _unitOfWork.Repository<ProductoProduccion>()
            .Query()
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (producto == null)
            return Result<Unit>.Failure(new[] { "El producto de producción no existe." });

        _unitOfWork.Repository<ProductoProduccion>().Delete(producto);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
