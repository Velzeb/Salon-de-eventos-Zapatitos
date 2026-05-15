using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.DeleteMultimedia;

public record DeleteMultimediaCommand(long MultimediaId) : IRequest<Result<bool>>;

public class DeleteMultimediaCommandHandler : IRequestHandler<DeleteMultimediaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteMultimediaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeleteMultimediaCommand request, CancellationToken cancellationToken)
    {
        var multimedia = await _unitOfWork.Repository<MultimediaEvento>().GetByIdAsync(request.MultimediaId);
        if (multimedia == null) return Result<bool>.Failure("Multimedia no encontrado.");

        multimedia.EliminadoEn = DateTime.UtcNow;
        _unitOfWork.Repository<MultimediaEvento>().Update(multimedia);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
