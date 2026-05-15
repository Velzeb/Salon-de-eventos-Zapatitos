using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.UpdatePostEvento;

public record UpdatePostEventoCommand : IRequest<Result<bool>>
{
    public long EventoId { get; init; }
    public string? LinkGaleriaFotos { get; init; }
    public bool ConsentimientoMarketing { get; init; }
    public DateTime? FechaProximoContacto { get; init; }
    public bool CerrarDefinitivamente { get; init; }
}

public class UpdatePostEventoCommandHandler : IRequestHandler<UpdatePostEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdatePostEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdatePostEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        
        if (evento == null) return Result<bool>.Failure("El evento no existe.");
        
        evento.LinkGaleriaFotos = request.LinkGaleriaFotos;
        evento.ConsentimientoMarketing = request.ConsentimientoMarketing;
        evento.FechaProximoContacto = request.FechaProximoContacto;
        
        if (!string.IsNullOrEmpty(request.LinkGaleriaFotos) && !evento.FechaEntregaFotos.HasValue)
        {
            evento.FechaEntregaFotos = DateTime.UtcNow;
        }

        if (request.CerrarDefinitivamente)
        {
            evento.Estado = EstadoEvento.Completado;
        }

        _unitOfWork.Repository<Evento>().Update(evento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
