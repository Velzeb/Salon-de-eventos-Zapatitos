using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Paquetes.Queries.GetPaquetes;
using Zapatitos.Application.Features.Paquetes.Commands.CreatePaquete;

using Zapatitos.Application.Features.Paquetes.Queries.GetServicios;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador,Empleado,Cliente")]
public class PaquetesController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<PaqueteDto>>> Get()
    {
        var result = await Mediator.Send(new GetPaquetesQuery());
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }

    [HttpGet("servicios-adicionales")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ServicioDto>>> GetServicios()
    {
        var result = await Mediator.Send(new GetServiciosQuery());
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<ActionResult<long>> Create(CreatePaqueteCommand command)
    {
        var result = await Mediator.Send(command);
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }
}
