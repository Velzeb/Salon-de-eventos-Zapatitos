using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.EmpleadoPortal;

public record CompleteActividadEmpleadoCommand(long ActividadId, bool Completada) : IRequest<Result<bool>>;

public class CompleteActividadEmpleadoCommandHandler : IRequestHandler<CompleteActividadEmpleadoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public CompleteActividadEmpleadoCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(CompleteActividadEmpleadoCommand request, CancellationToken cancellationToken)
    {
        var actividad = await _unitOfWork.Repository<ActividadCronograma>().GetByIdAsync(request.ActividadId);
        if (actividad == null) return Result<bool>.Failure("Actividad no encontrada.");

        actividad.Completada = request.Completada;
        if (request.Completada)
        {
            actividad.HoraFinReal ??= DateTime.UtcNow;
        }
        else
        {
            actividad.HoraFinReal = null;
        }

        _unitOfWork.Repository<ActividadCronograma>().Update(actividad);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
