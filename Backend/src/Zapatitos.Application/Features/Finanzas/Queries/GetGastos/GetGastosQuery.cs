using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetGastos;

public record GastoDto(long Id, string Categoria, decimal Monto, string Descripcion, string Fecha);

public record GetGastosQuery : IRequest<Result<IEnumerable<GastoDto>>>;

public class GetGastosQueryHandler : IRequestHandler<GetGastosQuery, Result<IEnumerable<GastoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetGastosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<GastoDto>>> Handle(GetGastosQuery request, CancellationToken cancellationToken)
    {
        var gastos = await _unitOfWork.Repository<Gasto>().Query()
            .Include(g => g.Categoria)
            .OrderByDescending(g => g.Fecha)
            .Select(g => new GastoDto(
                g.Id,
                g.Categoria.Nombre,
                g.Monto,
                g.Descripcion,
                g.Fecha.ToString("yyyy-MM-dd")
            ))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<GastoDto>>.Success(gastos);
    }
}
