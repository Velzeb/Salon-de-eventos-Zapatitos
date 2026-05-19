using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zapatitos.Application.Features.Dashboard.Queries.GetStats;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador")]
public class DashboardController : ApiControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        return await Mediator.Send(new GetDashboardStatsQuery());
    }
}
