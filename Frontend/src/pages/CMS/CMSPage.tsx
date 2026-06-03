import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { 
  Layout, 
  Image as ImageIcon, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  RefreshCw,
  Megaphone,
  Monitor,
  QrCode,
  Sparkles,
  Layers,
  Users,
  Star,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import { configService, type ConfigEntry } from '../../services/configService';
import { paquetesService } from '../../services/paquetesService';
import { isGoogleMapsEmbedUrl, normalizeGoogleMapsEmbedUrl } from '../../utils/googleMaps';

const defaultPastEvents = [
  {
    title: "El Cumpleaños Mágico de Sofía (5 años)",
    image: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200",
    comment: "El show de magia y animación fue alucinante, ¡los niños no pararon de reír en toda la tarde! Una organización impecable.",
    author: "Mamá Lucía",
    tag: "Show de Magia 🪄"
  },
  {
    title: "La Aventura Temática de Mateo (6 años)",
    image: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=1200",
    comment: "Toda la decoración temática de dinosaurios y los juegos interactivos de búsqueda de fósiles fueron geniales. ¡Súper recomendado!",
    author: "Papá Diego",
    tag: "Juegos Interactivos 🦖"
  },
  {
    title: "La Fiesta Neon Glitter de Valentina (8 años)",
    image: "https://images.unsplash.com/photo-1519222970733-f546218fa6d7?auto=format&fit=crop&q=80&w=1200",
    comment: "El área de maquillaje de caritas y brillo fue el éxito total para las niñas. El catering infantil estuvo riquísimo y muy fresco.",
    author: "Mamá Carolina",
    tag: "Taller de Glitter ✨"
  },
  {
    title: "El Safari Cumple de Thiago (4 años)",
    image: "https://images.unsplash.com/photo-1544027750-47db62c85958?auto=format&fit=crop&q=80&w=1200",
    comment: "Las instalaciones climatizadas y el personal cuidando y coordinando los juegos nos dio total tranquilidad a los padres.",
    author: "Mamá Romina",
    tag: "Safari Park 🦁"
  }
];

const defaultEmployees = [
  { name: "Lucía Fernández", role: "Coordinadora de Eventos", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Tío Mateo", role: "Mago & Animador Líder", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Sofía Gómez", role: "Chef Infantil & Repostería", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400", desc: "" },
  { name: "Carlos Ruiz", role: "Encargado de Sonido & Luces", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400", desc: "" }
];

const defaultValues = [
  { 
    icon: "ShieldCheck", 
    title: "Seguridad y Cuidado", 
    desc: "Nuestras instalaciones están completamente equipadas con sistemas de seguridad y zonas acolchadas. Todo nuestro personal cuenta con certificación en asistencia infantil.", 
    color: "#10b981" 
  },
  { 
    icon: "Heart", 
    title: "Diversión y Creatividad", 
    desc: "Desarrollamos shows, títeres y talleres temáticos dinámicos que estimulan la imaginación de los pequeños, alejándolos de las pantallas por unas horas de pura alegría.", 
    color: "#ff5e7e" 
  },
  { 
    icon: "Users", 
    title: "Tranquilidad para los Padres", 
    desc: "Nos encargamos de todo: invitaciones digitales, catering premium, limpieza antes y después de la fiesta. Tu única tarea es relajarte y tomar fotos divertidas.", 
    color: "#fbbf24" 
  }
];

const defaultGallery = [
  { img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600", desc: "Nuestro amplio salón principal decorado para un cumpleaños mágico." },
  { img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=600", desc: "Zonas de juego seguras y equipadas para niños de todas las edades." },
  { img: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=600", desc: "Detalles en globos y temáticas personalizadas para cada cumpleañero." }
];

const defaultTestimonials = [
  { name: "María García", role: "Madre de cumpleañero", text: "El mejor salón de la ciudad. La atención al detalle hicieron que el cumple de mi hija fuera mágico.", rating: 5, avatar: "" },
  { name: "Roberto Soto", role: "Padre de familia", text: "Excelente servicio y organización. No tuvimos que preocuparnos por nada, el equipo de Zapatitos se encargó de todo.", rating: 5, avatar: "" },
  { name: "Elena Martínez", role: "Organizadora de eventos", text: "Como profesional, valoro mucho la calidad de las instalaciones. Zapatitos ofrece un estándar superior en todo.", rating: 5, avatar: "" }
];

const defaultFaqs = [
  { q: "¿Con cuánta anticipación debo reservar?", a: "Recomendamos reservar con al menos 2 a 3 meses de anticipación, especialmente para fines de semana." },
  { q: "¿Qué incluye el paquete básico?", a: "Nuestro paquete básico incluye el uso del salón por 3 horas, decoración base, invitaciones digitales y personal de asistencia." },
  { q: "¿Puedo llevar mi propio catering?", a: "Sí, permitimos catering externo previo acuerdo, aunque contamos con opciones gastronómicas premium propias." },
  { q: "¿Tienen estacionamiento propio?", a: "Contamos con un área de estacionamiento vigilada con capacidad para 20 vehículos." }
];

const defaultWhatsAppTemplate = [
  'Hola, quiero consultar sobre un evento infantil.',
  'Nombre: {nombre}',
  'Teléfono: {telefono}',
  'Fecha tentativa: {fecha}',
  'Invitados: {invitados}',
  'Paquete de interés: {paquete}',
  'Mensaje: {mensaje}'
].join('\n');

const defaultSalonFeatures = [
  'Área de Juegos Interactivos',
  'Salón Climatizado de Alta Capacidad',
  'Sonido e Iluminación Profesional',
  'Personal de Seguridad y Monitoreo'
];

const defaultSalonImages = [
  { label: 'Salón Climatizado', src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1470' },
  { label: 'Zona de Juegos', src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1469' },
  { label: 'Globos y Temáticas', src: 'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&q=80&w=1469' }
];

const onlyDigits = (value?: string) => value?.replace(/\D/g, '') || '';
const isValidPhone = (value?: string) => !value || onlyDigits(value).length >= 8;
const isValidEmail = (value?: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidSocialValue = (value?: string) => {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed.startsWith('http') || /^@?[a-zA-Z0-9._-]{2,}$/.test(trimmed);
};

const parseJsonArray = <T,>(value: string | undefined, fallback: T[]) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const applyTemplatePreview = (template: string) =>
  template
    .replaceAll('{nombre}', 'María López')
    .replaceAll('{telefono}', '+591 70000000')
    .replaceAll('{fecha}', '2026-07-18')
    .replaceAll('{invitados}', '40')
    .replaceAll('{paquete}', 'Paquete Premium')
    .replaceAll('{email}', 'maria@email.com')
    .replaceAll('{asunto}', 'Presupuesto para Evento')
    .replaceAll('{mensaje}', 'Quisiera una fiesta temática con show y decoración.');

const imageFileToDataUrl = (file: File, maxWidth = 1600, quality = 0.82) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar la imagen.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const FieldHint = ({ valid, children }: { valid: boolean; children: ReactNode }) => (
  <p className={`text-[10px] font-bold ${valid ? 'text-emerald-600' : 'text-red-500'}`}>
    {children}
  </p>
);

const CMSPage = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [coreValues, setCoreValues] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editingEmpIndex, setEditingEmpIndex] = useState<number | null>(null);
  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(null);
  const [editingGalIndex, setEditingGalIndex] = useState<number | null>(null);
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'sobre_nosotros' | 'paquetes' | 'fiestas' | 'testimonios' | 'faqs' | 'contacto' | 'pagos'>('general');
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  // Synchronize pastEvents state whenever configs.past_events_json loads
  useEffect(() => {
    if (configs.past_events_json) {
      try {
        setPastEvents(JSON.parse(configs.past_events_json));
      } catch (e) {
        setPastEvents(defaultPastEvents);
      }
    } else {
      setPastEvents(defaultPastEvents);
    }
  }, [configs.past_events_json]);

  // Synchronize employees state whenever configs.about_us_employees_json loads
  useEffect(() => {
    if (configs.about_us_employees_json) {
      try {
        setEmployees(JSON.parse(configs.about_us_employees_json));
      } catch (e) {
        setEmployees(defaultEmployees);
      }
    } else {
      setEmployees(defaultEmployees);
    }
  }, [configs.about_us_employees_json]);

  // Synchronize coreValues state whenever configs.about_us_values_json loads
  useEffect(() => {
    if (configs.about_us_values_json) {
      try {
        setCoreValues(JSON.parse(configs.about_us_values_json));
      } catch (e) {
        setCoreValues(defaultValues);
      }
    } else {
      setCoreValues(defaultValues);
    }
  }, [configs.about_us_values_json]);

  // Synchronize gallery state whenever configs.about_us_gallery_json loads
  useEffect(() => {
    if (configs.about_us_gallery_json) {
      try {
        setGallery(JSON.parse(configs.about_us_gallery_json));
      } catch (e) {
        setGallery(defaultGallery);
      }
    } else {
      setGallery(defaultGallery);
    }
  }, [configs.about_us_gallery_json]);

  // Synchronize testimonials
  useEffect(() => {
    if (configs.testimonials_json) {
      try { setTestimonials(JSON.parse(configs.testimonials_json)); }
      catch { setTestimonials(defaultTestimonials); }
    } else {
      setTestimonials(defaultTestimonials);
    }
  }, [configs.testimonials_json]);

  // Synchronize FAQs
  useEffect(() => {
    if (configs.faqs_json) {
      try { setFaqs(JSON.parse(configs.faqs_json)); }
      catch { setFaqs(defaultFaqs); }
    } else {
      setFaqs(defaultFaqs);
    }
  }, [configs.faqs_json]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [data, pkgs] = await Promise.all([
        configService.getLandingConfig(),
        paquetesService.getPaquetes().catch(() => [])
      ]);

      const configMap: Record<string, string> = {};
      data.forEach(item => {
        configMap[item.clave] = item.valor;
      });
      setConfigs(configMap);
      setPaquetes(pkgs);
    } catch (err) {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (clave: string, valor: string) => {
    setConfigs(prev => ({ ...prev, [clave]: valor }));
  };

  const handleMapsEmbedChange = (valor: string) => {
    handleUpdate('maps_embed_url', normalizeGoogleMapsEmbedUrl(valor));
  };

  const handleFileChange = async (clave: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdate(clave, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getSalonFeatures = () => parseJsonArray<string>(configs.salon_features_json, defaultSalonFeatures);
  const getSalonImages = () => {
    const images = parseJsonArray<any>(configs.salon_images_json, defaultSalonImages);
    return [...images, ...defaultSalonImages].slice(0, 3);
  };

  const updateSalonFeatures = (features: string[]) => {
    handleUpdate('salon_features_json', JSON.stringify(features.filter((item) => item.trim())));
  };

  const handleSalonFeatureChange = (index: number, value: string) => {
    const features = getSalonFeatures();
    features[index] = value;
    updateSalonFeatures(features);
  };

  const handleAddSalonFeature = () => {
    updateSalonFeatures([...getSalonFeatures(), 'Nueva característica']);
  };

  const handleDeleteSalonFeature = (index: number) => {
    const features = getSalonFeatures().filter((_, idx) => idx !== index);
    updateSalonFeatures(features.length > 0 ? features : defaultSalonFeatures.slice(0, 1));
  };

  const updateSalonImages = (images: any[]) => {
    handleUpdate('salon_images_json', JSON.stringify(images));
  };

  const handleSalonImageChange = (index: number, key: 'label' | 'src', value: string) => {
    const images = getSalonImages();
    images[index] = { ...images[index], [key]: value };
    updateSalonImages(images);
  };

  const handleSalonImageFileChange = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 8MB.');
      return;
    }

    try {
      const dataUrl = await imageFileToDataUrl(file);
      handleSalonImageChange(index, 'src', dataUrl);
      toast.success('Imagen cargada correctamente');
    } catch {
      toast.error('No se pudo cargar la imagen. Intenta con otra foto.');
    }
  };

  const updatePastEventsInConfigs = (updatedList: any[]) => {
    setPastEvents(updatedList);
    handleUpdate('past_events_json', JSON.stringify(updatedList));
  };

  const handleEditSlide = (index: number, key: string, value: string) => {
    const list = [...pastEvents];
    list[index] = { ...list[index], [key]: value };
    updatePastEventsInConfigs(list);
  };

  const handleDeleteSlide = (index: number) => {
    const list = pastEvents.filter((_, idx) => idx !== index);
    updatePastEventsInConfigs(list);
    if (editingSlideIndex === index) {
      setEditingSlideIndex(null);
    }
  };

  const handleAddSlide = () => {
    const newSlide = {
      title: "Nuevo Cumpleaños Mágico",
      tag: "Diversión 🎉",
      comment: "¡Todo estuvo excelente! A los niños les encantó la fiesta.",
      author: "Nombre del Papá/Mamá",
      image: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200"
    };
    const list = [...pastEvents, newSlide];
    updatePastEventsInConfigs(list);
    setEditingSlideIndex(list.length - 1);
  };

  const handleSlideFileChange = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleEditSlide(index, 'image', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateEmployeesInConfigs = (updatedList: any[]) => {
    setEmployees(updatedList);
    handleUpdate('about_us_employees_json', JSON.stringify(updatedList));
  };

  const handleEditEmployee = (index: number, key: string, value: string) => {
    const list = [...employees];
    list[index] = { ...list[index], [key]: value };
    updateEmployeesInConfigs(list);
  };

  const handleDeleteEmployee = (index: number) => {
    const list = employees.filter((_, idx) => idx !== index);
    updateEmployeesInConfigs(list);
    if (editingEmpIndex === index) {
      setEditingEmpIndex(null);
    }
  };

  const handleAddEmployee = () => {
    const newEmp = {
      name: "Nuevo Integrante",
      role: "Puesto / Rol",
      img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      desc: ""
    };
    const list = [...employees, newEmp];
    updateEmployeesInConfigs(list);
    setEditingEmpIndex(list.length - 1);
  };

  const handleEmployeeFileChange = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleEditEmployee(index, 'img', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateValuesInConfigs = (updatedList: any[]) => {
    setCoreValues(updatedList);
    handleUpdate('about_us_values_json', JSON.stringify(updatedList));
  };

  const handleEditValue = (index: number, key: string, value: string) => {
    const list = [...coreValues];
    list[index] = { ...list[index], [key]: value };
    updateValuesInConfigs(list);
  };

  const handleDeleteValue = (index: number) => {
    const list = coreValues.filter((_, idx) => idx !== index);
    updateValuesInConfigs(list);
    if (editingValueIndex === index) {
      setEditingValueIndex(null);
    }
  };

  const handleAddValue = () => {
    const newValue = {
      icon: "ShieldCheck",
      title: "Nuevo Pilar",
      desc: "Descripción de este pilar o valor...",
      color: "#10b981"
    };
    const list = [...coreValues, newValue];
    updateValuesInConfigs(list);
    setEditingValueIndex(list.length - 1);
  };

  const updateGalleryInConfigs = (updatedList: any[]) => {
    setGallery(updatedList);
    handleUpdate('about_us_gallery_json', JSON.stringify(updatedList));
  };

  const handleEditGallery = (index: number, key: string, value: string) => {
    const list = [...gallery];
    list[index] = { ...list[index], [key]: value };
    updateGalleryInConfigs(list);
  };

  const handleDeleteGallery = (index: number) => {
    const list = gallery.filter((_, idx) => idx !== index);
    updateGalleryInConfigs(list);
    if (editingGalIndex === index) {
      setEditingGalIndex(null);
    }
  };

  const handleAddGallery = () => {
    const newGal = {
      img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=600",
      desc: "Descripción de la imagen..."
    };
    const list = [...gallery, newGal];
    updateGalleryInConfigs(list);
    setEditingGalIndex(list.length - 1);
  };

  const handleGalleryFileChange = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleEditGallery(index, 'img', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- TESTIMONIALS CRUD ---
  const updateTestimonialsInConfigs = (list: any[]) => {
    setTestimonials(list);
    handleUpdate('testimonials_json', JSON.stringify(list));
  };
  const handleEditTestimonial = (index: number, key: string, value: string | number) => {
    const list = [...testimonials];
    list[index] = { ...list[index], [key]: value };
    updateTestimonialsInConfigs(list);
  };
  const handleDeleteTestimonial = (index: number) => {
    updateTestimonialsInConfigs(testimonials.filter((_, i) => i !== index));
    if (editingTestimonialIndex === index) setEditingTestimonialIndex(null);
  };
  const handleAddTestimonial = () => {
    const list = [...testimonials, { name: "Nuevo Testimonio", role: "Padre/Madre de familia", text: "Una experiencia increíble para toda la familia.", rating: 5, avatar: "" }];
    updateTestimonialsInConfigs(list);
    setEditingTestimonialIndex(list.length - 1);
  };
  const handleTestimonialFileChange = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar los 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => handleEditTestimonial(index, 'avatar', reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- FAQ CRUD ---
  const updateFaqsInConfigs = (list: any[]) => {
    setFaqs(list);
    handleUpdate('faqs_json', JSON.stringify(list));
  };
  const handleEditFaq = (index: number, key: string, value: string) => {
    const list = [...faqs];
    list[index] = { ...list[index], [key]: value };
    updateFaqsInConfigs(list);
  };
  const handleDeleteFaq = (index: number) => {
    updateFaqsInConfigs(faqs.filter((_, i) => i !== index));
    if (editingFaqIndex === index) setEditingFaqIndex(null);
  };
  const handleAddFaq = () => {
    const list = [...faqs, { q: "Nueva Pregunta Frecuente", a: "Escribe aquí la respuesta detallada..." }];
    updateFaqsInConfigs(list);
    setEditingFaqIndex(list.length - 1);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const validations = [
        isValidPhone(configs.contact_phone),
        isValidPhone(configs.contact_whatsapp),
        isValidEmail(configs.contact_email),
        isValidSocialValue(configs.social_instagram),
        isValidSocialValue(configs.social_facebook),
        isValidSocialValue(configs.social_tiktok),
        !configs.maps_embed_url || isGoogleMapsEmbedUrl(configs.maps_embed_url)
      ];

      if (validations.some((valid) => !valid)) {
        toast.error('Corrige los campos marcados en rojo antes de guardar.');
        return;
      }

      const finalConfigs = {
        ...configs,
        maps_embed_url: normalizeGoogleMapsEmbedUrl(configs.maps_embed_url),
        about_us_employees_json: JSON.stringify(employees),
        about_us_values_json: JSON.stringify(coreValues),
        about_us_gallery_json: JSON.stringify(gallery),
        testimonials_json: JSON.stringify(testimonials),
        faqs_json: JSON.stringify(faqs)
      };

      const items: ConfigEntry[] = Object.entries(finalConfigs).map(([clave, valor]) => ({
        clave,
        valor: valor || ''
      }));
      await configService.bulkUpdate(items);
      toast.success('Cambios guardados correctamente');
    } catch (err) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const salonFeatures = getSalonFeatures();
  const salonImages = getSalonImages();
  const previewPackages = paquetes.slice(0, 3);
  const previewCurrency = configs.currency_symbol || '$';
  const previewMapUrl = normalizeGoogleMapsEmbedUrl(configs.maps_embed_url);
  const previewHasMap = isGoogleMapsEmbedUrl(previewMapUrl);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sincronizando Plataforma...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* HEADER CMS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <Layout size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Marketing Control</h1>
            <p className="text-slate-500 font-medium text-sm mt-2">Personaliza la identidad visual y contenidos de Zapatitos</p>
          </div>
        </div>
        <button 
          onClick={saveAll}
          disabled={saving}
          className="relative z-10 flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Guardando...' : 'Publicar Cambios'}
        </button>
      </div>

      {/* TABS NAVIGATION CMS */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 rounded-3xl w-fit border border-slate-200">
        {[
          { id: 'general', label: 'General', icon: Megaphone },
          { id: 'hero', label: 'Hero / Bienvenida', icon: Monitor },
          { id: 'sobre_nosotros', label: 'Sobre Nosotros', icon: Users },
          { id: 'paquetes', label: 'Paquetes', icon: Layers },
          { id: 'fiestas', label: 'Fiestas Pasadas', icon: Sparkles },
          { id: 'testimonios', label: 'Testimonios', icon: Star },
          { id: 'faqs', label: 'Preguntas FAQ', icon: HelpCircle },
          { id: 'contacto', label: 'Contacto y Redes', icon: Phone },
          { id: 'pagos', label: 'Pagos QR', icon: QrCode }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* EDIT FORM CMS */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'general' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Megaphone size={18} className="text-indigo-600" /> Identidad y Avisos
              </h3>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Logotipo de la Web (PNG/SVG)</label>
                <div className="relative group max-w-xs">
                  <div className="w-full h-24 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-300">
                     {configs.website_logo ? (
                       <img src={configs.website_logo} className="h-16 object-contain" alt="Website Logo" />
                     ) : (
                       <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sin logotipo</span>
                     )}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm rounded-2xl">
                        <label className="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                           <RefreshCw size={14} /> Cambiar Logo
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('website_logo', e.target.files[0])} />
                        </label>
                     </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Promocional (Top Bar)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-24 resize-none shadow-inner"
                  value={configs.promo_banner || ''}
                  onChange={(e) => handleUpdate('promo_banner', e.target.value)}
                  placeholder="Ej: ¡Reserva ahora y obtén un 10% de descuento en servicios extras!"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email de Contacto</label>
                <div className="relative">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.contact_email || ''}
                    onChange={(e) => handleUpdate('contact_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8 space-y-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Formato Comercial</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Símbolo de Moneda</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.currency_symbol || ''}
                      onChange={(e) => handleUpdate('currency_symbol', e.target.value)}
                      placeholder="Ej: Bs"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiqueta de Precio</label>
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.currency_label || ''}
                      onChange={(e) => handleUpdate('currency_label', e.target.value)}
                      placeholder="Ej: / Evento"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Banner Toggle & Customization */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Anuncio de Mitad de Página</h4>
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                  <div>
                    <p className="font-bold text-xs text-slate-700">Mostrar Banner de Anuncio</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Habilita una franja informativa llamativa a mitad de la Landing.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={configs.middle_banner_show === 'true'}
                      onChange={(e) => handleUpdate('middle_banner_show', e.target.checked ? 'true' : 'false')}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {configs.middle_banner_show === 'true' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto del Anuncio</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                        value={configs.middle_banner_text || ''}
                        onChange={(e) => handleUpdate('middle_banner_text', e.target.value)}
                        placeholder="Ej: ¡Gran inauguración de nuestra zona de pelotero gigante!"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color de Fondo (Hex)</label>
                      <div className="flex gap-3">
                        <input 
                          type="color"
                          className="w-12 h-12 bg-transparent border-0 outline-none cursor-pointer rounded-xl"
                          value={configs.middle_banner_bg || '#ffb7b2'}
                          onChange={(e) => handleUpdate('middle_banner_bg', e.target.value)}
                        />
                        <input 
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                          value={configs.middle_banner_bg || '#ffb7b2'}
                          onChange={(e) => handleUpdate('middle_banner_bg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enlace del Anuncio (Ruta o URL)</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                        value={configs.middle_banner_link || ''}
                        onChange={(e) => handleUpdate('middle_banner_link', e.target.value)}
                        placeholder="Ej: /reservar o #paquetes"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-8 space-y-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Sección Instalaciones</h4>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.salon_title || ''}
                    onChange={(e) => handleUpdate('salon_title', e.target.value)}
                    placeholder="Un Espacio Diseñado para Soñar"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-28 resize-none shadow-inner"
                    value={configs.salon_description || ''}
                    onChange={(e) => handleUpdate('salon_description', e.target.value)}
                    placeholder="Describe las instalaciones del salón..."
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficios / Características</label>
                    <button
                      type="button"
                      onClick={handleAddSalonFeature}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="space-y-3">
                    {salonFeatures.map((feature, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                          value={feature}
                          onChange={(e) => handleSalonFeatureChange(index, e.target.value)}
                          placeholder="Ej: Salón climatizado"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSalonFeature(index)}
                          className="w-12 shrink-0 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 font-black transition-all"
                          aria-label="Eliminar característica"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imágenes de Instalaciones</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {salonImages.slice(0, 3).map((image, index) => (
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4">
                        <div className="relative group aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200">
                          {image.src || image.img ? (
                            <img src={image.src || image.img} alt={image.label || `Instalación ${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon size={36} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-xl">
                              Cambiar
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleSalonImageFileChange(index, e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Etiqueta</label>
                          <input
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={image.label || ''}
                            onChange={(e) => handleSalonImageChange(index, 'label', e.target.value)}
                            placeholder="Ej: Zona de Juegos"
                          />
                        </div>
                        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">
                          <ImageIcon size={14} /> Subir imagen
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleSalonImageFileChange(index, e.target.files[0])}
                          />
                        </label>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">URL opcional</label>
                          <input
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={image.src || image.img || ''}
                            onChange={(e) => handleSalonImageChange(index, 'src', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">Puedes subir imágenes desde tu equipo o pegar una URL. Se mostrarán tres imágenes en la landing.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8 space-y-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Disponibilidad y CTA Final</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de Disponibilidad</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.availability_title || ''} onChange={(e) => handleUpdate('availability_title', e.target.value)} placeholder="¿Cuándo es tu Próximo Evento?" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto de Disponibilidad</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-24 resize-none shadow-inner"
                      value={configs.availability_subtitle || ''} onChange={(e) => handleUpdate('availability_subtitle', e.target.value)} placeholder="Consulta nuestra disponibilidad en tiempo real..." />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Métrica Satisfacción</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.availability_satisfaction || ''} onChange={(e) => handleUpdate('availability_satisfaction', e.target.value)} placeholder="98%" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Métrica Eventos</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.availability_events_count || ''} onChange={(e) => handleUpdate('availability_events_count', e.target.value)} placeholder="+2k" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título CTA Final</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.final_cta_title || ''} onChange={(e) => handleUpdate('final_cta_title', e.target.value)} placeholder="¿Listo para organizar un evento inolvidable?" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto CTA Final</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-24 resize-none shadow-inner"
                      value={configs.final_cta_subtitle || ''} onChange={(e) => handleUpdate('final_cta_subtitle', e.target.value)} placeholder="Únete a cientos de familias..." />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Botón Principal</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.final_cta_primary_text || ''} onChange={(e) => handleUpdate('final_cta_primary_text', e.target.value)} placeholder="Comenzar Ahora" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Botón Secundario</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.final_cta_secondary_text || ''} onChange={(e) => handleUpdate('final_cta_secondary_text', e.target.value)} placeholder="Hablar con un asesor" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Monitor size={18} className="text-indigo-600" /> Sección Hero (Bienvenida)
              </h3>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Texto del Badge Superior</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.hero_badge || '¡Bienvenidos a Zapatitos!'}
                    onChange={(e) => handleUpdate('hero_badge', e.target.value)}
                    placeholder="Ej: ¡Bienvenidos a Zapatitos!"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título Impactante</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-xl font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                    value={configs.hero_title || ''}
                    onChange={(e) => handleUpdate('hero_title', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo Descriptivo</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-32 resize-none shadow-inner"
                    value={configs.hero_subtitle || ''}
                    onChange={(e) => handleUpdate('hero_subtitle', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Imagen de Fondo (Full HD)</label>
                  <div className="relative group">
                    <div className="w-full h-64 bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-300">
                       {configs.hero_image ? (
                         <img src={configs.hero_image} className="w-full h-full object-cover opacity-80" alt="Preview" />
                       ) : (
                         <ImageIcon size={48} className="text-slate-300" />
                       )}
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm">
                          <label className="bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center gap-3">
                             <RefreshCw size={18} /> Reemplazar Imagen
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('hero_image', e.target.files[0])} />
                          </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sobre_nosotros' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Users size={18} className="text-indigo-600" /> Sección Sobre Nosotros y Equipo
              </h3>

              {/* GENERAL HISTORY */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Historia y Datos Clave</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título Principal (Página Sobre Nosotros)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.about_us_page_title || ''}
                      onChange={(e) => handleUpdate('about_us_page_title', e.target.value)}
                      placeholder="Ej: Nuestra Historia de Magia y Diversión"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de Sección / Subtítulo (Inicio)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.about_us_title || ''}
                      onChange={(e) => handleUpdate('about_us_title', e.target.value)}
                      placeholder="Ej: Pasión por crear recuerdos que duran toda la vida"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de la Historia</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.about_us_story_title || ''}
                      onChange={(e) => handleUpdate('about_us_story_title', e.target.value)}
                      placeholder="Ej: ¿Cómo nació Zapatitos?"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Años de Experiencia</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.about_us_years_experience || ''}
                      onChange={(e) => handleUpdate('about_us_years_experience', e.target.value)}
                      placeholder="Ej: 10+"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteo de Eventos</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.about_us_events_count || ''}
                      onChange={(e) => handleUpdate('about_us_events_count', e.target.value)}
                      placeholder="Ej: 500+"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción / Historia</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium outline-none focus:border-indigo-500 transition-all h-32 resize-none shadow-inner"
                    value={configs.about_us_description || ''}
                    onChange={(e) => handleUpdate('about_us_description', e.target.value)}
                    placeholder="Escribe la historia o descripción detallada de la empresa..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Imagen Principal (Sobre Nosotros)</label>
                  <div className="relative group max-w-md">
                    <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-indigo-300">
                      {configs.about_us_image ? (
                        <img src={configs.about_us_image} className="w-full h-full object-cover" alt="History Preview" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40 backdrop-blur-sm rounded-2xl">
                        <label className="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                          <RefreshCw size={14} /> Reemplazar Imagen
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('about_us_image', e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STAFF MANAGER */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">El Equipo / Empleados</h4>
                  <button
                    onClick={handleAddEmployee}
                    className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    + Agregar Empleado
                  </button>
                </div>

                <div className="space-y-6">
                  {employees.map((member, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6 relative overflow-hidden group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            {member.img ? (
                              <img src={member.img} className="w-full h-full object-cover" alt={member.name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">Sin foto</div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-700">{member.name || "Nuevo Integrante"}</h5>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{member.role || "Sin Rol"}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingEmpIndex(editingEmpIndex === idx ? null : idx)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                          >
                            {editingEmpIndex === idx ? "Cerrar" : "Editar"}
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(idx)}
                            className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {editingEmpIndex === idx && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                            <input 
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                              value={member.name || ''}
                              onChange={(e) => handleEditEmployee(idx, 'name', e.target.value)}
                              placeholder="Ej: Lucía Fernández"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol / Cargo</label>
                            <input 
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                              value={member.role || ''}
                              onChange={(e) => handleEditEmployee(idx, 'role', e.target.value)}
                              placeholder="Ej: Coordinadora de Eventos"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto de Perfil</label>
                            <div className="flex items-center gap-3">
                              <label className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                                <ImageIcon size={14} /> Seleccionar Imagen
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleEmployeeFileChange(idx, e.target.files[0])} />
                              </label>
                              <span className="text-[9px] text-slate-400 truncate max-w-xs">{member.img?.startsWith('data:') ? 'Imagen Base64' : member.img || 'Sin imagen'}</span>
                            </div>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción / Presentación (Opcional)</label>
                            <textarea 
                              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-20 resize-none"
                              value={member.desc || ''}
                              onChange={(e) => handleEditEmployee(idx, 'desc', e.target.value)}
                              placeholder="Escribe una pequeña descripción o frase del empleado..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {employees.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                      <Users size={36} className="text-slate-300 mx-auto" />
                      <p className="text-slate-400 text-xs font-bold">No hay empleados registrados. Agrega uno con el botón superior.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PILLARS / VALUES MANAGER */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Pilares Mágicos / Valores</h4>
                  <button
                    onClick={handleAddValue}
                    className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    + Agregar Pilar
                  </button>
                </div>

                <div className="space-y-6">
                  {coreValues.map((val, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6 relative overflow-hidden group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${val.color}15`, color: val.color }}
                          >
                            <Users size={20} />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-700">{val.title || "Nuevo Pilar"}</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Icono: {val.icon} • Color: {val.color}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingValueIndex(editingValueIndex === idx ? null : idx)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                          >
                            {editingValueIndex === idx ? "Cerrar" : "Editar"}
                          </button>
                          <button 
                            onClick={() => handleDeleteValue(idx)}
                            className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {editingValueIndex === idx && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Título del Pilar</label>
                            <input 
                              type="text"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                              value={val.title || ''}
                              onChange={(e) => handleEditValue(idx, 'title', e.target.value)}
                              placeholder="Ej: Seguridad y Cuidado"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Icono</label>
                            <select
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                              value={val.icon || 'ShieldCheck'}
                              onChange={(e) => handleEditValue(idx, 'icon', e.target.value)}
                            >
                              <option value="ShieldCheck">Escudo de Seguridad (ShieldCheck)</option>
                              <option value="Heart">Corazón (Heart)</option>
                              <option value="Users">Usuarios / Equipo (Users)</option>
                              <option value="Sparkles">Estrellas (Sparkles)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Color del Icono (Hex)</label>
                            <div className="flex gap-3">
                              <input 
                                type="color"
                                className="w-10 h-10 bg-transparent border-0 outline-none cursor-pointer rounded-xl"
                                value={val.color || '#10b981'}
                                onChange={(e) => handleEditValue(idx, 'color', e.target.value)}
                              />
                              <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-500"
                                value={val.color || '#10b981'}
                                onChange={(e) => handleEditValue(idx, 'color', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción / Detalles</label>
                            <textarea 
                              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-20 resize-none"
                              value={val.desc || ''}
                              onChange={(e) => handleEditValue(idx, 'desc', e.target.value)}
                              placeholder="Escribe la descripción de este pilar o valor..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {coreValues.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                      <Sparkles size={36} className="text-slate-300 mx-auto" />
                      <p className="text-slate-400 text-xs font-bold">No hay pilares registrados. Agrega uno con el botón superior.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* GALLERY MANAGER */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Fotos / Textos Adicionales (Sub-pestaña Sobre Nosotros)</h4>
                  <button
                    onClick={handleAddGallery}
                    className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    + Agregar Foto
                  </button>
                </div>

                <div className="space-y-6">
                  {gallery.map((item, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6 relative overflow-hidden group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            {item.img ? (
                              <img src={item.img} className="w-full h-full object-cover" alt="Gallery Preview" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">Sin foto</div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-700">Foto Adicional #{idx + 1}</h5>
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{item.desc || "Sin descripción"}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingGalIndex(editingGalIndex === idx ? null : idx)}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                          >
                            {editingGalIndex === idx ? "Cerrar" : "Editar"}
                          </button>
                          <button 
                            onClick={() => handleDeleteGallery(idx)}
                            className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {editingGalIndex === idx && (
                        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imagen</label>
                            <div className="flex items-center gap-3">
                              <label className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                                <ImageIcon size={14} /> Seleccionar Imagen
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleGalleryFileChange(idx, e.target.files[0])} />
                              </label>
                              <span className="text-[9px] text-slate-400 truncate max-w-xs">{item.img?.startsWith('data:') ? 'Imagen Base64' : item.img || 'Sin imagen'}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción / Texto</label>
                            <textarea 
                              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-20 resize-none"
                              value={item.desc || ''}
                              onChange={(e) => handleEditGallery(idx, 'desc', e.target.value)}
                              placeholder="Escribe la descripción de la imagen..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {gallery.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                      <ImageIcon size={36} className="text-slate-300 mx-auto" />
                      <p className="text-slate-400 text-xs font-bold">No hay fotos adicionales registradas. Agrega una con el botón superior.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paquetes' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Layers size={18} className="text-indigo-600" /> Control de Paquetes
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Establece qué paquete recibirá la insignia destacada <strong>"Más Elegido"</strong> en la Landing Page pública.
              </p>

              <div className="space-y-3 max-w-md">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paquete Recomendado ("Más Elegido")</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                  value={configs.recommended_package_id || ''}
                  onChange={(e) => handleUpdate('recommended_package_id', e.target.value)}
                >
                  <option value="">-- Ninguno (Inferencia automática) --</option>
                  {paquetes.map((pkg) => (
                    <option key={pkg.id} value={pkg.id.toString()}>
                      {pkg.nombre} ({configs.currency_symbol || '$'}{Number(pkg.precioBase).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'fiestas' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <Sparkles size={18} className="text-indigo-600" /> Carrusel de Fiestas Pasadas
                </h3>
                <button
                  onClick={handleAddSlide}
                  className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  + Agregar Evento
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Administra los momentos felices y opiniones reales de los padres de familia que se muestran en el carrusel interactivo.
              </p>

              <div className="space-y-6">
                {pastEvents.map((evt, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {evt.image ? (
                            <img src={evt.image} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">Sin foto</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-700">{evt.title || "Sin título"}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{evt.tag} • por {evt.author}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingSlideIndex(editingSlideIndex === idx ? null : idx)}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all"
                        >
                          {editingSlideIndex === idx ? "Cerrar" : "Editar"}
                        </button>
                        <button 
                          onClick={() => handleDeleteSlide(idx)}
                          className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {editingSlideIndex === idx && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Título del Evento</label>
                          <input 
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={evt.title || ''}
                            onChange={(e) => handleEditSlide(idx, 'title', e.target.value)}
                            placeholder="Ej: Cumpleaños de Sofía (5 años)"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tag / Categoría</label>
                          <input 
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={evt.tag || ''}
                            onChange={(e) => handleEditSlide(idx, 'tag', e.target.value)}
                            placeholder="Ej: Show de Magia 🪄"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Autor (Papá/Mamá)</label>
                          <input 
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={evt.author || ''}
                            onChange={(e) => handleEditSlide(idx, 'author', e.target.value)}
                            placeholder="Ej: Mamá Lucía"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imagen (Polaroid)</label>
                          <div className="flex items-center gap-3">
                            <label className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                              <ImageIcon size={14} /> Seleccionar Imagen
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSlideFileChange(idx, e.target.files[0])} />
                            </label>
                            <span className="text-[9px] text-slate-400 truncate max-w-xs">{evt.image?.startsWith('data:') ? 'Imagen Base64' : evt.image || 'Sin imagen'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opinión / Comentario</label>
                          <textarea 
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-24 resize-none"
                            value={evt.comment || ''}
                            onChange={(e) => handleEditSlide(idx, 'comment', e.target.value)}
                            placeholder="Escribe la opinión o testimonio tierno..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {pastEvents.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                    <Sparkles size={36} className="text-slate-300 mx-auto" />
                    <p className="text-slate-400 text-xs font-bold">No hay eventos configurados. Agrega uno con el botón superior.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TESTIMONIOS TAB ─── */}
          {activeTab === 'testimonios' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <Star size={18} className="text-indigo-600" /> Lo que dicen los Padres
                </h3>
                <button onClick={handleAddTestimonial} className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  + Agregar Testimonio
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Agrega, edita o elimina los testimonios de padres que aparecen en la sección <strong>"Lo que dicen los padres"</strong> de la landing page.
              </p>
              <div className="space-y-6">
                {testimonials.map((t, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6 relative">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {t.avatar ? (
                            <img src={t.avatar} className="w-full h-full object-cover" alt={t.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-400">
                              {(t.name || '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-700">{t.name || "Sin nombre"}</h5>
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{t.role || "Sin rol"}</p>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={i < (t.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingTestimonialIndex(editingTestimonialIndex === idx ? null : idx)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                          {editingTestimonialIndex === idx ? "Cerrar" : "Editar"}
                        </button>
                        <button onClick={() => handleDeleteTestimonial(idx)} className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all">
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {editingTestimonialIndex === idx && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                          <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={t.name || ''} onChange={(e) => handleEditTestimonial(idx, 'name', e.target.value)} placeholder="Ej: María García" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol / Descripción</label>
                          <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={t.role || ''} onChange={(e) => handleEditTestimonial(idx, 'role', e.target.value)} placeholder="Ej: Madre de cumpleañero" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calificación (1-5 estrellas)</label>
                          <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={t.rating || 5} onChange={(e) => handleEditTestimonial(idx, 'rating', parseInt(e.target.value))}>
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n === 5 ? '⭐⭐⭐⭐⭐' : n === 4 ? '⭐⭐⭐⭐' : n === 3 ? '⭐⭐⭐' : n === 2 ? '⭐⭐' : '⭐'}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Foto (Opcional)</label>
                          <div className="flex items-center gap-3">
                            <label className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                              <ImageIcon size={14} /> Seleccionar Foto
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleTestimonialFileChange(idx, e.target.files[0])} />
                            </label>
                            <span className="text-[9px] text-slate-400 truncate max-w-xs">{t.avatar?.startsWith('data:') ? 'Imagen Base64' : t.avatar || 'Sin imagen'}</span>
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opinión / Testimonio</label>
                          <textarea className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-24 resize-none"
                            value={t.text || ''} onChange={(e) => handleEditTestimonial(idx, 'text', e.target.value)}
                            placeholder="Escribe la opinión o comentario del padre/madre..." />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {testimonials.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                    <Star size={36} className="text-slate-300 mx-auto" />
                    <p className="text-slate-400 text-xs font-bold">No hay testimonios. Agrega uno con el botón superior.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── FAQ TAB ─── */}
          {activeTab === 'faqs' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <HelpCircle size={18} className="text-indigo-600" /> Preguntas Frecuentes (FAQ)
                </h3>
                <button onClick={handleAddFaq} className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  + Agregar Pregunta
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Gestiona las preguntas frecuentes que aparecen en la sección <strong>"¿Tienes dudas? Estamos para ayudarte"</strong> de la landing page.
              </p>
              <div className="space-y-6">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-slate-700 truncate">{faq.q || "Sin pregunta"}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-1">{faq.a || "Sin respuesta"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingFaqIndex(editingFaqIndex === idx ? null : idx)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                          {editingFaqIndex === idx ? "Cerrar" : "Editar"}
                        </button>
                        <button onClick={() => handleDeleteFaq(idx)} className="px-4 py-2 rounded-xl bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all">
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {editingFaqIndex === idx && (
                      <div className="space-y-4 pt-4 border-t border-slate-100/80 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pregunta</label>
                          <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                            value={faq.q || ''} onChange={(e) => handleEditFaq(idx, 'q', e.target.value)} placeholder="Ej: ¿Con cuánta anticipación debo reservar?" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Respuesta</label>
                          <textarea className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-500 h-28 resize-none"
                            value={faq.a || ''} onChange={(e) => handleEditFaq(idx, 'a', e.target.value)}
                            placeholder="Escribe la respuesta detallada a esta pregunta..." />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {faqs.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                    <HelpCircle size={36} className="text-slate-300 mx-auto" />
                    <p className="text-slate-400 text-xs font-bold">No hay preguntas. Agrega una con el botón superior.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── CONTACTO & REDES TAB ─── */}
          {activeTab === 'contacto' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <Phone size={18} className="text-indigo-600" /> Información de Contacto y Redes
              </h3>

              {/* CONTACT INFO */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Datos de Contacto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12} /> Teléfono Principal</label>
                    <input className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidPhone(configs.contact_phone) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.contact_phone || ''} onChange={(e) => handleUpdate('contact_phone', e.target.value)} placeholder="Ej: +591 70000000" />
                    <FieldHint valid={isValidPhone(configs.contact_phone)}>Usa código de país. Mínimo 8 dígitos.</FieldHint>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12} /> WhatsApp (con código de país)</label>
                    <input className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidPhone(configs.contact_whatsapp) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.contact_whatsapp || ''} onChange={(e) => handleUpdate('contact_whatsapp', e.target.value)} placeholder="Ej: +591 70000000" />
                    <FieldHint valid={isValidPhone(configs.contact_whatsapp)}>Este número recibirá los mensajes del formulario.</FieldHint>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail size={12} /> Email de Contacto</label>
                    <input type="email" className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidEmail(configs.contact_email) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.contact_email || ''} onChange={(e) => handleUpdate('contact_email', e.target.value)} placeholder="Ej: info@zapatitos.com" />
                    <FieldHint valid={isValidEmail(configs.contact_email)}>Se usa como canal secundario y en el footer.</FieldHint>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Dirección Textual</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.contact_address || ''} onChange={(e) => handleUpdate('contact_address', e.target.value)} placeholder="Ej: Av. Principal #123, Ciudad" />
                  </div>
                </div>
              </div>

              {/* BUSINESS HOURS */}
              <div className="space-y-4 border-t border-slate-100 pt-8">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-indigo-600" /> Horarios de Atención
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lunes a Viernes</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.business_hours_weekdays || ''} onChange={(e) => handleUpdate('business_hours_weekdays', e.target.value)} placeholder="Ej: 09:00 - 18:00" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sábados y Domingos</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                      value={configs.business_hours_weekend || ''} onChange={(e) => handleUpdate('business_hours_weekend', e.target.value)} placeholder="Ej: 10:00 - 22:00" />
                  </div>
                </div>
              </div>

              {/* SOCIAL MEDIA */}
              <div className="space-y-4 border-t border-slate-100 pt-8">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Redes Sociales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ExternalLink size={12} /> Instagram (usuario o URL)</label>
                    <input className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidSocialValue(configs.social_instagram) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.social_instagram || ''} onChange={(e) => handleUpdate('social_instagram', e.target.value)} placeholder="Ej: zapatitos_eventos" />
                    <FieldHint valid={isValidSocialValue(configs.social_instagram)}>Acepta usuario, @usuario o URL completa.</FieldHint>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ExternalLink size={12} /> Facebook (usuario o URL)</label>
                    <input className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidSocialValue(configs.social_facebook) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.social_facebook || ''} onChange={(e) => handleUpdate('social_facebook', e.target.value)} placeholder="Ej: zapatitos.eventos o https://fb.com/..." />
                    <FieldHint valid={isValidSocialValue(configs.social_facebook)}>Acepta usuario o URL completa.</FieldHint>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="text-xs">♪</span> TikTok (usuario o URL)
                    </label>
                    <input className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all shadow-inner ${isValidSocialValue(configs.social_tiktok) ? 'border-slate-200' : 'border-red-400 bg-red-50/30'}`}
                      value={configs.social_tiktok || ''} onChange={(e) => handleUpdate('social_tiktok', e.target.value)} placeholder="Ej: @zapatitos_eventos" />
                    <FieldHint valid={isValidSocialValue(configs.social_tiktok)}>Acepta usuario, @usuario o URL completa.</FieldHint>
                  </div>
                </div>
              </div>

              {/* WHATSAPP TEMPLATE */}
              <div className="space-y-4 border-t border-slate-100 pt-8">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={14} className="text-emerald-600" /> Plantilla del Mensaje de WhatsApp
                </h4>
                <textarea
                  rows={7}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all shadow-inner font-mono resize-none"
                  value={configs.whatsapp_message_template || defaultWhatsAppTemplate}
                  onChange={(e) => handleUpdate('whatsapp_message_template', e.target.value)}
                />
                <p className="text-[10px] font-bold text-slate-500">
                  Variables disponibles: <code>{'{nombre}'}</code>, <code>{'{telefono}'}</code>, <code>{'{fecha}'}</code>, <code>{'{invitados}'}</code>, <code>{'{paquete}'}</code>, <code>{'{email}'}</code>, <code>{'{asunto}'}</code>, <code>{'{mensaje}'}</code>.
                </p>
                <div className="bg-slate-900 text-emerald-100 rounded-2xl p-5 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Vista previa del mensaje</p>
                  <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                    {applyTemplatePreview(configs.whatsapp_message_template || defaultWhatsAppTemplate)}
                  </pre>
                </div>
              </div>

              {/* GOOGLE MAPS */}
              <div className="space-y-4 border-t border-slate-100 pt-8">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-600" /> Mapa de Ubicación (Google Maps)
                </h4>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-xs text-slate-600 leading-relaxed space-y-3">
                  <p className="font-bold text-emerald-700">¿Cómo obtener el enlace de incrustación?</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-500">
                    <li>Ve a <strong>Google Maps</strong> y busca la dirección del salón.</li>
                    <li>Haz clic en <strong>"Compartir"</strong> → <strong>"Insertar un mapa"</strong>.</li>
                    <li>Copia solo el valor del atributo <code className="bg-white px-1.5 py-0.5 rounded font-mono border border-slate-200">src="..."</code> del código <code className="bg-white px-1.5 py-0.5 rounded font-mono border border-slate-200">&lt;iframe&gt;</code> generado.</li>
                    <li>Pega ese link en el campo de abajo. Debe comenzar con <code className="bg-white px-1.5 py-0.5 rounded font-mono border border-slate-200">https://www.google.com/maps/embed</code>.</li>
                  </ol>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
                    <p className="text-amber-700"><strong>Importante:</strong> El link de "Compartir" normal de Google Maps <strong>NO funciona</strong> en iframe. Debes usar el link específico de <em>insertar mapa</em>.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Incrustación de Google Maps</label>
                  <input
                    className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-inner font-mono text-xs ${
                      configs.maps_embed_url
                        ? isGoogleMapsEmbedUrl(configs.maps_embed_url)
                          ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/30'
                          : 'border-red-400 focus:border-red-500 bg-red-50/30'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                    value={configs.maps_embed_url || ''}
                    onChange={(e) => handleMapsEmbedChange(e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                  {/* VALIDATION FEEDBACK */}
                  {configs.maps_embed_url && !isGoogleMapsEmbedUrl(configs.maps_embed_url) && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                      <span className="text-red-500 text-lg shrink-0">✗</span>
                      <div>
                        <p className="text-red-700 font-bold text-xs">URL incorrecta — este link no se puede incrustar</p>
                        <p className="text-red-500 text-[10px] mt-1">Pegaste un link de <em>compartir</em> o de <em>navegación</em> de Google Maps. Sigue los pasos de arriba para obtener el URL de <strong>insertar mapa</strong>. Debe contener <code className="font-mono bg-red-100 px-1 rounded">/maps/embed</code> en su URL.</p>
                      </div>
                    </div>
                  )}
                  {configs.maps_embed_url && isGoogleMapsEmbedUrl(configs.maps_embed_url) && (
                    <p className="text-emerald-600 text-[10px] font-bold flex items-center gap-1.5">
                      <span>✓</span> URL válida — el mapa se mostrará en la landing page
                    </p>
                  )}
                </div>
                {/* LIVE PREVIEW — only for valid embed URLs */}
                {configs.maps_embed_url && isGoogleMapsEmbedUrl(configs.maps_embed_url) && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 bg-slate-50 border-b border-slate-100">Vista previa del mapa</p>
                    <iframe src={normalizeGoogleMapsEmbedUrl(configs.maps_embed_url)} width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Preview Mapa" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-6 flex items-center gap-3">
                <QrCode size={18} className="text-indigo-600" /> QR de Pago (Base)
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Este código QR es el que verán los clientes al realizar su reserva online para el pago del anticipo.</p>
              
              <div className="flex flex-col items-center gap-8 p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                {configs.qr_pago_base64 ? (
                  <div className="relative group">
                    <img src={configs.qr_pago_base64} className="w-72 h-72 bg-white p-6 rounded-3xl shadow-2xl object-contain" alt="QR" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                       <label className="bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-transform">
                          Cambiar Código QR
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('qr_pago_base64', e.target.files[0])} />
                       </label>
                    </div>
                  </div>
                ) : (
                  <div className="w-72 h-72 flex flex-col items-center justify-center gap-6">
                     <QrCode size={80} className="text-slate-300" />
                     <label className="bg-indigo-600 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                        Subir Archivo QR
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileChange('qr_pago_base64', e.target.files[0])} />
                     </label>
                  </div>
                )}
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formato PNG/JPG • Máx 2MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PREVIEW LIVE CMS */}
        <div className="space-y-8">
          <div className="bg-slate-950 rounded-[2.5rem] p-4 shadow-[0_50px_100px_rgba(15,23,42,0.35)] sticky top-24 border border-slate-800">
            <div className="flex items-center justify-between px-2 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-300 uppercase tracking-[0.25em]">
                Vista previa web
              </div>
            </div>

            <div className="h-[720px] overflow-y-auto rounded-[2rem] bg-bg-main border border-slate-800 custom-scrollbar">
              {/* Browser Navbar */}
              {configs.promo_banner && (
                <div className="bg-slate-900 px-4 py-2 text-center">
                  <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] line-clamp-1">{configs.promo_banner}</p>
                </div>
              )}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-purple-50 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {configs.website_logo ? (
                      <img src={configs.website_logo} className="w-6 h-6 object-contain" alt="Logo preview" />
                    ) : (
                      <Sparkles size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-bg-dark leading-none truncate">Zapatitos</p>
                    <p className="text-[7px] font-black text-primary uppercase tracking-widest mt-1">Salón de Eventos</p>
                  </div>
                </div>
                <div className="hidden xl:flex items-center gap-3 text-[8px] font-black uppercase tracking-widest text-slate-500">
                  <span>Inicio</span>
                  <span>Servicios</span>
                  <span>Contacto</span>
                </div>
              </div>

              {/* Hero */}
              <section className="relative min-h-[430px] overflow-hidden px-6 py-10 bg-bg-main">
                <div className="absolute right-4 top-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-70" />
                <div className="absolute right-20 bottom-4 w-36 h-36 bg-cyan-100 rounded-full blur-3xl opacity-70" />
                <div className="grid grid-cols-1 gap-8 relative z-10">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">{configs.hero_badge || '¡Bienvenidos a Zapatitos!'}</span>
                    </div>
                    <h2 className="text-3xl font-display font-black text-bg-dark leading-[1.05] tracking-tight">
                      {configs.hero_title || 'Zapatitos - Eventos Infantiles'}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      {configs.hero_subtitle || 'Creamos momentos mágicos para tus pequeños.'}
                    </p>
                    <div className="flex gap-3">
                      <span className="px-5 py-3 rounded-2xl bg-primary text-white text-[8px] font-black uppercase tracking-widest">Disponibilidad</span>
                      <span className="px-5 py-3 rounded-2xl bg-amber-400 text-slate-900 text-[8px] font-black uppercase tracking-widest">Paquetes</span>
                    </div>
                  </div>
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border-[8px] border-white shadow-xl bg-slate-100">
                    <img
                      src={configs.hero_image || 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200'}
                      className="w-full h-full object-cover"
                      alt="Hero preview"
                    />
                  </div>
                </div>
              </section>

              {configs.middle_banner_show === 'true' && (
                <section
                  className="px-6 py-5 text-center border-y border-purple-100/50"
                  style={{ backgroundColor: configs.middle_banner_bg || '#ffb7b2' }}
                >
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wide leading-relaxed">{configs.middle_banner_text || 'Anuncio destacado'}</p>
                </section>
              )}

              {/* Salon */}
              <section className="px-6 py-10 bg-white space-y-6">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Nuestras Instalaciones</p>
                  <h3 className="text-2xl font-display font-black text-bg-dark leading-tight">{configs.salon_title || 'Un Espacio Diseñado para Soñar'}</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{configs.salon_description || 'Amplias áreas climatizadas, juegos interactivos y decoraciones de ensueño.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {salonFeatures.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">✓</span>
                      <span className="text-[9px] font-bold text-slate-700 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {salonImages.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-purple-50">
                        <img src={image.src || image.img} alt={image.label || 'Instalación'} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wide text-center line-clamp-1">{image.label || `Imagen ${index + 1}`}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Availability and packages */}
              <section className="px-6 py-10 bg-bg-main space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Disponibilidad</p>
                  <h3 className="text-2xl font-display font-black text-bg-dark">{configs.availability_title || '¿Cuándo es tu Próximo Evento?'}</h3>
                  <p className="text-xs font-medium text-slate-500">{configs.availability_subtitle || 'Consulta nuestra disponibilidad en tiempo real.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white rounded-2xl border border-purple-50 p-4">
                    <p className="text-2xl font-black text-bg-dark">{configs.availability_satisfaction || '98%'}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Satisfacción</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-purple-50 p-4">
                    <p className="text-2xl font-black text-bg-dark">{configs.availability_events_count || '+2k'}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Eventos</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Planes y Precios</p>
                  {(previewPackages.length > 0 ? previewPackages : [{ id: 1, nombre: 'Premium', precioBase: 499, servicios: [] }]).map((pkg: any, index: number) => (
                    <div key={pkg.id || index} className={`rounded-2xl p-4 border ${configs.recommended_package_id === String(pkg.id) || (!configs.recommended_package_id && index === 1) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-bg-dark border-purple-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black line-clamp-1">{pkg.nombre}</p>
                          <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">{pkg.duracionHoras || 3} horas • Hasta {pkg.capacidadNinos || 30} niños</p>
                        </div>
                        <p className="text-lg font-black">{previewCurrency}{Number(pkg.precioBase || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Contact */}
              <section className="px-6 py-10 bg-white space-y-5">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Contacto</p>
                  <h3 className="text-2xl font-display font-black text-bg-dark">Hablemos de tu próxima fiesta</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Phone size={15} className="text-primary" />
                    <span className="text-[10px] font-bold text-slate-700">{configs.contact_phone || '+591 70000000'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <MessageSquare size={15} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">{configs.contact_whatsapp || 'WhatsApp pendiente'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                    <MapPin size={15} className="text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 line-clamp-1">{configs.contact_address || 'Dirección del salón'}</span>
                  </div>
                </div>
                <div className="h-40 rounded-2xl overflow-hidden bg-slate-100 border border-purple-50">
                  {previewHasMap ? (
                    <iframe src={previewMapUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Mapa preview" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <MapPin size={28} className="text-slate-300 mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa pendiente</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Final CTA and footer */}
              <section className="px-6 py-10 bg-white">
                <div className="rounded-[2rem] bg-slate-950 text-white p-6 text-center space-y-4">
                  <h3 className="text-2xl font-display font-black leading-tight">{configs.final_cta_title || '¿Listo para organizar un evento inolvidable?'}</h3>
                  <p className="text-xs font-medium text-slate-400">{configs.final_cta_subtitle || 'Únete a cientos de familias que ya disfrutan de la mejor experiencia.'}</p>
                  <div className="flex justify-center gap-3">
                    <span className="px-4 py-3 rounded-2xl bg-primary text-white text-[8px] font-black uppercase tracking-widest">{configs.final_cta_primary_text || 'Comenzar Ahora'}</span>
                    <span className="px-4 py-3 rounded-2xl bg-white/10 text-white text-[8px] font-black uppercase tracking-widest">{configs.final_cta_secondary_text || 'Hablar con un asesor'}</span>
                  </div>
                </div>
              </section>
              <footer className="px-6 py-8 bg-bg-main border-t border-purple-100 text-center">
                <p className="text-sm font-black text-bg-dark">Zapatitos</p>
                <p className="text-[9px] font-bold text-slate-500 mt-1">{configs.business_hours_weekdays || '09:00 - 18:00'} • {configs.business_hours_weekend || '10:00 - 22:00'}</p>
              </footer>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Monitor size={20} />
                </div>
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Publicación Inmediata</h4>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Al guardar, los cambios se reflejarán instantáneamente en la web pública. Asegúrate de que las imágenes tengan buena resolución.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSPage;
