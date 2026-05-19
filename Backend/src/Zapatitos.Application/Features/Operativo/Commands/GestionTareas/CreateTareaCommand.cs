using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionTareas;

public record CreateTareaCommand(
    long EventoId,
    string NombreTarea,
    string? Descripcion,
    long? ArticuloInventarioId,
    int CantidadRequerida
) : IRequest<Result<long>>;

public class CreateTareaHandler : IRequestHandler<CreateTareaCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateTareaHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(CreateTareaCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<long>.Failure("Evento no encontrado.");

        var tarea = new TareaOperativa
        {
            EventoId = request.EventoId,
            NombreTarea = request.NombreTarea,
            Descripcion = request.Descripcion,
            ArticuloInventarioId = request.ArticuloInventarioId,
            CantidadRequerida = request.CantidadRequerida,
            TipoTarea = request.ArticuloInventarioId.HasValue ? TipoTareaOperativa.Inventario : TipoTareaOperativa.Manual,
            Estado = EstadoTarea.Pendiente
        };

        await _unitOfWork.Repository<TareaOperativa>().AddAsync(tarea);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(tarea.Id);
    }
}
