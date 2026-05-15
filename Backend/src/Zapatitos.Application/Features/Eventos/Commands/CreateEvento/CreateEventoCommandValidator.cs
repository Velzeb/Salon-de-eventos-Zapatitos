using FluentValidation;
using System;
using Zapatitos.Domain.Enums;

namespace Zapatitos.Application.Features.Eventos.Commands.CreateEvento;

public class CreateEventoCommandValidator : AbstractValidator<CreateEventoCommand>
{
    public CreateEventoCommandValidator()
    {
        RuleFor(v => v.ClienteIds)
            .NotEmpty()
            .When(v => !v.UsuarioId.HasValue)
            .WithMessage("Debe seleccionar al menos un cliente responsable.");

        RuleFor(v => v.Cumpleaneros)
            .NotEmpty().WithMessage("Debe registrar al menos un cumpleañero.");

        RuleForEach(v => v.Cumpleaneros).ChildRules(c => {
            c.RuleFor(x => x.NinoId).Must(id => id >= 0).WithMessage("ID de niño inválido.");
            c.RuleFor(x => x.Edad).GreaterThanOrEqualTo(0).WithMessage("La edad debe ser 0 o mayor.");
        });

        RuleFor(v => v.FechaEvento)
            .NotEmpty()
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("La fecha del evento no puede ser en el pasado.");

        RuleFor(v => v.HoraInicio)
            .NotEmpty();

        RuleFor(v => v.HoraFin)
            .NotEmpty()
            .Must((model, horaFin) => horaFin > model.HoraInicio)
            .WithMessage("La hora de finalización debe ser posterior a la de inicio.");

        RuleFor(v => v.CantidadNinosEstimada)
            .GreaterThan(0).WithMessage("La cantidad de niños debe ser mayor a cero.");

        RuleFor(v => v.PagoInicial)
            .Must((model, pago) => {
                if (model.Origen == OrigenEvento.Online) {
                    return pago >= (model.PrecioTotal * 0.3m);
                }
                return true;
            })
            .WithMessage("Para reservas online, el pago inicial debe ser al menos el 30% del total.");
    }
}
