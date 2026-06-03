using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Dashboard.Queries.GetStats;

public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

public class DashboardStatsDto
{
    // Pilar 1: Finanzas
    public decimal IngresosTotalesProyectados { get; set; }
    public decimal IngresosRecaudados { get; set; }
    public decimal SaldoPendienteTotal { get; set; }

    // Pilar 2: Ventas y Conversión
    public int TotalReservasProvisionales { get; set; }
    public int TotalReservasConfirmadas { get; set; }
    public double TasaConversion { get; set; }
    public decimal TicketPromedio { get; set; }

    // Pilar 3: Ocupación
    public int EventosEsteMes { get; set; }
    public int DiasLibresProximos30Dias { get; set; }

    // Pilar 4: Operaciones
    public List<EventoProximoDto> ProximosEventosCriticos { get; set; } = new();
    public int ArticulosBajoStock { get; set; }

    // Campos de tendencia y gráficas
    public int EventosMesAnterior { get; set; }
    public decimal IngresosTotales { get; set; }
    public decimal IngresosMesAnterior { get; set; }
    public int ClientesNuevos { get; set; }
    public int ClientesMesAnterior { get; set; }
    public int StockCritico { get; set; }
    public List<ChartDataDto> ChartData { get; set; } = new();
}

public class ChartDataDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Ingresos { get; set; }
    public int Eventos { get; set; }
}

public class EventoProximoDto
{
    public long Id { get; set; }
    public string Paquete { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public decimal SaldoPendiente { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDashboardStatsHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var stats = new DashboardStatsDto();
        var hoy = DateTime.UtcNow.Date;
        var finMes = new DateTime(hoy.Year, hoy.Month, DateTime.DaysInMonth(hoy.Year, hoy.Month));
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);
        var inicioMesAnterior = inicioMes.AddMonths(-1);
        var finMesAnterior = inicioMes.AddDays(-1);

        // 1. Cálculos Financieros directos en Base de Datos
        var queryEventosActivos = _unitOfWork.Repository<Evento>().Query()
            .Where(e => e.Estado != EstadoEvento.Cancelado && !e.EliminadoEn.HasValue);

        stats.IngresosTotalesProyectados = await queryEventosActivos
            .SumAsync(e => e.PrecioTotal, cancellationToken);

        stats.IngresosRecaudados = await _unitOfWork.Repository<Pago>().Query()
            .Where(p => p.Estado == EstadoPago.Verificado && p.Evento.Estado != EstadoEvento.Cancelado && !p.Evento.EliminadoEn.HasValue)
            .SumAsync(p => p.Monto, cancellationToken);

        stats.SaldoPendienteTotal = stats.IngresosTotalesProyectados - stats.IngresosRecaudados;

        // 2. Cálculos de Conversión
        stats.TotalReservasProvisionales = await queryEventosActivos
            .CountAsync(e => e.Estado == EstadoEvento.Provisional, cancellationToken);

        stats.TotalReservasConfirmadas = await queryEventosActivos
            .CountAsync(e => e.Estado == EstadoEvento.Confirmado || e.Estado == EstadoEvento.Terminado, cancellationToken);
        
        int totalHistorico = stats.TotalReservasProvisionales + stats.TotalReservasConfirmadas;
        stats.TasaConversion = totalHistorico > 0 
            ? Math.Round((double)stats.TotalReservasConfirmadas / totalHistorico * 100, 2) 
            : 0;

        var countEventosActivos = await queryEventosActivos.CountAsync(cancellationToken);
        stats.TicketPromedio = countEventosActivos > 0 
            ? Math.Round(await queryEventosActivos.AverageAsync(e => e.PrecioTotal, cancellationToken), 2) 
            : 0;

        // 3. Ocupación
        stats.EventosEsteMes = await queryEventosActivos
            .CountAsync(e => e.FechaEvento >= inicioMes && e.FechaEvento <= finMes, cancellationToken);
        
        var occupiedDaysCount = await queryEventosActivos
            .Where(e => e.FechaEvento >= hoy && e.FechaEvento <= hoy.AddDays(30))
            .Select(e => e.FechaEvento)
            .Distinct()
            .CountAsync(cancellationToken);
        stats.DiasLibresProximos30Dias = Math.Max(0, 30 - occupiedDaysCount);

        // 4. Eventos Críticos (Próximos 7 días) - Carga acotada e Include(e => e.Paquete)
        var proximosEventos = await _unitOfWork.Repository<Evento>().Query()
            .Include(e => e.Paquete)
            .Include(e => e.Pagos)
            .Where(e => e.FechaEvento >= hoy && e.FechaEvento <= hoy.AddDays(7) && e.Estado != EstadoEvento.Cancelado && !e.EliminadoEn.HasValue)
            .OrderBy(e => e.FechaEvento)
            .ToListAsync(cancellationToken);

        stats.ProximosEventosCriticos = proximosEventos
            .Select(e => new EventoProximoDto
            {
                Id = e.Id,
                Paquete = e.Paquete?.Nombre ?? "Paquete Personalizado",
                Fecha = e.FechaEvento,
                Estado = e.Estado.ToString(),
                SaldoPendiente = Math.Max(0, e.PrecioTotal - e.Pagos.Where(p => p.Estado == EstadoPago.Verificado).Sum(p => p.Monto))
            }).ToList();

        // 5. Inventario
        stats.ArticulosBajoStock = await _unitOfWork.Repository<ArticuloInventario>()
            .Query()
            .CountAsync(a => a.ControlarStock && a.StockActual <= a.StockMinimo, cancellationToken);
        
        stats.StockCritico = stats.ArticulosBajoStock;
        stats.IngresosTotales = stats.IngresosTotalesProyectados;
        
        // 6. Datos de tendencia reales
        stats.EventosMesAnterior = await queryEventosActivos
            .CountAsync(e => e.FechaEvento >= inicioMesAnterior && e.FechaEvento <= finMesAnterior, cancellationToken);

        stats.IngresosMesAnterior = await _unitOfWork.Repository<Pago>().Query()
            .Where(p => p.FechaPago >= inicioMesAnterior && p.FechaPago <= finMesAnterior && p.Estado == EstadoPago.Verificado && p.Evento.Estado != EstadoEvento.Cancelado && !p.Evento.EliminadoEn.HasValue)
            .SumAsync(p => p.Monto, cancellationToken);

        stats.ClientesNuevos = await _unitOfWork.Repository<Cliente>().Query()
            .CountAsync(c => c.CreadoEn >= inicioMes, cancellationToken);

        stats.ClientesMesAnterior = await _unitOfWork.Repository<Cliente>().Query()
            .CountAsync(c => c.CreadoEn >= inicioMesAnterior && c.CreadoEn <= finMesAnterior, cancellationToken);

        // 7. Datos de gráfica (Últimos 6 meses) - Consulta acotada
        var hace6Meses = inicioMes.AddMonths(-5);
        var eventosChart = await queryEventosActivos
            .Where(e => e.FechaEvento >= hace6Meses && e.FechaEvento <= finMes)
            .Select(e => new { e.FechaEvento, e.PrecioTotal })
            .ToListAsync(cancellationToken);

        for (int i = 5; i >= 0; i--)
        {
            var fecha = hoy.AddMonths(-i);
            stats.ChartData.Add(new ChartDataDto
            {
                Name = fecha.ToString("MMM"),
                Ingresos = eventosChart.Where(e => e.FechaEvento.Month == fecha.Month && e.FechaEvento.Year == fecha.Year).Sum(e => e.PrecioTotal),
                Eventos = eventosChart.Count(e => e.FechaEvento.Month == fecha.Month && e.FechaEvento.Year == fecha.Year)
            });
        }

        return stats;
    }
}
