using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Eventos.Commands.CreateEvento;
using Zapatitos.Application.Features.Eventos.Commands.UpdateEstadoEvento;
using Zapatitos.Application.Features.Eventos.Queries.GetEventos;
using Zapatitos.Application.Features.Eventos.Queries.GetEventoDetailAdmin;
using Zapatitos.Application.Features.Finanzas.Commands.VerifyPago;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Zapatitos.Domain.Enums;

namespace Zapatitos.API.Controllers;

[Authorize]
public class EventosController : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<IEnumerable<EventoDto>>> GetAll()
    {
        var result = await Mediator.Send(new GetEventosQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Empleado,Cliente")]
    public async Task<ActionResult<long>> Create(CreateEventoCommand command)
    {
        if (User.IsInRole("Cliente"))
        {
            var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(sub, out var usuarioId))
            {
                command.UsuarioId = usuarioId;
                command.Origen = OrigenEvento.Online;
            }
        }

        var result = await Mediator.Send(command);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(result.Value);
    }

    [HttpGet("{id:long}/detalle-admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<EventoDetailAdminDto>> GetDetalleAdmin(long id)
    {
        var result = await Mediator.Send(new GetEventoDetailAdminQuery(id));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpPatch("{id:long}/estado")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateEstado(long id, [FromBody] UpdateEstadoRequest request)
    {
        var result = await Mediator.Send(new UpdateEstadoEventoCommand(id, request.Estado));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPatch("{id:long}/verificar-pago/{pagoId:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> VerificarPago(long id, long pagoId, [FromQuery] bool aceptar = true)
    {
        var result = await Mediator.Send(new VerifyPagoCommand(pagoId, aceptar));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    public class UpdateEstadoRequest
    {
        public string Estado { get; set; } = null!;
    }
}
