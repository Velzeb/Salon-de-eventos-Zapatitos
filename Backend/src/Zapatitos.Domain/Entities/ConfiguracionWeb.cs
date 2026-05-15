namespace Zapatitos.Domain.Entities;

public class ConfiguracionWeb : BaseEntity
{
    public string Clave { get; set; } = null!; // Ej: "LandingPage", "ContactInfo"
    public string Valor { get; set; } = null!; // Almacenado como JSON
    public string? Descripcion { get; set; }
}
