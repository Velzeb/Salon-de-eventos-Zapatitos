using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetEmpleadoNominas;

public record GetEmpleadoNominasQuery(long EmpleadoId) : IRequest<Result<List<EmpleadoNominaDto>>>;

public class EmpleadoNominaDto
{
    public long Id { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaPago { get; set; }
    public string? Periodo { get; set; }
    public string? ComprobanteUrl { get; set; }
}

public class GetEmpleadoNominasQueryHandler : IRequestHandler<GetEmpleadoNominasQuery, Result<List<EmpleadoNominaDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEmpleadoNominasQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<EmpleadoNominaDto>>> Handle(GetEmpleadoNominasQuery request, CancellationToken cancellationToken)
    {
        var nominas = await _unitOfWork.Repository<PagoNomina>().Query()
            .Where(p => p.EmpleadoId == request.EmpleadoId && !p.EliminadoEn.HasValue)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => new EmpleadoNominaDto
            {
                Id = p.Id,
                Monto = p.Monto,
                FechaPago = p.FechaPago,
                Periodo = p.Periodo,
                ComprobanteUrl = p.ComprobanteUrl
            })
            .ToListAsync(cancellationToken);

        return Result<List<EmpleadoNominaDto>>.Success(nominas);
    }
}
