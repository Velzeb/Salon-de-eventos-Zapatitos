using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionTareas;

public record UpdateTareaCommand(
    long TareaId,
    string NombreTarea,
    string? Descripcion,
    long? ArticuloInventarioId,
    int CantidadRequerida
) : IRequest<Result<bool>>;

public class UpdateTareaHandler : IRequestHandler<UpdateTareaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateTareaHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdateTareaCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _unitOfWork.Repository<TareaOperativa>().GetByIdAsync(request.TareaId);
        if (tarea == null) return Result<bool>.Failure("Tarea no encontrada.");

        tarea.NombreTarea = request.NombreTarea;
        tarea.Descripcion = request.Descripcion;
        tarea.ArticuloInventarioId = request.ArticuloInventarioId;
        tarea.CantidadRequerida = request.CantidadRequerida;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
