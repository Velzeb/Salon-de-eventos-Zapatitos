using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Finanzas.Commands.AddPagoNomina;

public record AddPagoNominaCommand(long EmpleadoId) : IRequest<Result<long>>;

public class AddPagoNominaCommandHandler : IRequestHandler<AddPagoNominaCommand, Result<long>>
{
    private readonly IUnitOfWork _unitOfWork;

    public AddPagoNominaCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<long>> Handle(AddPagoNominaCommand request, CancellationToken cancellationToken)
    {
        var empleado = await _unitOfWork.Repository<Empleado>().GetByIdAsync(request.EmpleadoId);
        if (empleado == null) return Result<long>.Failure("Empleado no encontrado.");

        var asignaciones = await _unitOfWork.Repository<AsignacionStaff>().Query()
            .Include(a => a.Evento)
            .Where(a => a.EmpleadoId == request.EmpleadoId && !a.EsPagado && a.Evento.Estado == Zapatitos.Domain.Enums.EstadoEvento.Completado)
            .ToListAsync(cancellationToken);

        if (!asignaciones.Any()) return Result<long>.Failure("No hay eventos pendientes de pago para este empleado.");

        decimal totalAPagar = asignaciones.Count * empleado.PagoPorEvento;

        var pago = new PagoNomina
        {
            EmpleadoId = request.EmpleadoId,
            Monto = totalAPagar,
            FechaPago = DateTime.UtcNow,
            Periodo = $"Pago de {asignaciones.Count} eventos hasta {DateTime.UtcNow:dd/MM/yyyy}"
        };

        await _unitOfWork.Repository<PagoNomina>().AddAsync(pago);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Actualizar asignaciones
        foreach (var asig in asignaciones)
        {
            asig.EsPagado = true;
            asig.PagoNominaId = pago.Id;
            _unitOfWork.Repository<AsignacionStaff>().Update(asig);
        }

        // Crear Movimiento de Caja (Egreso)
        var movimiento = new MovimientoCaja
        {
            Tipo = TipoTransaccion.Egreso,
            Monto = totalAPagar,
            Concepto = $"Pago Nómina - {empleado.NombreCompleto} ({asignaciones.Count} eventos)",
            Fecha = DateTime.UtcNow,
            ReferenciaId = pago.Id
        };
        await _unitOfWork.Repository<MovimientoCaja>().AddAsync(movimiento);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<long>.Success(pago.Id);
    }
}
