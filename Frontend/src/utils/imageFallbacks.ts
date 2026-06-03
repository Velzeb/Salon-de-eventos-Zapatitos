export const getServiceImageFallback = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('catering') || n.includes('comida') || n.includes('menú') || n.includes('menu') || n.includes('pastel') || n.includes('torta') || n.includes('dulce') || n.includes('gaseosa') || n.includes('bebida') || n.includes('galleta')) {
    return "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&q=80&w=600";
  }
  if (n.includes('música') || n.includes('musica') || n.includes('sonido') || n.includes('dj') || n.includes('pantalla') || n.includes('karaoke')) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600";
  }
  if (n.includes('animación') || n.includes('animador') || n.includes('payaso') || n.includes('show') || n.includes('mago') || n.includes('títeres') || n.includes('entretenimiento')) {
    return "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=600";
  }
  if (n.includes('decoración') || n.includes('decoracion') || n.includes('globos') || n.includes('arco') || n.includes('temática') || n.includes('silla') || n.includes('mesa') || n.includes('mantel')) {
    return "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600";
  }
  if (n.includes('seguridad') || n.includes('limpieza') || n.includes('asistencia') || n.includes('vigilancia')) {
    return "https://images.unsplash.com/photo-1464347601390-25e2842a37f7?auto=format&fit=crop&q=80&w=600";
  }
  if (n.includes('foto') || n.includes('video') || n.includes('cámara') || n.includes('camara') || n.includes('recuerdo')) {
    return "https://images.unsplash.com/photo-1504194104404-4cd3c27f354b?auto=format&fit=crop&q=80&w=600";
  }
  return "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&q=80&w=600";
};

export const getPackageImageFallback = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('básico') || n.includes('basico') || n.includes('estándar') || n.includes('estandar') || n.includes('simple')) {
    return "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=800"; // animations & simple joy
  }
  if (n.includes('premium') || n.includes('lujo') || n.includes('completo') || n.includes('oro')) {
    return "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800"; // festive high-end balloons
  }
  // Default general festive kids party images
  return "https://images.unsplash.com/photo-1464347601390-25e2842a37f7?auto=format&fit=crop&q=80&w=800"; // birthday cake details
};
