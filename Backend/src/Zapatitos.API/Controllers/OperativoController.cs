using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using Zapatitos.Application.Features.Operativo.Commands.AddConsumo;
using Zapatitos.Application.Features.Operativo.Commands.CompleteTarea;
using Zapatitos.Application.Features.Operativo.Commands.UpdateBriefing;
using Zapatitos.Application.Features.Operativo.Commands.UpdateCronograma;
using Zapatitos.Application.Features.Operativo.Commands.Invitados;
using Zapatitos.Application.Features.Operativo.Queries.GetEventoOperativo;
using Zapatitos.Application.Features.Operativo.Commands.UpdatePostEvento;
using Zapatitos.Application.Features.Operativo.Commands.UploadMultimedia;
using Zapatitos.Application.Features.Operativo.Commands.FinalizarEvento;
using Zapatitos.Application.Features.Operativo.Commands.GestionTareas;
using Zapatitos.Application.Features.Operativo.Commands.GestionPlantillas;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace Zapatitos.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class OperativoController : ApiControllerBase
{
    [HttpPost("post-evento")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdatePostEvento(UpdatePostEventoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("{id:long}/finalizar")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> FinalizarEvento(long id)
    {
        var result = await Mediator.Send(new FinalizarEventoCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<EventoOperativoDto>> GetEventoById(long id)
    {
        var result = await Mediator.Send(new GetEventoOperativoQuery(id));

        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Contains("no existe") || e.Contains("not found")))
            {
                return NotFound(new { 
                    Error = "EVENT_NOT_FOUND", 
                    Details = result.Errors,
                    IdBuscado = id 
                });
            }
            
            return StatusCode(500, new {
                Error = "INTERNAL_SERVER_ERROR",
                Details = result.Errors
            });
        }

        return Ok(result.Value);
    }

    [HttpPost("consumo-extra")]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<long>> AddConsumo(AddConsumoExtraCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPatch("tareas/{id}/completar")]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult> CompleteTarea(long id)
    {
        var result = await Mediator.Send(new CompleteTareaCommand(id));
        if (!result.Succeeded)
            return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("tareas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<long>> CreateTarea(CreateTareaCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("tareas/{id:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateTarea(long id, [FromBody] UpdateTareaRequest request)
    {
        var result = await Mediator.Send(new UpdateTareaCommand(
            id, request.NombreTarea, request.Descripcion, request.ArticuloInventarioId, request.CantidadRequerida));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpDelete("tareas/{id:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> DeleteTarea(long id)
    {
        var result = await Mediator.Send(new DeleteTareaCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    public class UpdateTareaRequest
    {
        public string NombreTarea { get; set; } = null!;
        public string? Descripcion { get; set; }
        public long? ArticuloInventarioId { get; set; }
        public int CantidadRequerida { get; set; }
    }

    public class UpdateNotasRequest
    {
        public string Notas { get; set; } = null!;
    }

    [HttpPatch("{eventoId}/notas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateNotas(long eventoId, [FromBody] UpdateNotasRequest request)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.UpdateNotasAdmin.UpdateNotasAdminCommand(eventoId, request.Notas));
        if (!result.Succeeded)
            return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("assign-staff")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<long>> AssignStaff(Zapatitos.Application.Features.Operativo.Commands.AddStaff.AddStaffToEventoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpDelete("staff/{id:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> RemoveStaff(long id)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.RemoveStaff.RemoveStaffFromEventoCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("assign-tarea")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> AssignTarea(Zapatitos.Application.Features.Operativo.Commands.AssignTarea.AssignTareaCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("briefing")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateBriefing(UpdateBriefingEventoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPut("cronograma")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdateCronograma(UpdateCronogramaCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("invitados")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> AddInvitados(AddInvitadosCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPost("invitados/registrar-ingreso")]
    [Authorize(Roles = "Administrador,Empleado")]
    public async Task<ActionResult<string>> RegistrarIngreso(RegistrarIngresoInvitadoCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(new { Mensaje = result.Value });
    }

    [HttpPost("{eventoId}/multimedia")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<List<string>>> UploadMultimedia(long eventoId, IFormFileCollection files)
    {
        if (files == null || files.Count == 0) return BadRequest("No se proporcionaron archivos.");

        var urls = new List<string>();
        foreach (var file in files)
        {
            using var stream = file.OpenReadStream();
            var command = new UploadMultimediaCommand
            {
                EventoId = eventoId,
                FileStream = stream,
                FileName = file.FileName,
                ContentType = file.ContentType
            };

            var result = await Mediator.Send(command);
            if (result.Succeeded) urls.Add(result.Value!);
        }

        return Ok(urls);
    }

    [HttpPost("{eventoId}/items")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<long>> AddServicio(long eventoId, [FromBody] AddServicioRequest request)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GestionItems.AddServicioToEventoCommand(
            eventoId, request.ServicioId, request.Cantidad));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpDelete("{eventoId}/items/{itemId}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> RemoveItem(long eventoId, long itemId)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.GestionItems.RemoveItemFromEventoCommand(
            eventoId, itemId));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    public class AddServicioRequest
    {
        public long ServicioId { get; set; }
        public int Cantidad { get; set; }
    }

    // ──────────────────────────────────────────────────────────────────
    //  PLANTILLAS DE TAREAS GENERALES
    // ──────────────────────────────────────────────────────────────────

    [HttpGet("plantillas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<List<TareaPlantillaDto>>> GetPlantillas()
    {
        var result = await Mediator.Send(new GetTareasPlantillaQuery());
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPost("plantillas")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<TareaPlantillaDto>> CreatePlantilla([FromBody] CreateTareaPlantillaCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return Ok(result.Value);
    }

    [HttpPut("plantillas/{id:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> UpdatePlantilla(long id, [FromBody] UpdateTareaPlantillaCommand command)
    {
        var cmd = command with { Id = id };
        var result = await Mediator.Send(cmd);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPatch("plantillas/{id:long}/reorder/{direccion}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> ReorderPlantilla(long id, string direccion)
    {
        var result = await Mediator.Send(new ReorderTareaPlantillaCommand(id, direccion));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpDelete("plantillas/{id:long}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> DeletePlantilla(long id)
    {
        var result = await Mediator.Send(new DeleteTareaPlantillaCommand(id));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
