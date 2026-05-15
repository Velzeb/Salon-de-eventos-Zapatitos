using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Paquetes.Queries.GetServicios;
using Zapatitos.Application.Features.Paquetes.Commands.CreateServicio;
using Zapatitos.Application.Features.Paquetes.Commands.UpdateServicio;
using Zapatitos.Application.Features.Paquetes.Commands.DeleteServicio;
using MediatR;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador,Empleado,Cliente")]
public class ServiciosController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ServicioDto>>> Get()
    {
        var result = await Mediator.Send(new GetServiciosQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<long>> Create(CreateServicioCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> Update(long id, UpdateServicioCommand command)
    {
        if (id != command.Id) return BadRequest();
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> Delete(long id)
    {
        var result = await Mediator.Send(new DeleteServicioCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
