using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;
using Zapatitos.Infrastructure.Persistence;

namespace Zapatitos.API.Controllers;

// DTO simplificado para evitar errores de validación de BaseEntity
public record TurnoDto(string NombreBloque, string HoraInicio, string HoraFin, bool Activo);
public record BulkUpdateDayRequest(int DiaSemana, List<TurnoDto> Turnos);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,Empleado")]
public class DisponibilidadController : ControllerBase
{
    private readonly ZapatitosDbContext _context;

    public DisponibilidadController(ZapatitosDbContext context)
    {
        _context = context;
    }

    [HttpGet("config")]
    public async Task<IActionResult> GetConfigs()
    {
        var configs = await _context.DisponibilidadConfigs
            .Where(c => c.EliminadoEn == null)
            .OrderBy(c => c.DiaSemana)
            .ThenBy(c => c.HoraInicio)
            .ToListAsync();

        return Ok(configs);
    }

    [HttpPost("config")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> SaveConfig([FromBody] DisponibilidadConfig config)
    {
        if (config.Id > 0)
        {
            var existing = await _context.DisponibilidadConfigs.FindAsync(config.Id);
            if (existing == null) return NotFound();

            existing.DiaSemana = config.DiaSemana;
            existing.HoraInicio = config.HoraInicio;
            existing.HoraFin = config.HoraFin;
            existing.NombreBloque = config.NombreBloque;
            existing.Activo = config.Activo;
            existing.ModificadoEn = DateTime.UtcNow;

            _context.DisponibilidadConfigs.Update(existing);
        }
        else
        {
            config.Id = 0; // Ensure it's new
            _context.DisponibilidadConfigs.Add(config);
        }

        await _context.SaveChangesAsync();
        return Ok(config);
    }

    [HttpPost("bulk-day")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> BulkUpdateDay([FromBody] BulkUpdateDayRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Mark existing turns for this day as deleted
            var existing = await _context.DisponibilidadConfigs
                .Where(c => c.DiaSemana == request.DiaSemana && c.EliminadoEn == null)
                .ToListAsync();

            foreach (var item in existing)
            {
                item.EliminadoEn = DateTime.UtcNow;
            }

            // 2. Add new turns
            foreach (var turno in request.Turnos)
            {
                var newTurno = new DisponibilidadConfig
                {
                    DiaSemana = request.DiaSemana,
                    HoraInicio = TimeSpan.Parse(turno.HoraInicio),
                    HoraFin = TimeSpan.Parse(turno.HoraFin),
                    NombreBloque = turno.NombreBloque,
                    Activo = turno.Activo,
                    CreadoEn = DateTime.UtcNow
                };
                _context.DisponibilidadConfigs.Add(newTurno);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, $"Error al realizar actualización masiva: {ex.Message}");
        }
    }

    [HttpDelete("config/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> DeleteConfig(long id)
    {
        var existing = await _context.DisponibilidadConfigs.FindAsync(id);
        if (existing == null) return NotFound();

        existing.EliminadoEn = DateTime.UtcNow;
        _context.DisponibilidadConfigs.Update(existing);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] DateTime date)
    {
        var localDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        int dayOfWeek = (int)localDate.DayOfWeek;

        var configs = await _context.DisponibilidadConfigs
            .Where(c => c.DiaSemana == dayOfWeek && c.Activo && c.EliminadoEn == null)
            .ToListAsync();

        var existingEvents = await _context.Eventos
            .Where(e => e.FechaEvento.Date == localDate && e.Estado != EstadoEvento.Cancelado && e.EliminadoEn == null)
            .ToListAsync();

        var results = configs.Select(c => new
        {
            ConfigId = c.Id,
            NombreBloque = c.NombreBloque,
            HoraInicio = c.HoraInicio.ToString(@"hh\:mm\:ss"),
            HoraFin = c.HoraFin.ToString(@"hh\:mm\:ss"),
            IsAvailable = !existingEvents.Any(e => 
                (e.HoraInicio < c.HoraFin && e.HoraFin > c.HoraInicio))
        });

        return Ok(results);
    }
}
