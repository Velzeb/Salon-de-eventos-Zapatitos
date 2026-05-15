using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Inventario.Commands.UpdateArticulo;
using Zapatitos.Application.Features.Inventario.Commands.DeleteArticulo;
using Zapatitos.Application.Features.Inventario.Commands.CreateArticulo;
using Zapatitos.Application.Features.Inventario.Commands.AdjustStock;
using Zapatitos.Application.Features.Inventario.Queries.GetArticulos;
using MediatR;

namespace Zapatitos.API.Controllers;

[Authorize]
public class InventarioController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ArticuloDto>>> GetArticulos()
    {
        return await Mediator.Send(new GetArticulosQuery());
    }

    [HttpPost]
    public async Task<ActionResult<long>> CreateArticulo(CreateArticuloCommand command)
    {
        var result = await Mediator.Send(command);
        if (result.Succeeded)
        {
            return Ok(result.Value);
        }
        return BadRequest(result.Errors);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateArticulo(long id, UpdateArticuloCommand command)
    {
        if (id != command.Id)
            return BadRequest();

        var result = await Mediator.Send(command);
        if (result.Succeeded)
            return NoContent();

        return BadRequest(result.Errors);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> DeleteArticulo(long id)
    {
        var result = await Mediator.Send(new DeleteArticuloCommand(id));
        if (result.Succeeded)
            return NoContent();

        return BadRequest(result.Errors);
    }

    [HttpPatch("{id}/stock")]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<long>> AdjustStock(long id, [FromBody] int delta)
    {
        var result = await Mediator.Send(new AdjustStockCommand(id, delta));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }
}
