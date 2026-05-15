using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Dashboard.Queries.GetStats;

namespace Zapatitos.API.Controllers;

[Authorize] // Debe estar logueado para ver estadísticas
public class DashboardController : ApiControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats([FromQuery] string periodo = "Semana")
    {
        var result = await Mediator.Send(new GetStatsQuery(periodo));
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(result.Value);
    }
}
