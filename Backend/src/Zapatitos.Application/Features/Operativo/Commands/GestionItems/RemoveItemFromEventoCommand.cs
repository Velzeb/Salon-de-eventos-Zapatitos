using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionItems;

public record RemoveItemFromEventoCommand(long EventoId, long ItemId) : IRequest<Result<bool>>;

public class RemoveItemFromEventoCommandHandler : IRequestHandler<RemoveItemFromEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public RemoveItemFromEventoCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task<Result<bool>> Handle(RemoveItemFromEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null)
            return Result<bool>.Failure("El evento no existe.");

        if (evento.Estado == EstadoEvento.Terminado || evento.Estado == EstadoEvento.Cancelado)
            return Result<bool>.Failure("No se pueden modificar los servicios de un evento terminado o cancelado.");

        var item = await _unitOfWork.Repository<EventoItem>()
            .Query()
            .FirstOrDefaultAsync(i => i.Id == request.ItemId && i.EventoId == request.EventoId, cancellationToken);

        if (item == null)
            return Result<bool>.Failure("El servicio o artículo no pertenece a este evento.");

        decimal costoADeducir = item.PrecioUnitario * item.Cantidad;

        _unitOfWork.Repository<EventoItem>().Delete(item);

        evento.PrecioTotal -= costoADeducir;
        evento.SaldoPendiente -= costoADeducir;
        _unitOfWork.Repository<Evento>().Update(evento);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Regenerar tareas de logística
        await _mediator.Send(new GenerarTareasLogistica.GenerarTareasLogisticaCommand(request.EventoId), cancellationToken);

        return Result<bool>.Success(true);
    }
}
