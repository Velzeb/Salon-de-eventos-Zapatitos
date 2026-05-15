using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Inventario.Commands.DeleteArticulo;

public record DeleteArticuloCommand(long Id) : IRequest<Result<Unit>>;

public class DeleteArticuloCommandHandler : IRequestHandler<DeleteArticuloCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteArticuloCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteArticuloCommand request, CancellationToken cancellationToken)
    {
        var repository = _unitOfWork.Repository<Zapatitos.Domain.Entities.ArticuloInventario>();
        var entity = await repository.Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El artículo no existe." });

        // Check if it's used in packages
        var isUsed = await _unitOfWork.Repository<Zapatitos.Domain.Entities.PaqueteArticulo>()
            .Query()
            .AnyAsync(x => x.ArticuloId == request.Id, cancellationToken);

        if (isUsed)
            return Result<Unit>.Failure(new[] { "No se puede eliminar el artículo porque está vinculado a uno o más paquetes." });

        repository.Delete(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
