using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.UpdateNotasAdmin;

public record UpdateNotasAdminCommand(long EventoId, string Notas) : IRequest<Result<bool>>;

public class UpdateNotasAdminCommandHandler : IRequestHandler<UpdateNotasAdminCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateNotasAdminCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdateNotasAdminCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);

        if (evento == null)
        {
            return Result<bool>.Failure("El evento no existe.");
        }

        evento.NotasAdmin = request.Notas;
        _unitOfWork.Repository<Evento>().Update(evento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
