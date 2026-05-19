using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Zapatitos.Application.Features.EmpleadoPortal;
using Zapatitos.Application.Features.Operativo.Commands.AddConsumo;
using Zapatitos.Application.Features.Operativo.Commands.CompleteTarea;
using Zapatitos.Application.Features.Operativo.Commands.Invitados;
using Zapatitos.Application.Features.Operativo.Queries.GetEventoOperativo;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Empleado,Administrador")]
public class EmpleadoController : ApiControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<EmpleadoPerfilDto>> GetMe()
    {
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();
        var result = await Mediator.Send(new GetEmpleadoPerfilQuery(usuarioId));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("jornada")]
    public async Task<ActionResult<EmpleadoJornadaDto>> GetJornada()
    {
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();
        var result = await Mediator.Send(new GetEmpleadoJornadaQuery(usuarioId));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("eventos")]
    public async Task<ActionResult<IEnumerable<EmpleadoEventoDto>>> GetEventos()
    {
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();
        var result = await Mediator.Send(new GetEmpleadoEventosQuery(usuarioId));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("eventos/{id:long}")]
    public async Task<ActionResult<EventoOperativoDto>> GetEvento(long id)
    {
        var result = await Mediator.Send(new GetEventoOperativoQuery(id));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpPatch("tareas/{id:long}/completar")]
    public async Task<ActionResult> CompletarTarea(long id)
    {
        var result = await Mediator.Send(new CompleteTareaCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPatch("actividades/{id:long}/completar")]
    public async Task<ActionResult> CompletarActividad(long id, [FromBody] CompleteActividadRequest request)
    {
        var result = await Mediator.Send(new CompleteActividadEmpleadoCommand(id, request.Completada));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("invitados/registrar-ingreso")]
    public async Task<ActionResult<object>> RegistrarIngreso(RegistrarIngresoInvitadoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { Mensaje = result.Value });
    }

    [HttpPost("consumo-extra")]
    public async Task<ActionResult<long>> AddConsumo(AddConsumoExtraCommand command)
    {
        if (!TryGetUsuarioId(out var usuarioId)) return Unauthorized();
        var perfil = await Mediator.Send(new GetEmpleadoPerfilQuery(usuarioId));
        if (!perfil.Succeeded || perfil.Value == null) return NotFound(perfil.Errors);

        var result = await Mediator.Send(command with { EmpleadoId = perfil.Value.Id });
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    private bool TryGetUsuarioId(out long usuarioId)
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(sub, out usuarioId);
    }

    public class CompleteActividadRequest
    {
        public bool Completada { get; set; }
    }
}
