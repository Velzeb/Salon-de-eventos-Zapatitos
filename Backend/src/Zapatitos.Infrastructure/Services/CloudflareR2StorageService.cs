using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using Zapatitos.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Zapatitos.Infrastructure.Services;

public class CloudflareR2StorageService : IStorageService
{
    private readonly IAmazonS3? _s3Client;
    private readonly string _bucketName;
    private readonly string _publicUrl;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly bool _useLocalFallback = false;

    public CloudflareR2StorageService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        var accessKeyId = configuration["CloudflareR2:AccessKeyId"];
        var secretAccessKey = configuration["CloudflareR2:SecretAccessKey"];
        var endpoint = configuration["CloudflareR2:Endpoint"];
        _bucketName = configuration["CloudflareR2:BucketName"] ?? "zapatitos-fotosyvideos";
        _publicUrl = configuration["CloudflareR2:PublicUrl"] ?? "";

        // Si las credenciales son placeholders o están vacías, usamos fallback local sin iniciar S3
        if (string.IsNullOrWhiteSpace(accessKeyId) || 
            accessKeyId.Contains("YOUR_") || 
            string.IsNullOrWhiteSpace(secretAccessKey) || 
            secretAccessKey.Contains("YOUR_") || 
            string.IsNullOrWhiteSpace(endpoint) || 
            endpoint.Contains("YOUR_"))
        {
            _useLocalFallback = true;
        }
        else
        {
            try
            {
                var config = new AmazonS3Config
                {
                    ServiceURL = endpoint,
                    ForcePathStyle = true
                };
                _s3Client = new AmazonS3Client(accessKeyId, secretAccessKey, config);
            }
            catch
            {
                _useLocalFallback = true;
            }
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        // Copiar primero el Stream a un MemoryStream en memoria.
        // Esto previene que el stream de entrada se consuma, cierre o se disponga si falla S3.
        using var memoryStream = new MemoryStream();
        await fileStream.CopyToAsync(memoryStream);

        if (_useLocalFallback || _s3Client == null)
        {
            memoryStream.Position = 0;
            return await UploadLocalAsync(memoryStream, fileName);
        }

        try
        {
            memoryStream.Position = 0;
            // Usar PutObjectRequest directo en lugar de TransferUtility para mayor compatibilidad con R2 (evita problemas de chunked upload)
            var putRequest = new Amazon.S3.Model.PutObjectRequest
            {
                InputStream = memoryStream,
                Key = fileName,
                BucketName = _bucketName,
                ContentType = contentType,
                DisablePayloadSigning = true // R2 requiere deshabilitar firma de payload para uploads directos sin firmas completas o https estricto
            };

            await _s3Client.PutObjectAsync(putRequest);

            // Si el PublicUrl está vacío, tiene placeholders o es el Endpoint privado de R2 API, devolvemos la URL de proxy de la API.
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = request != null 
                ? $"{request.Scheme}://{request.Host}" 
                : "http://localhost:5131";

            bool isInvalidPublicUrl = string.IsNullOrWhiteSpace(_publicUrl) || 
                                      _publicUrl.Contains("YOUR_") || 
                                      _publicUrl.Contains("cloudflarestorage.com");

            if (isInvalidPublicUrl)
            {
                return $"{baseUrl}/api/upload/media/{fileName}";
            }

            return $"{_publicUrl}/{fileName}";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"--> Error al subir a R2: {ex.Message}. Usando fallback local...");
            memoryStream.Position = 0;
            return await UploadLocalAsync(memoryStream, fileName);
        }
    }

    private async Task<string> UploadLocalAsync(Stream fileStream, string fileName)
    {
        // En windows, limpiamos los slashes para que no generen problemas de directorios
        var normalizedFileName = fileName.Replace("/", Path.DirectorySeparatorChar.ToString());
        
        // Directorio físico de destino en el servidor (wwwroot/uploads)
        var wwwrootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        
        // Si no existe, lo buscamos en el directorio del proyecto
        if (!Directory.Exists(wwwrootPath))
        {
            wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }
        
        var uploadPath = Path.Combine(wwwrootPath, "uploads");
        
        var fullPath = Path.Combine(uploadPath, normalizedFileName);
        var directory = Path.GetDirectoryName(fullPath);
        
        if (directory != null && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using (var outputStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(outputStream);
        }

        // Obtener el base url dinámicamente de HttpContext
        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = request != null 
            ? $"{request.Scheme}://{request.Host}" 
            : "http://localhost:5131"; // Default si no hay contexto

        var relativeUrlPath = fileName.Replace(Path.DirectorySeparatorChar, '/');
        return $"{baseUrl}/api/upload/media/{relativeUrlPath}";
    }

    public async Task DeleteFileAsync(string fileName)
    {
        if (_useLocalFallback || _s3Client == null)
        {
            var normalizedFileName = fileName.Replace("/", Path.DirectorySeparatorChar.ToString());
            var wwwrootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            if (!Directory.Exists(wwwrootPath))
            {
                wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }
            var fullPath = Path.Combine(wwwrootPath, "uploads", normalizedFileName);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
            return;
        }

        try
        {
            await _s3Client.DeleteObjectAsync(_bucketName, fileName);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"--> Error al eliminar de R2: {ex.Message}");
        }
    }

    public async Task<(Stream Stream, string ContentType)> GetFileAsync(string fileName)
    {
        if (_useLocalFallback || _s3Client == null)
        {
            var normalizedFileName = fileName.Replace("/", Path.DirectorySeparatorChar.ToString());
            var wwwrootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            if (!Directory.Exists(wwwrootPath))
            {
                wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }
            var fullPath = Path.Combine(wwwrootPath, "uploads", normalizedFileName);
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException("El archivo local no existe.", fullPath);
            }
            
            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
            var contentType = GetContentType(normalizedFileName);
            return (stream, contentType);
        }

        try
        {
            var getRequest = new Amazon.S3.Model.GetObjectRequest
            {
                BucketName = _bucketName,
                Key = fileName
            };

            var response = await _s3Client.GetObjectAsync(getRequest);
            return (response.ResponseStream, response.Headers.ContentType);
        }
        catch (Exception ex)
        {
            throw new FileNotFoundException($"No se pudo obtener el archivo de R2: {ex.Message}");
        }
    }

    private string GetContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            _ => "application/octet-stream"
        };
    }
}
