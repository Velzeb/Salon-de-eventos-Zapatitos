using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace Zapatitos.Application.Features.Eventos.Commands.UpdateEstadoEvento;

public record UpdateEstadoEventoCommand(long EventoId, string NuevoEstado) : IRequest<Result<bool>>;

public class UpdateEstadoEventoCommandHandler : IRequestHandler<UpdateEstadoEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly Common.Services.IEventoService _eventoService;
    private readonly IMediator _mediator;

    public UpdateEstadoEventoCommandHandler(IUnitOfWork unitOfWork, Common.Services.IEventoService eventoService, IMediator mediator)
    {
        _unitOfWork = unitOfWork;
        _eventoService = eventoService;
        _mediator = mediator;
    }

    public async Task<Result<bool>> Handle(UpdateEstadoEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<bool>.Failure("Evento no encontrado.");

        if (!Enum.TryParse<EstadoEvento>(request.NuevoEstado, ignoreCase: true, out var nuevoEstado))
            return Result<bool>.Failure($"Estado '{request.NuevoEstado}' no es válido.");

        // === MÁQUINA DE ESTADOS ===
        var transicionesValidas = new Dictionary<EstadoEvento, EstadoEvento[]>
        {
            [EstadoEvento.Provisional] = new[] { EstadoEvento.Confirmado, EstadoEvento.Cancelado },
            [EstadoEvento.Confirmado]  = new[] { EstadoEvento.EnCurso, EstadoEvento.Provisional, EstadoEvento.Cancelado },
            [EstadoEvento.EnCurso]     = new[] { EstadoEvento.Finalizado, EstadoEvento.Confirmado, EstadoEvento.Cancelado },
            [EstadoEvento.Finalizado]  = new[] { EstadoEvento.Terminado, EstadoEvento.EnCurso }
        };

        if (!transicionesValidas.TryGetValue(evento.Estado, out var permitidos) || !permitidos.Contains(nuevoEstado))
        {
            return Result<bool>.Failure(
                $"Transición no válida: no se puede pasar de '{evento.Estado}' a '{nuevoEstado}'. " +
                $"Transiciones permitidas: {string.Join(", ", permitidos ?? Array.Empty<EstadoEvento>())}."
            );
        }

        // Regla de Negocio Crítica: No se puede terminar una fiesta si hay deuda
        if (nuevoEstado == EstadoEvento.Terminado && evento.SaldoPendiente > 0)
        {
            return Result<bool>.Failure($"No se puede dar por Terminado el evento. Aún existe un saldo pendiente de ${evento.SaldoPendiente}.");
        }

        if (nuevoEstado == EstadoEvento.Confirmado)
        {
            // Primera confirmación: crear invitación digital si no existe.
            // NO regenerar tareas (ya se crearon al crear el evento si vino del admin,
            // o se crean en este punto si venía de Provisional).
            await _eventoService.ConfirmarEventoAsync(evento.Id, cancellationToken);

            // Solo regenerar tareas si el evento REGRESÓ de EnCurso/Finalizado
            // (identificado porque el estado actual del evento antes de cambiar era ≥ EnCurso)
            if (evento.Estado >= EstadoEvento.EnCurso)
            {
                await _mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica.GenerarTareasLogisticaCommand(request.EventoId), cancellationToken);
            }
        }
        else if (nuevoEstado == EstadoEvento.EnCurso)
        {
            // Al iniciar la fiesta: actualizar estado y regenerar tareas de Entrega
            evento.Estado = nuevoEstado;
            _unitOfWork.Repository<Evento>().Update(evento);
            await _mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica.GenerarTareasLogisticaCommand(request.EventoId), cancellationToken);
        }
        else
        {
            // Resto de transiciones: solo cambiar estado
            evento.Estado = nuevoEstado;
            _unitOfWork.Repository<Evento>().Update(evento);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
