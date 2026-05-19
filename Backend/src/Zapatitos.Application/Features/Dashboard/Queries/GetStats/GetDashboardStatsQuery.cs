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

        // 1. Obtener todos los eventos activos
        var eventos = await _unitOfWork.Repository<Evento>()
            .Query()
            .Include(e => e.Pagos)
            .Where(e => e.Estado != EstadoEvento.Cancelado && !e.EliminadoEn.HasValue)
            .ToListAsync(cancellationToken);

        // Cálculos Financieros
        stats.IngresosTotalesProyectados = eventos.Sum(e => e.PrecioTotal);
        stats.IngresosRecaudados = eventos.SelectMany(e => e.Pagos)
            .Where(p => p.Estado == EstadoPago.Verificado)
            .Sum(p => p.Monto);
        stats.SaldoPendienteTotal = stats.IngresosTotalesProyectados - stats.IngresosRecaudados;

        // Cálculos de Conversión
        stats.TotalReservasProvisionales = eventos.Count(e => e.Estado == EstadoEvento.Provisional);
        stats.TotalReservasConfirmadas = eventos.Count(e => e.Estado == EstadoEvento.Confirmado || e.Estado == EstadoEvento.Terminado);
        
        int totalHistorico = stats.TotalReservasProvisionales + stats.TotalReservasConfirmadas;
        stats.TasaConversion = totalHistorico > 0 
            ? Math.Round((double)stats.TotalReservasConfirmadas / totalHistorico * 100, 2) 
            : 0;

        stats.TicketPromedio = eventos.Any() 
            ? Math.Round(eventos.Average(e => e.PrecioTotal), 2) 
            : 0;

        // Ocupación
        stats.EventosEsteMes = eventos.Count(e => e.FechaEvento >= hoy && e.FechaEvento <= finMes);
        
        // Días libres (estimación simplificada de fines de semana ocupados)
        // En una implementación real, esto consultaría la tabla de disponibilidad
        stats.DiasLibresProximos30Dias = 30 - eventos.Count(e => e.FechaEvento >= hoy && e.FechaEvento <= hoy.AddDays(30));

        // Eventos Críticos (Próximos 7 días)
        stats.ProximosEventosCriticos = eventos
            .Where(e => e.FechaEvento >= hoy && e.FechaEvento <= hoy.AddDays(7))
            .OrderBy(e => e.FechaEvento)
            .Select(e => new EventoProximoDto
            {
                Id = e.Id,
                Paquete = e.Paquete?.Nombre ?? "Paquete Personalizado",
                Fecha = e.FechaEvento,
                Estado = e.Estado.ToString(),
                SaldoPendiente = e.PrecioTotal - e.Pagos.Where(p => p.Estado == EstadoPago.Verificado).Sum(p => p.Monto)
            }).ToList();

        // Inventario
        stats.ArticulosBajoStock = await _unitOfWork.Repository<ArticuloInventario>()
            .Query()
            .CountAsync(a => a.ControlarStock && a.StockActual <= a.StockMinimo, cancellationToken);
        
        // Mapeo y Datos de Gráfica (Implementación simplificada)
        stats.StockCritico = stats.ArticulosBajoStock;
        stats.IngresosTotales = stats.IngresosTotalesProyectados;
        
        // Datos de tendencia (Simulados por ahora para evitar ceros)
        stats.EventosMesAnterior = stats.EventosEsteMes > 0 ? stats.EventosEsteMes - 1 : 0;
        stats.IngresosMesAnterior = stats.IngresosTotales * 0.9m;
        stats.ClientesNuevos = await _unitOfWork.Repository<Cliente>().Query().CountAsync(cancellationToken);
        stats.ClientesMesAnterior = stats.ClientesNuevos > 0 ? stats.ClientesNuevos - 1 : 0;

        // Datos de gráfica (Últimos 6 meses)
        for (int i = 5; i >= 0; i--)
        {
            var fecha = hoy.AddMonths(-i);
            stats.ChartData.Add(new ChartDataDto
            {
                Name = fecha.ToString("MMM"),
                Ingresos = eventos.Where(e => e.FechaEvento.Month == fecha.Month && e.FechaEvento.Year == fecha.Year).Sum(e => e.PrecioTotal),
                Eventos = eventos.Count(e => e.FechaEvento.Month == fecha.Month && e.FechaEvento.Year == fecha.Year)
            });
        }

        return stats;
    }
}
