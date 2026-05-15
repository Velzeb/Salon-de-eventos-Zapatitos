using Microsoft.AspNetCore.Mvc;
using Zapatitos.Application.Features.Contactos.Commands.CreateMensaje;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Zapatitos.API.Controllers;

[AllowAnonymous]
public class ContactoController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<long>> Create(CreateMensajeCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }
}
