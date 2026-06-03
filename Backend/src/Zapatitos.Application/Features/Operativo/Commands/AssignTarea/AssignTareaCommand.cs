using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Operativo.Commands.AssignTarea;

public record AssignTareaCommand(long TareaId, long EmpleadoId) : IRequest<Result<bool>>;

public class AssignTareaCommandHandler : IRequestHandler<AssignTareaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AssignTareaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(AssignTareaCommand request, CancellationToken cancellationToken)
    {
        var tarea = await _unitOfWork.Repository<TareaOperativa>().GetByIdAsync(request.TareaId);
        if (tarea == null) return Result<bool>.Failure("Tarea no encontrada.");

        if (request.EmpleadoId <= 0)
        {
            tarea.AsignadoAId = null;
        }
        else
        {
            var empleado = await _unitOfWork.Repository<Empleado>().GetByIdAsync(request.EmpleadoId);
            if (empleado == null) return Result<bool>.Failure("Empleado no encontrado.");
            tarea.AsignadoAId = request.EmpleadoId;
        }

        _unitOfWork.Repository<TareaOperativa>().Update(tarea);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
