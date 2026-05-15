using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Finanzas.Commands.RegisterPago;
using Zapatitos.Application.Features.Finanzas.Commands.AddGasto;
using Zapatitos.Application.Features.Finanzas.Queries.GetCategoriasFinancieras;
using Zapatitos.Application.Features.Finanzas.Queries.GetCuentasPendientes;
using Zapatitos.Application.Features.Finanzas.Queries.GetGastos;
using Zapatitos.Application.Features.Finanzas.Queries.GetMetodosPago;
using Zapatitos.Application.Features.Finanzas.Queries.GetPagos;
using Zapatitos.Application.Features.Finanzas.Queries.GetCalculoNomina;
using Zapatitos.Application.Features.Finanzas.Queries.GetReporteRentabilidad;
using Zapatitos.Application.Features.Finanzas.Commands.AddPagoNomina;
using Zapatitos.Application.Features.Finanzas.Commands.VerifyPago;

namespace Zapatitos.API.Controllers;

[Authorize(Roles = "Administrador")] // Solo el dueño/admin ve esto
public class FinanzasController : ApiControllerBase
{
    [HttpGet("pagos")]
    public async Task<ActionResult<IEnumerable<PagoDto>>> GetPagos()
    {
        var result = await Mediator.Send(new GetPagosQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("gastos")]
    public async Task<ActionResult<IEnumerable<GastoDto>>> GetGastos()
    {
        var result = await Mediator.Send(new GetGastosQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("categorias")]
    public async Task<ActionResult<IEnumerable<CategoriaFinancieraDto>>> GetCategorias()
    {
        var result = await Mediator.Send(new GetCategoriasFinancierasQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("metodos-pago")]
    public async Task<ActionResult<IEnumerable<MetodoPagoDto>>> GetMetodosPago()
    {
        var result = await Mediator.Send(new GetMetodosPagoQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("cuentas-pendientes")]
    public async Task<ActionResult<IEnumerable<CuentaPendienteDto>>> GetCuentasPendientes()
    {
        var result = await Mediator.Send(new GetCuentasPendientesQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("pagos")]
    public async Task<ActionResult<long>> RegisterPago(RegisterPagoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("pagos/{id}/verify")]
    public async Task<ActionResult<long>> VerifyPago(long id, [FromBody] VerifyPagoRequest request)
    {
        var result = await Mediator.Send(new VerifyPagoCommand(id, request.IsAccepted));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("gastos")]
    public async Task<ActionResult<long>> AddGasto(AddGastoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("nominas/pendientes")]
    public async Task<ActionResult<IEnumerable<NominaEmpleadoDto>>> GetNominasPendientes()
    {
        var result = await Mediator.Send(new GetCalculoNominaQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("nominas/pagar")]
    public async Task<ActionResult<long>> PagarNomina(AddPagoNominaCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpGet("reporte-rentabilidad")]
    public async Task<ActionResult<RentabilidadDto>> GetReporteRentabilidad()
    {
        var result = await Mediator.Send(new GetReporteRentabilidadQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }
}

public class VerifyPagoRequest
{
    public bool IsAccepted { get; set; }
}
