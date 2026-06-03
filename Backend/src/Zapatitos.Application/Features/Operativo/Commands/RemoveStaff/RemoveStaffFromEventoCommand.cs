using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Operativo.Commands.RemoveStaff;

public record RemoveStaffFromEventoCommand(long AsignacionId) : IRequest<Result<long>>;

public class RemoveStaffFromEventoCommandHandler : IRequestHandler<RemoveStaffFromEventoCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RemoveStaffFromEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(RemoveStaffFromEventoCommand request, CancellationToken cancellationToken)
    {
        var asignacion = await _unitOfWork.Repository<AsignacionStaff>().GetByIdAsync(request.AsignacionId);
        if (asignacion == null) 
            return Result<long>.Failure("Asignación de personal no encontrada.");

        if (asignacion.EsPagado)
            return Result<long>.Failure("No se puede desasignar un empleado que ya recibió su pago.");

        _unitOfWork.Repository<AsignacionStaff>().Delete(asignacion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(request.AsignacionId);
    }
}
