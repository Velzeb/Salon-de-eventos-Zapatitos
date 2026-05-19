namespace Zapatitos.Domain.Entities;

public class Nino : BaseEntity
{
    public virtual ICollection<Cliente> Responsables { get; set; } = new List<Cliente>();
    
    public string Nombre { get; set; } = null!;
    public DateTime? FechaNacimiento { get; set; }
    public string? Alergias { get; set; }
    
    // Relación con eventos donde es cumpleañero
    public virtual ICollection<Cumpleanero> ParticipacionesCumpleanos { get; set; } = new List<Cumpleanero>();
}
