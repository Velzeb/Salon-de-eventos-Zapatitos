using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using System.Linq;

namespace Zapatitos.Application.Features.Operativo.Commands.FinalizarEvento;

public record FinalizarEventoCommand(long EventoId) : IRequest<Result<bool>>;

public class FinalizarEventoCommandHandler : IRequestHandler<FinalizarEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public FinalizarEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(FinalizarEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        
        if (evento == null) return Result<bool>.Failure("El evento no existe.");
        
        // Regla: No se puede cerrar si hay saldo pendiente (opcional, pero profesional)
        // En este caso permitiremos cerrarlo pero avisando en el front si hay saldo.
        
        evento.Estado = EstadoEvento.Finalizado;
        
        // Auditoría final: Marcar todas las tareas como completadas si no lo estaban? 
        // O mejor dejar que el admin las revise.
        
        _unitOfWork.Repository<Evento>().Update(evento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
