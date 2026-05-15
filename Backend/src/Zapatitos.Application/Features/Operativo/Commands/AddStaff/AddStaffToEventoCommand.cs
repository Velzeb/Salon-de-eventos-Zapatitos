using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Zapatitos.Application.Features.Operativo.Commands.AddStaff;

public record AddStaffToEventoCommand(long EventoId, long EmpleadoId, string Rol) : IRequest<Result<long>>;

public class AddStaffToEventoCommandHandler : IRequestHandler<AddStaffToEventoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddStaffToEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddStaffToEventoCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<long>.Failure("Evento no encontrado.");

        var empleado = await _unitOfWork.Repository<Empleado>().GetByIdAsync(request.EmpleadoId);
        if (empleado == null) return Result<long>.Failure("Empleado no encontrado.");

        var asignacion = new AsignacionStaff
        {
            EventoId = request.EventoId,
            EmpleadoId = request.EmpleadoId,
            RolEnEvento = request.Rol,
            EsPagado = false
        };

        await _unitOfWork.Repository<AsignacionStaff>().AddAsync(asignacion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(asignacion.Id);
    }
}
