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
            [EstadoEvento.Confirmado] = new[] { EstadoEvento.EnCurso, EstadoEvento.Cancelado },
            [EstadoEvento.EnCurso] = new[] { EstadoEvento.Finalizado, EstadoEvento.Cancelado },
            [EstadoEvento.Finalizado] = new[] { EstadoEvento.Terminado }
        };

        if (!transicionesValidas.TryGetValue(evento.Estado, out var permitidos) || !permitidos.Contains(nuevoEstado))
        {
            return Result<bool>.Failure(
                $"Transición no válida: no se puede pasar de '{evento.Estado}' a '{nuevoEstado}'. " +
                $"Transiciones permitidas: {string.Join(", ", permitidos ?? Array.Empty<EstadoEvento>())}."
            );
        }

        if (nuevoEstado == EstadoEvento.Confirmado)
        {
            await _eventoService.ConfirmarEventoAsync(evento.Id, cancellationToken);
            await _mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GenerarTareasLogistica.GenerarTareasLogisticaCommand(request.EventoId));
        }
        else
        {
            evento.Estado = nuevoEstado;
            _unitOfWork.Repository<Evento>().Update(evento);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
