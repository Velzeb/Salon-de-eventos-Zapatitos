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
        var movimientos = await _unitOfWork.Repository<MovimientoCaja>().Query().ToListAsync(cancellationToken);

        var ingresos = movimientos.Where(m => m.Tipo == TipoTransaccion.Ingreso).Sum(m => m.Monto);
        var egresos = movimientos.Where(m => m.Tipo == TipoTransaccion.Egreso).Sum(m => m.Monto);

        return Result<RentabilidadDto>.Success(new RentabilidadDto
        {
            TotalIngresos = ingresos,
            TotalEgresos = egresos,
            UtilidadNeta = ingresos - egresos
        });
    }
}
