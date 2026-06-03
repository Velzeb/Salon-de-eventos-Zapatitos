using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Queries.GetReporteRentabilidad;

public record GetReporteRentabilidadQuery : IRequest<Result<RentabilidadDto>>;

public class RentabilidadDto
{
    public decimal TotalIngresos { get; set; }
    public decimal TotalEgresos { get; set; }
    public decimal UtilidadNeta { get; set; }
}

public class GetReporteRentabilidadQueryHandler : IRequestHandler<GetReporteRentabilidadQuery, Result<RentabilidadDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetReporteRentabilidadQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RentabilidadDto>> Handle(GetReporteRentabilidadQuery request, CancellationToken cancellationToken)
    {
        var ingresos = await _unitOfWork.Repository<MovimientoCaja>().Query()
            .Where(m => m.Tipo == TipoTransaccion.Ingreso && !m.EliminadoEn.HasValue)
            .SumAsync(m => m.Monto, cancellationToken);

        var egresos = await _unitOfWork.Repository<MovimientoCaja>().Query()
            .Where(m => m.Tipo == TipoTransaccion.Egreso && !m.EliminadoEn.HasValue)
            .SumAsync(m => m.Monto, cancellationToken);

        return Result<RentabilidadDto>.Success(new RentabilidadDto
        {
            TotalIngresos = ingresos,
            TotalEgresos = egresos,
            UtilidadNeta = ingresos - egresos
        });
    }
}
