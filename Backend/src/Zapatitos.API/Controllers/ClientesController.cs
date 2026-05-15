using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Clientes.Commands.CreateCliente;
using Zapatitos.Application.Features.Clientes.Commands.AddRetroalimentacion;
using Zapatitos.Application.Features.Clientes.Commands.UpdatePerfil;
using Zapatitos.Application.Features.Clientes.Queries.GetClientes;
using Zapatitos.Application.Features.Clientes.Queries.GetMisEventos;
using Zapatitos.Application.Features.Clientes.Queries.GetEventoDetail;
using Zapatitos.Application.Features.Clientes.Queries.GetPerfil;
using Zapatitos.Application.Features.Clientes.Commands.AddPagoQR;

namespace Zapatitos.API.Controllers;

[Authorize]
public class ClientesController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> Get()
    {
        var result = await Mediator.Send(new GetClientesQuery());
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<long>> Create(CreateClienteCommand command)
    {
        var result = await Mediator.Send(command);
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }

    [HttpGet("{id}/ninos")]
    public async Task<ActionResult<IEnumerable<Zapatitos.Application.Features.Clientes.Queries.GetNinos.NinoDto>>> GetNinos(long id)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Clientes.Queries.GetNinos.GetNinosByClienteQuery(id));
        return Ok(result.Value);
    }

    [HttpGet("mis-eventos")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<IEnumerable<ClienteEventoDto>>> GetMisEventos()
    {
        // Al usar Clear() en DefaultInboundClaimTypeMap, el claim se llama "sub" exactamente
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !long.TryParse(sub, out var usuarioId))
        {
            return Unauthorized();
        }

        var result = await Mediator.Send(new GetMisEventosQuery(usuarioId));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("mis-eventos/{id}")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<EventoClienteDetailDto>> GetEventoDetail(long id)
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !long.TryParse(sub, out var usuarioId))
        {
            return Unauthorized();
        }

        var result = await Mediator.Send(new GetEventoClienteDetailQuery(id, usuarioId));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("feedback")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<long>> AddFeedback(AddRetroalimentacionCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("mis-eventos/{id}/pagos-qr")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<long>> AddPagoQR(long id, [FromBody] AddPagoQRCommand command)
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !long.TryParse(sub, out var usuarioId))
        {
            return Unauthorized();
        }

        if (id != command.EventoId) return BadRequest("ID del evento no coincide.");

        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("perfil")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<PerfilClienteDto>> GetPerfil()
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !long.TryParse(sub, out var usuarioId)) return Unauthorized();
        var result = await Mediator.Send(new GetPerfilClienteQuery(usuarioId));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("perfil")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult> UpdatePerfil([FromBody] UpdatePerfilClienteCommand command)
    {
        var sub = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(sub) || !long.TryParse(sub, out var usuarioId)) return Unauthorized();
        var cmd = command with { UsuarioId = usuarioId };
        var result = await Mediator.Send(cmd);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
