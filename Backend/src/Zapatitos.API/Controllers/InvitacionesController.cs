using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Eventos.Queries.GetInvitacion;

namespace Zapatitos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitacionesController : ApiControllerBase
{
    [HttpGet("{token}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<ActionResult<InvitacionDto>> GetByToken(Guid token)
    {
        var result = await Mediator.Send(new GetInvitacionQuery(token));

        if (!result.Succeeded)
            return NotFound(result.Errors);

        return Ok(result.Value);
    }
}
