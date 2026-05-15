using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetPagos;

public record PagoDto(long Id, long EventoId, decimal Monto, string Estado, string? MetodoPago, string FechaPago, string? Referencia, string? ComprobanteUrl);

public record GetPagosQuery : IRequest<Result<IEnumerable<PagoDto>>>;

public class GetPagosQueryHandler : IRequestHandler<GetPagosQuery, Result<IEnumerable<PagoDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPagosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<PagoDto>>> Handle(GetPagosQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _unitOfWork.Repository<Pago>().Query()
            .Include(p => p.MetodoPago)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => new PagoDto(
                p.Id,
                p.EventoId,
                p.Monto,
                p.Estado.ToString(),
                p.MetodoPago != null ? p.MetodoPago.Nombre : null,
                p.FechaPago.ToString("yyyy-MM-dd"),
                p.Referencia,
                p.ComprobanteUrl
            ))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<PagoDto>>.Success(pagos);
    }
}
