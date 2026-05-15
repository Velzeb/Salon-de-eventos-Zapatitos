using MediatR;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;
using Zapatitos.Application.Common.Models;
using Zapatitos.Domain.Entities;

namespace Zapatitos.Application.Features.Operativo.Commands.UploadMultimedia;

public record UploadMultimediaCommand : IRequest<Result<string>>
{
    public long EventoId { get; init; }
    public Stream FileStream { get; init; } = null!;
    public string FileName { get; init; } = null!;
    public string ContentType { get; init; } = null!;
}

public class UploadMultimediaCommandHandler : IRequestHandler<UploadMultimediaCommand, Result<string>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStorageService _storageService;

    public UploadMultimediaCommandHandler(IUnitOfWork unitOfWork, IStorageService storageService)
    {
        _unitOfWork = unitOfWork;
        _storageService = storageService;
    }

    public async Task<Result<string>> Handle(UploadMultimediaCommand request, CancellationToken cancellationToken)
    {
        var evento = await _unitOfWork.Repository<Evento>().GetByIdAsync(request.EventoId);
        if (evento == null) return Result<string>.Failure("Evento no encontrado.");

        // Generar nombre único para evitar colisiones en R2
        var uniqueFileName = $"eventos/{request.EventoId}/{Guid.NewGuid()}_{request.FileName}";

        // Subir a Cloudflare R2
        var url = await _storageService.UploadFileAsync(request.FileStream, uniqueFileName, request.ContentType);

        // Determinar tipo
        var tipo = request.ContentType.StartsWith("video") ? "Video" : "Imagen";

        // Registrar en Base de Datos
        var multimedia = new MultimediaEvento
        {
            EventoId = request.EventoId,
            Url = url,
            NombreArchivo = request.FileName,
            TipoArchivo = tipo,
            FechaSubida = DateTime.UtcNow
        };

        await _unitOfWork.Repository<MultimediaEvento>().AddAsync(multimedia);
        await _unitOfWork.SaveChangesAsync();

        return Result<string>.Success(url);
    }
}
