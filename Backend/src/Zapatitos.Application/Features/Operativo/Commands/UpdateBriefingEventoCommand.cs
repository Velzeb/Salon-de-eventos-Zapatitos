using MediatR;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace Zapatitos.Application.Features.Operativo.Commands.UpdateBriefing;

public record UpdateBriefingEventoCommand : IRequest<Result<bool>>
{
    public long EventoId { get; init; }
    public string? Tematica { get; init; }
    public string? ColorManteleria { get; init; }
    public string? SaborPastel { get; init; }
    public string? NotasDecoracion { get; init; }
    public string? Alergias { get; init; }
}

public class UpdateBriefingEventoCommandHandler : IRequestHandler<UpdateBriefingEventoCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBriefingEventoCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<bool>> Handle(UpdateBriefingEventoCommand request, CancellationToken cancellationToken)
    {
        var repo = _unitOfWork.Repository<Evento>();
        var evento = await repo.GetByIdAsync(request.EventoId);

        if (evento == null)
            return Result<bool>.Failure("Evento no encontrado.");

        evento.Tematica = request.Tematica;
        evento.ColorManteleria = request.ColorManteleria;
        evento.SaborPastel = request.SaborPastel;
        evento.NotasDecoracion = request.NotasDecoracion;
        evento.Alergias = request.Alergias;

        repo.Update(evento);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
