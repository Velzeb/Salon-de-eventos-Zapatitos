using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Dashboard.Queries.GetStats;

public record GetStatsQuery(string Periodo = "Semana") : IRequest<Result<DashboardStatsDto>>;

public class ChartItemDto
{
    public string Name { get; set; } = null!;
    public decimal Ingresos { get; set; }
    public int Eventos { get; set; }
}

public class DashboardStatsDto
{
    public int EventosEsteMes { get; set; }
    public decimal IngresosTotales { get; set; }
    public int ClientesNuevos { get; set; }
    public int StockCritico { get; set; }
    public int EventosMesAnterior { get; set; }
    public decimal IngresosMesAnterior { get; set; }
    public int ClientesMesAnterior { get; set; }
    public List<ChartItemDto> ChartData { get; set; } = new();
}

public class GetStatsQueryHandler : IRequestHandler<GetStatsQuery, Result<DashboardStatsDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStatsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DashboardStatsDto>> Handle(GetStatsQuery request, CancellationToken cancellationToken)
    {
        try 
        {
            var now = DateTime.UtcNow;
            var firstDayOfMonth = DateTime.SpecifyKind(new DateTime(now.Year, now.Month, 1), DateTimeKind.Utc);

            // 1. Eventos este mes
            var eventosCount = await _unitOfWork.Repository<Evento>().Query()
                .CountAsync(e => e.FechaEvento >= firstDayOfMonth, cancellationToken);

            // 2. Ingresos Totales
            var ingresosSum = await _unitOfWork.Repository<Pago>().Query()
                .SumAsync(p => p.Monto, cancellationToken);

            // 3. Clientes Nuevos
            var clientesCount = await _unitOfWork.Repository<Cliente>().Query()
                .CountAsync(c => c.CreadoEn >= firstDayOfMonth, cancellationToken);

            // 4. Stock Crítico
            var stockCriticoCount = await _unitOfWork.Repository<ArticuloInventario>().Query()
                .CountAsync(a => a.ControlarStock && a.StockActual <= a.StockMinimo, cancellationToken);

            // 5. Datos del mes anterior para comparaciones
            var firstDayPrevMonth = firstDayOfMonth.AddMonths(-1);
            var lastDayPrevMonth = firstDayOfMonth.AddSeconds(-1);

            var eventosMesAnterior = await _unitOfWork.Repository<Evento>().Query()
                .CountAsync(e => e.FechaEvento >= firstDayPrevMonth && e.FechaEvento < firstDayOfMonth, cancellationToken);

            var ingresosMesAnterior = await _unitOfWork.Repository<Pago>().Query()
                .Where(p => p.FechaPago >= firstDayPrevMonth && p.FechaPago < firstDayOfMonth)
                .SumAsync(p => p.Monto, cancellationToken);

            var clientesMesAnterior = await _unitOfWork.Repository<Cliente>().Query()
                .CountAsync(c => c.CreadoEn >= firstDayPrevMonth && c.CreadoEn < firstDayOfMonth, cancellationToken);

            // 6. Chart Data según el Periodo
            var culture = new System.Globalization.CultureInfo("es-ES");
            var chartData = new List<ChartItemDto>();

            if (request.Periodo == "Mes")
            {
                // Últimas 4 semanas agrupadas por semana
                var start4Weeks = DateTime.SpecifyKind(now.Date.AddDays(-27), DateTimeKind.Utc);
                var pagosMes = await _unitOfWork.Repository<Pago>().Query()
                    .Where(p => p.FechaPago >= start4Weeks).ToListAsync(cancellationToken);
                var eventosMes = await _unitOfWork.Repository<Evento>().Query()
                    .Where(e => e.FechaEvento >= start4Weeks).ToListAsync(cancellationToken);

                for (int w = 0; w < 4; w++)
                {
                    var weekStart = start4Weeks.AddDays(w * 7);
                    var weekEnd = weekStart.AddDays(7);
                    chartData.Add(new ChartItemDto
                    {
                        Name = $"Sem {w + 1}",
                        Ingresos = pagosMes.Where(p => p.FechaPago >= weekStart && p.FechaPago < weekEnd).Sum(p => p.Monto),
                        Eventos = eventosMes.Count(e => e.FechaEvento >= weekStart && e.FechaEvento < weekEnd)
                    });
                }
            }
            else if (request.Periodo == "Año")
            {
                // Últimos 12 meses agrupados por mes
                var start12Months = DateTime.SpecifyKind(now.Date.AddMonths(-11).AddDays(1 - now.Day), DateTimeKind.Utc);
                var pagosAnio = await _unitOfWork.Repository<Pago>().Query()
                    .Where(p => p.FechaPago >= start12Months).ToListAsync(cancellationToken);
                var eventosAnio = await _unitOfWork.Repository<Evento>().Query()
                    .Where(e => e.FechaEvento >= start12Months).ToListAsync(cancellationToken);

                for (int m = 0; m < 12; m++)
                {
                    var monthStart = start12Months.AddMonths(m);
                    var monthEnd = monthStart.AddMonths(1);
                    var monthName = culture.DateTimeFormat.GetAbbreviatedMonthName(monthStart.Month);
                    monthName = char.ToUpper(monthName[0]) + monthName.Substring(1);
                    chartData.Add(new ChartItemDto
                    {
                        Name = monthName,
                        Ingresos = pagosAnio.Where(p => p.FechaPago >= monthStart && p.FechaPago < monthEnd).Sum(p => p.Monto),
                        Eventos = eventosAnio.Count(e => e.FechaEvento >= monthStart && e.FechaEvento < monthEnd)
                    });
                }
            }
            else // Semana (default)
            {
                var startOfWeek = DateTime.SpecifyKind(now.Date.AddDays(-6), DateTimeKind.Utc);
                var pagosSemana = await _unitOfWork.Repository<Pago>().Query()
                    .Where(p => p.FechaPago >= startOfWeek).ToListAsync(cancellationToken);
                var eventosSemana = await _unitOfWork.Repository<Evento>().Query()
                    .Where(e => e.FechaEvento >= startOfWeek).ToListAsync(cancellationToken);

                for (int i = 0; i < 7; i++)
                {
                    var day = startOfWeek.AddDays(i);
                    var dayName = culture.DateTimeFormat.GetAbbreviatedDayName(day.DayOfWeek);
                    dayName = char.ToUpper(dayName[0]) + dayName.Substring(1);
                    chartData.Add(new ChartItemDto
                    {
                        Name = dayName,
                        Ingresos = pagosSemana.Where(p => p.FechaPago.Date == day.Date).Sum(p => p.Monto),
                        Eventos = eventosSemana.Count(e => e.FechaEvento.Date == day.Date)
                    });
                }
            }

            var stats = new DashboardStatsDto
            {
                EventosEsteMes = eventosCount,
                IngresosTotales = ingresosSum,
                ClientesNuevos = clientesCount,
                StockCritico = stockCriticoCount,
                EventosMesAnterior = eventosMesAnterior,
                IngresosMesAnterior = ingresosMesAnterior,
                ClientesMesAnterior = clientesMesAnterior,
                ChartData = chartData
            };

            return Result<DashboardStatsDto>.Success(stats);
        }
        catch (Exception ex)
        {
            return Result<DashboardStatsDto>.Failure($"Error al calcular estadísticas: {ex.Message}");
        }
    }
}
