using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using Zapatitos.Application.Common.Interfaces;
using System.IO;
using System.Threading.Tasks;

namespace Zapatitos.Infrastructure.Services;

public class CloudflareR2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _publicUrl;

    public CloudflareR2StorageService(IConfiguration configuration)
    {
        var accessKeyId = configuration["CloudflareR2:AccessKeyId"];
        var secretAccessKey = configuration["CloudflareR2:SecretAccessKey"];
        var endpoint = configuration["CloudflareR2:Endpoint"];
        _bucketName = configuration["CloudflareR2:BucketName"] ?? "zapatitos-fotosyvideos";
        _publicUrl = configuration["CloudflareR2:PublicUrl"] ?? "";

        var config = new AmazonS3Config
        {
            ServiceURL = endpoint,
            ForcePathStyle = true // R2 requiere Path Style
        };

        _s3Client = new AmazonS3Client(accessKeyId, secretAccessKey, config);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var fileTransferUtility = new TransferUtility(_s3Client);

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = fileName,
            BucketName = _bucketName,
            ContentType = contentType
            // R2 no soporta ACLs tradicionales de S3 usualmente, se maneja por políticas de bucket
        };

        await fileTransferUtility.UploadAsync(uploadRequest);

        // Retornar la URL pública (ajustada según la configuración de R2)
        return $"{_publicUrl}/{fileName}";
    }

    public async Task DeleteFileAsync(string fileName)
    {
        await _s3Client.DeleteObjectAsync(_bucketName, fileName);
    }
}
