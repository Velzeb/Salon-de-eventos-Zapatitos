using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Configuracion;

namespace Zapatitos.API.Controllers;

public class ConfigController : ApiControllerBase
{
    [HttpGet("{clave}")]
    [AllowAnonymous] // El cliente puede ver la landing sin loguearse
    public async Task<ActionResult<string>> Get(string clave)
    {
        var result = await Mediator.Send(new GetConfigQuery(clave));
        if (!result.Succeeded) return NotFound(result.Errors);
        return Ok(new { Valor = result.Value });
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> BulkUpdate(BulkUpdateConfigCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> Update(UpdateConfigCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
