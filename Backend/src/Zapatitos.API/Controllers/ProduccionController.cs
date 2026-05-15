using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Produccion.Queries.GetProductos;
using Zapatitos.Application.Features.Produccion.Commands.CreateProducto;
using Zapatitos.Application.Features.Produccion.Commands.UpdateProducto;
using Zapatitos.Application.Features.Produccion.Commands.DeleteProducto;
using MediatR;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador,Empleado")]
public class ProduccionController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoProduccionDto>>> Get()
    {
        var result = await Mediator.Send(new GetProductosProduccionQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<long>> Create(CreateProductoProduccionCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> Update(long id, UpdateProductoProduccionCommand command)
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
        var result = await Mediator.Send(new DeleteProductoProduccionCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
