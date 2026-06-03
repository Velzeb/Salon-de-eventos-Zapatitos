using MediatR;
using Microsoft.EntityFrameworkCore;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Operativo.Commands.GestionPlantillas;

// ─────────────────────────────────────────────────────────────────
//  DTOs compartidos
// ─────────────────────────────────────────────────────────────────

public class TareaPlantillaDto
{
    public long Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string FaseAplicacion { get; set; } = null!;
    public int Orden { get; set; }
    public bool Activa { get; set; }
}

// ─────────────────────────────────────────────────────────────────
//  GET ALL
// ─────────────────────────────────────────────────────────────────

public record GetTareasPlantillaQuery : IRequest<Result<List<TareaPlantillaDto>>>;

public class GetTareasPlantillaQueryHandler : IRequestHandler<GetTareasPlantillaQuery, Result<List<TareaPlantillaDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    public GetTareasPlantillaQueryHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<List<TareaPlantillaDto>>> Handle(GetTareasPlantillaQuery request, CancellationToken cancellationToken)
    {
        var lista = await _unitOfWork.Repository<TareaPlantilla>()
            .Query()
            .OrderBy(t => t.FaseAplicacion)
            .ThenBy(t => t.Orden)
            .ThenBy(t => t.Id)
            .Select(t => new TareaPlantillaDto
            {
                Id = t.Id,
                Nombre = t.Nombre,
                Descripcion = t.Descripcion,
                FaseAplicacion = t.FaseAplicacion.ToString(),
                Orden = t.Orden,
                Activa = t.Activa
            })
            .ToListAsync(cancellationToken);

        return Result<List<TareaPlantillaDto>>.Success(lista);
    }
}

// ─────────────────────────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────────────────────────

public record CreateTareaPlantillaCommand(
    string Nombre,
    string? Descripcion,
    string FaseAplicacion
) : IRequest<Result<TareaPlantillaDto>>;

public class CreateTareaPlantillaCommandHandler : IRequestHandler<CreateTareaPlantillaCommand, Result<TareaPlantillaDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    public CreateTareaPlantillaCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<TareaPlantillaDto>> Handle(CreateTareaPlantillaCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<FasePlantilla>(request.FaseAplicacion, true, out var fase))
            return Result<TareaPlantillaDto>.Failure($"Fase inválida: {request.FaseAplicacion}. Use 'Preparacion' o 'EnVivo'.");

        // Asignar orden al final de la fase
        var maxOrden = await _unitOfWork.Repository<TareaPlantilla>()
            .Query()
            .Where(t => t.FaseAplicacion == fase)
            .Select(t => (int?)t.Orden)
            .MaxAsync(cancellationToken) ?? 0;

        var plantilla = new TareaPlantilla
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            FaseAplicacion = fase,
            Orden = maxOrden + 10,
            Activa = true
        };

        await _unitOfWork.Repository<TareaPlantilla>().AddAsync(plantilla);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<TareaPlantillaDto>.Success(new TareaPlantillaDto
        {
            Id = plantilla.Id,
            Nombre = plantilla.Nombre,
            Descripcion = plantilla.Descripcion,
            FaseAplicacion = plantilla.FaseAplicacion.ToString(),
            Orden = plantilla.Orden,
            Activa = plantilla.Activa
        });
    }
}

// ─────────────────────────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────────────────────────

public record UpdateTareaPlantillaCommand(
    long Id,
    string Nombre,
    string? Descripcion,
    string FaseAplicacion,
    bool Activa
) : IRequest<Result<bool>>;

public class UpdateTareaPlantillaCommandHandler : IRequestHandler<UpdateTareaPlantillaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public UpdateTareaPlantillaCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(UpdateTareaPlantillaCommand request, CancellationToken cancellationToken)
    {
        var plantilla = await _unitOfWork.Repository<TareaPlantilla>().GetByIdAsync(request.Id);
        if (plantilla == null) return Result<bool>.Failure("Plantilla no encontrada.");

        if (!Enum.TryParse<FasePlantilla>(request.FaseAplicacion, true, out var fase))
            return Result<bool>.Failure($"Fase inválida: {request.FaseAplicacion}.");

        plantilla.Nombre = request.Nombre.Trim();
        plantilla.Descripcion = request.Descripcion?.Trim();
        plantilla.FaseAplicacion = fase;
        plantilla.Activa = request.Activa;

        _unitOfWork.Repository<TareaPlantilla>().Update(plantilla);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}

// ─────────────────────────────────────────────────────────────────
//  REORDER (mover arriba / abajo)
// ─────────────────────────────────────────────────────────────────

public record ReorderTareaPlantillaCommand(long Id, string Direccion) : IRequest<Result<bool>>;

public class ReorderTareaPlantillaCommandHandler : IRequestHandler<ReorderTareaPlantillaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public ReorderTareaPlantillaCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(ReorderTareaPlantillaCommand request, CancellationToken cancellationToken)
    {
        var actual = await _unitOfWork.Repository<TareaPlantilla>().GetByIdAsync(request.Id);
        if (actual == null) return Result<bool>.Failure("Plantilla no encontrada.");

        var hermanas = await _unitOfWork.Repository<TareaPlantilla>()
            .Query()
            .Where(t => t.FaseAplicacion == actual.FaseAplicacion)
            .OrderBy(t => t.Orden)
            .ToListAsync(cancellationToken);

        // Re-normalizar órdenes consecutivos
        for (int i = 0; i < hermanas.Count; i++)
        {
            hermanas[i].Orden = (i + 1) * 10;
            _unitOfWork.Repository<TareaPlantilla>().Update(hermanas[i]);
        }

        var idx = hermanas.FindIndex(t => t.Id == actual.Id);
        if (request.Direccion == "up" && idx > 0)
        {
            (hermanas[idx].Orden, hermanas[idx - 1].Orden) = (hermanas[idx - 1].Orden, hermanas[idx].Orden);
        }
        else if (request.Direccion == "down" && idx < hermanas.Count - 1)
        {
            (hermanas[idx].Orden, hermanas[idx + 1].Orden) = (hermanas[idx + 1].Orden, hermanas[idx].Orden);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}

// ─────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────

public record DeleteTareaPlantillaCommand(long Id) : IRequest<Result<bool>>;

public class DeleteTareaPlantillaCommandHandler : IRequestHandler<DeleteTareaPlantillaCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    public DeleteTareaPlantillaCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(DeleteTareaPlantillaCommand request, CancellationToken cancellationToken)
    {
        var plantilla = await _unitOfWork.Repository<TareaPlantilla>().GetByIdAsync(request.Id);
        if (plantilla == null) return Result<bool>.Failure("Plantilla no encontrada.");

        _unitOfWork.Repository<TareaPlantilla>().Delete(plantilla);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
