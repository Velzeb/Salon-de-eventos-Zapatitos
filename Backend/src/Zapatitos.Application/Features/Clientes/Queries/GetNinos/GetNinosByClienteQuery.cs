using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Clientes.Queries.GetNinos;

public record GetNinosByClienteQuery(long ClienteId) : IRequest<Result<IEnumerable<NinoDto>>>;

public record NinoDto(long Id, string Nombre, string? FechaNacimiento);

public class GetNinosByClienteQueryHandler : IRequestHandler<GetNinosByClienteQuery, Result<IEnumerable<NinoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetNinosByClienteQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<NinoDto>>> Handle(GetNinosByClienteQuery request, CancellationToken cancellationToken)
    {
        // Usar una consulta más directa para evitar problemas de mapeo en relaciones M-M
        var ninos = await _unitOfWork.Repository<Nino>().Query()
            .Where(n => n.Responsables.Any(r => r.Id == request.ClienteId))
            .Select(n => new NinoDto(
                n.Id, 
                n.Nombre, 
                n.FechaNacimiento.HasValue ? n.FechaNacimiento.Value.ToString("yyyy-MM-dd") : null))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<NinoDto>>.Success(ninos);
    }
}
