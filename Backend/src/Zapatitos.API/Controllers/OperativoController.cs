using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace Zapatitos.API.Controllers;

[Authorize] // Requiere estar logueado
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
            return NotFound(new { 
                Error = "EVENT_NOT_FOUND", 
                Details = result.Errors,
                IdBuscado = id 
            });
        }

        return Ok(result.Value);
    }

    [HttpPost("consumo-extra")]
    [Authorize(Roles = "Administrador,Empleado")] // Solo staff o admin
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

    [HttpDelete("{eventoId}/multimedia/{multimediaId}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult> DeleteMultimedia(long eventoId, long multimediaId)
    {
        var result = await Mediator.Send(new Zapatitos.Application.Features.Operativo.Commands.DeleteMultimedia.DeleteMultimediaCommand(multimediaId));
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }
}
