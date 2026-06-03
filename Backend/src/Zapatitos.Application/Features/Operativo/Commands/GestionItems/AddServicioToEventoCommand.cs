using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionItems;

public record AddServicioToEventoCommand(long EventoId, long ServicioId, int Cantidad) : IRequest<Result<long>>;

public class AddServicioToEventoCommandHandler : IRequestHandler<AddServicioToEventoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMediator _mediator;

    public AddServicioToEventoCommandHandler(IUnitOfWork unitOfWork, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _mediator = mediator;
    }

    public async Task<Result<long>> Handle(AddServicioToEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null)
            return Result<long>.Failure("El evento no existe.");

        if (evento.Estado == EstadoEvento.Terminado || evento.Estado == EstadoEvento.Cancelado)
            return Result<long>.Failure("No se pueden modificar los servicios de un evento terminado o cancelado.");

        var servicio = await _unitOfWork.Repository<Servicio>()
            .GetByIdAsync(request.ServicioId);

        if (servicio == null || servicio.Estado != EstadoGeneral.Activo)
            return Result<long>.Failure("El servicio no existe o no está activo.");

        var itemExistente = await _unitOfWork.Repository<EventoItem>()
            .Query()
            .FirstOrDefaultAsync(i => i.EventoId == request.EventoId && i.ServicioId == request.ServicioId && !i.EsIncluidoEnPaquete, cancellationToken);

        long itemId;
        decimal costoTotalAdicional = servicio.CostoBase * request.Cantidad;

        if (itemExistente != null)
        {
            itemExistente.Cantidad += request.Cantidad;
            itemId = itemExistente.Id;
            _unitOfWork.Repository<EventoItem>().Update(itemExistente);
        }
        else
        {
            var nuevoItem = new EventoItem
            {
                EventoId = request.EventoId,
                ServicioId = request.ServicioId,
                Nombre = servicio.Nombre,
                Cantidad = request.Cantidad,
                PrecioUnitario = servicio.CostoBase,
                EsIncluidoEnPaquete = false
            };
            await _unitOfWork.Repository<EventoItem>().AddAsync(nuevoItem);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            itemId = nuevoItem.Id;
        }

        evento.PrecioTotal += costoTotalAdicional;
        evento.SaldoPendiente += costoTotalAdicional;
        _unitOfWork.Repository<Evento>().Update(evento);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Regenerar tareas de logística
        await _mediator.Send(new GenerarTareasLogistica.GenerarTareasLogisticaCommand(request.EventoId), cancellationToken);

        return Result<long>.Success(itemId);
    }
}
