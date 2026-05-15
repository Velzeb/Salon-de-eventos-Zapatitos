using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Commands.AddRetroalimentacion;

public record AddRetroalimentacionCommand : IRequest<Result<long>>
{
    public long EventoId { get; init; }
    public int Calificacion { get; init; }
    public string? Comentario { get; init; }
}

public class AddRetroalimentacionCommandHandler : IRequestHandler<AddRetroalimentacionCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddRetroalimentacionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddRetroalimentacionCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Retroalimentacion)
            .FirstOrDefaultAsync(e => e.Id == request.EventoId, cancellationToken);

        if (evento == null)
            return Result<long>.Failure("El evento no existe.");

        if (evento.Retroalimentacion != null)
            return Result<long>.Failure("Este evento ya tiene una calificación registrada.");

        var retro = new RetroalimentacionCliente
        {
            EventoId = request.EventoId,
            CalificacionGeneral = request.Calificacion,
            Comentario = request.Comentario
        };

        await _unitOfWork.Repository<RetroalimentacionCliente>().AddAsync(retro);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(retro.Id);
    }
}
