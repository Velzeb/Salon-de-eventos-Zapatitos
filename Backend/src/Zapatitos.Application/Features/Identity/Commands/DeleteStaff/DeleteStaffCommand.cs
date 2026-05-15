using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Identity.Commands.DeleteStaff;

public record DeleteStaffCommand(long EmpleadoId) : IRequest<Result<bool>>;

public class DeleteStaffCommandHandler : IRequestHandler<DeleteStaffCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteStaffCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(DeleteStaffCommand request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().GetByIdAsync(request.EmpleadoId);
        if (empleado == null) return Result<bool>.Failure("Empleado no encontrado.");

        var usuario = await _unitOfWork.Repository<Usuario>().GetByIdAsync(empleado.UsuarioId);
        
        _unitOfWork.Repository<Empleado>().Delete(empleado);
        if (usuario != null)
        {
            _unitOfWork.Repository<Usuario>().Delete(usuario);
        }
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}