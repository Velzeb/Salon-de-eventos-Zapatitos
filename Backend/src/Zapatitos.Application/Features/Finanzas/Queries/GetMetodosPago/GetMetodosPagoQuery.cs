using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetMetodosPago;

public record MetodoPagoDto(long Id, string Nombre, bool Activo);

public record GetMetodosPagoQuery : IRequest<Result<IEnumerable<MetodoPagoDto>>>;

public class GetMetodosPagoQueryHandler : IRequestHandler<GetMetodosPagoQuery, Result<IEnumerable<MetodoPagoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetMetodosPagoQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<MetodoPagoDto>>> Handle(GetMetodosPagoQuery request, CancellationToken cancellationToken)
    {
        var metodos = await _unitOfWork.Repository<MetodoPago>().Query()
            .OrderBy(m => m.Nombre)
            .Select(m => new MetodoPagoDto(m.Id, m.Nombre, m.Activo))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<MetodoPagoDto>>.Success(metodos);
    }
}
