using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Empleados.Queries.GetEmpleados;
using Zapatitos.Application.Features.Identity.Commands.RegisterStaff;
using Zapatitos.Application.Features.Identity.Commands.UpdateStaff;
using Zapatitos.Application.Features.Identity.Commands.DeleteStaff;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador")]
public class EmpleadosController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmpleadoDto>>> Get()
    {
        var result = await Mediator.Send(new GetEmpleadosQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<ActionResult<long>> Create(RegisterStaffCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<bool>> Update(long id, UpdateStaffCommand command)
    {
        if (id != command.EmpleadoId) return BadRequest("Id mismatch.");
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<bool>> Delete(long id)
    {
        var result = await Mediator.Send(new DeleteStaffCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }
}
