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

    public UpdateEstadoEventoCommandHandler(IUnitOfWork unitOfWork, Common.Services.IEventoService eventoService)
    {
        _unitOfWork = unitOfWork;
        _eventoService = eventoService;
    }

    public async Task<Result<bool>> Handle(UpdateEstadoEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<bool>.Failure("Evento no encontrado.");

        if (!Enum.TryParse<EstadoEvento>(request.NuevoEstado, ignoreCase: true, out var nuevoEstado))
            return Result<bool>.Failure($"Estado '{request.NuevoEstado}' no es válido.");

        if (nuevoEstado == EstadoEvento.Confirmado)
        {
            await _eventoService.ConfirmarEventoAsync(evento.Id, cancellationToken);
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
