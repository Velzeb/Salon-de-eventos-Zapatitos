using System.IO;
using System.Threading.Tasks;

namespace Zapatitos.Application.Common.Interfaces;

public interface IStorageService
{
    /// <summary>
    /// Sube un archivo al almacenamiento en la nube.
    /// </summary>
    /// <param name="fileStream">Flujo de datos del archivo.</param>
    /// <param name="fileName">Nombre único para el archivo.</param>
    /// <param name="contentType">Tipo MIME del archivo.</param>
    /// <returns>La URL pública del archivo subido.</returns>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>
    /// Elimina un archivo del almacenamiento.
    /// </summary>
    /// <param name="fileName">Nombre del archivo a eliminar.</param>
    Task DeleteFileAsync(string fileName);

    /// <summary>
    /// Obtiene un archivo del almacenamiento.
    /// </summary>
    /// <param name="fileName">Nombre del archivo a obtener.</param>
    /// <returns>El flujo de datos del archivo y su tipo MIME.</returns>
    Task<(Stream Stream, string ContentType)> GetFileAsync(string fileName);
}
