using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Zapatitos.Application.Common.Interfaces;

namespace Zapatitos.API.Controllers;

public class UploadController : ApiControllerBase
{
    private readonly IStorageService _storageService;

    public UploadController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    [HttpPost]
    [Route("imagen")]
    public async Task<IActionResult> UploadImagen(IFormFile file, [FromQuery] string folder = "catalogo")
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var extension = System.IO.Path.GetExtension(file.FileName);
        var uniqueFileName = $"{folder}/{Guid.NewGuid()}{extension}";

        using var stream = file.OpenReadStream();
        var url = await _storageService.UploadFileAsync(stream, uniqueFileName, file.ContentType);

        return Ok(new { Url = url });
    }

    [HttpGet]
    [Route("media/{*path}")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public async Task<IActionResult> GetMedia(string path)
    {
        if (string.IsNullOrEmpty(path))
            return BadRequest("El path es requerido.");

        try
        {
            var (stream, contentType) = await _storageService.GetFileAsync(path);
            return File(stream, contentType);
        }
        catch (System.IO.FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al obtener el archivo: {ex.Message}");
        }
    }
}
