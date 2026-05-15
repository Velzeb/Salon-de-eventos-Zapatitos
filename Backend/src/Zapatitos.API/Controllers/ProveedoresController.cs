using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Proveedores.Commands.CreateProveedor;
using Zapatitos.Application.Features.Proveedores.Queries.GetProveedores;

using Zapatitos.Application.Features.Proveedores.Commands.UpdateProveedor;
using Zapatitos.Application.Features.Proveedores.Commands.DeleteProveedor;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador,Empleado")]
public class ProveedoresController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProveedorDto>>> Get()
    {
        var result = await Mediator.Send(new GetProveedoresQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<ActionResult<long>> Create(CreateProveedorCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> Update(long id, UpdateProveedorCommand command)
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
        var result = await Mediator.Send(new DeleteProveedorCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
