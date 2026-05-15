using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetCuentasPendientes;

public record CuentaPendienteDto(long EventoId, string FechaEvento, decimal SaldoPendiente, string Paquete, List<string> Clientes);

public record GetCuentasPendientesQuery : IRequest<Result<IEnumerable<CuentaPendienteDto>>>;

public class GetCuentasPendientesQueryHandler : IRequestHandler<GetCuentasPendientesQuery, Result<IEnumerable<CuentaPendienteDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetCuentasPendientesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IEnumerable<CuentaPendienteDto>>> Handle(GetCuentasPendientesQuery request, CancellationToken cancellationToken)
    {
        var cuentas = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.ClientesResponsables)
            .Where(e => e.SaldoPendiente > 0)
            .OrderByDescending(e => e.FechaEvento)
            .Select(e => new CuentaPendienteDto(
                e.Id,
                e.FechaEvento.ToString("yyyy-MM-dd"),
                e.SaldoPendiente,
                e.Paquete.Nombre,
                e.ClientesResponsables.Select(c => c.NombreCompleto).ToList()
            ))
            .ToListAsync(cancellationToken);

        return Result<IEnumerable<CuentaPendienteDto>>.Success(cuentas);
    }
}
