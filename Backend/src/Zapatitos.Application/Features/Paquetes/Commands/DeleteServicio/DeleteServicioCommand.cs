using MediatR;
using Zapatitos.Application.Common.Models;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Paquetes.Commands.DeleteServicio;

public record DeleteServicioCommand(long Id) : IRequest<Result<Unit>>;

public class DeleteServicioCommandHandler : IRequestHandler<DeleteServicioCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteServicioCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteServicioCommand request, CancellationToken cancellationToken)
    {
        var repository = _unitOfWork.Repository<Servicio>();
        var entity = await repository.Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            return Result<Unit>.Failure(new[] { "El servicio no existe." });

        // Check if it's used in packages
        var isUsed = await _unitOfWork.Repository<Paquete>()
            .Query()
            .AnyAsync(x => x.Servicios.Any(s => s.Id == request.Id), cancellationToken);

        if (isUsed)
            return Result<Unit>.Failure(new[] { "No se puede eliminar el servicio porque está vinculado a uno o más paquetes." });

        repository.Delete(entity);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
