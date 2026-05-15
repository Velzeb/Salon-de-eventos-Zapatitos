using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Clientes.Commands.CreateNino;

namespace Zapatitos.API.Controllers;

[Authorize]
public class NinosController : ApiControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<long>> Create(CreateNinoCommand command)
    {
        var result = await Mediator.Send(command);
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);
            
        return Ok(result.Value);
    }
}
