using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Identity.Commands.Login;
using Zapatitos.Application.Features.Identity.Commands.Register;
using Zapatitos.Application.Features.Identity.Commands.RegisterStaff;
using Microsoft.AspNetCore.Authorization;

namespace Zapatitos.API.Controllers;

public class AuthController : ApiControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<string>> Login(LoginCommand command)
    {
        var result = await Mediator.Send(command);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { Token = result.Value });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<long>> Register(RegisterCommand command)
    {
        var result = await Mediator.Send(command);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(result.Value);
    }

    [HttpPost("staff/register")]
    [Authorize(Roles = "Administrador")] // Solo el Admin puede registrar staff
    public async Task<ActionResult<long>> RegisterStaff(RegisterStaffCommand command)
    {
        var result = await Mediator.Send(command);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(result.Value);
    }
}
