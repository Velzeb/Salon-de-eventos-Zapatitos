using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Queries.GetMisEventos;

public record ClienteEventoDto(long Id, string FechaEvento, string Estado, string Paquete, decimal PrecioTotal, decimal SaldoPendiente, string NombreCumpleanero);

public record GetMisEventosQuery(long UsuarioId) : IRequest<Result<IEnumerable<ClienteEventoDto>>>;

public class GetMisEventosQueryHandler : IRequestHandler<GetMisEventosQuery, Result<IEnumerable<ClienteEventoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMisEventosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<ClienteEventoDto>>> Handle(GetMisEventosQuery request, CancellationToken cancellationToken)
    {
        var eventos = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Include(e => e.Cumpleaneros)
                .ThenInclude(c => c.Nino)
            .Where(e => e.ClientesResponsables.Any(c => c.UsuarioId == request.UsuarioId))
            .OrderByDescending(e => e.FechaEvento)
            .ToListAsync(cancellationToken);

        var dtos = eventos.Select(e => new ClienteEventoDto(
            e.Id,
            e.FechaEvento.ToString("yyyy-MM-dd"),
            e.Estado.ToString(),
            e.Paquete?.Nombre ?? "Paquete",
            e.PrecioTotal,
            e.SaldoPendiente,
            string.Join(", ", e.Cumpleaneros.Select(c => c.Nino?.Nombre ?? "Cumpleañero"))
        ));

        return Result<IEnumerable<ClienteEventoDto>>.Success(dtos);
    }
}
