using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionTareas;

public record DeleteTareaCommand(long TareaId) : IRequest<Result<bool>>;

public class DeleteTareaHandler : IRequestHandler<DeleteTareaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteTareaHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeleteTareaCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _unitOfWork.Repository<TareaOperativa>().GetByIdAsync(request.TareaId);
        if (tarea == null) return Result<bool>.Failure("Tarea no encontrada.");

        _unitOfWork.Repository<TareaOperativa>().Delete(tarea);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
