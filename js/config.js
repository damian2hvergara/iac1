// CONFIGURACIÓN CENTRALIZADA - SUPABASE + NUEVAS FUNCIONALIDADES
export const CONFIG = {
  // Supabase - Credenciales PÚBLICAS
  supabase: {
    url: "https://cflpmluvhfldewiitymh.supabase.co",
    anonKey: "sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K",
    
    // Nuevas tablas
    tables: {
      vehiculos: "iac",
      kits: "kits_upgrade",
      vendidos: "vehiculos_vendidos",
      kitImagenes: "vehiculo_kit_imagenes",
      preciosEspecificos: "precios_especificos",
      testimonios: "testimonios",
      interacciones: "interacciones_usuario"
    }
  },
  
  // Cloudinary - Configuración
  cloudinary: {
    cloudName: "df2gprqhp",
    folder: "vehiculos",
    apiKey: "914327863259667",
    apiSecret: "UsAsQb-Ej_Zx6LmBk-celUlTf9Q",
    
    // Transformaciones para optimización
    transformations: {
      thumbnail: "c_fill,w_300,h_200,q_auto,f_webp",
      card: "c_fill,w_600,h_400,q_auto,f_webp",
      modal: "c_fill,w_1200,h_800,q_auto,f_webp",
      gallery: "c_fill,w_800,h_600,q_auto,f_webp"
    }
  },
  
  // Contacto
  contacto: {
    whatsapp: "56981458545",
    instagram: "import_american_cars",
    instagramUrl: "https://www.instagram.com/import_american_cars",
    email: "contacto@importamericancars.cl",
    ubicacion: "Zona Franca Arica, Chile",
    horario: "Lunes a Viernes 9:00 - 19:00"
  },
  
  // Comportamiento de la app
  app: {
    mostrarPrecios: true,
    moneda: "CLP",
    mostrarTestimonios: true,
    mostrarInstagram: true,
    mostrarKitsComparador: true,
    
    // Imágenes
    defaultImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    testimonialPlaceholder: "https://images.unsplash.com/photo-1557862921-37829c790f19?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    
    // Performance
    lazyLoadOffset: "200px",
    cacheDuration: 3600, // 1 hora en segundos
    
    // Analytics
    ga4Id: "G-XXXXXXXXXX", // Reemplazar con tu ID de GA4
    trackEvents: true
  },
  
  // Sistema de testimonios
  testimonios: {
    minCaracteres: 20,
    maxCaracteres: 500,
    autoRotateInterval: 8000, // 8 segundos
    mostrarVideo: true,
    filtros: ['all', 'full', 'medium', 'standar']
  },
  
  // Sistema de comparación
  comparador: {
    modos: ['split', 'slider', 'overlay'],
    defaultMode: 'split',
    animationDuration: 300
  },
  
  // Mobile Navigation
  mobileNav: {
    items: [
      { icon: "fa-home", label: "Inicio", section: "home" },
      { icon: "fa-car", label: "Vehículos", section: "vehicles" },
      { icon: "fa-crown", label: "Kits", section: "customize" },
      { icon: "fa-trophy", label: "Vendidos", section: "sold" },
      { icon: "fa-phone", label: "Contacto", section: "contact" }
    ]
  }
};

console.log('⚙️ Configuración cargada - Modo Supabase Premium');
console.log('📊 Tablas configuradas:', Object.keys(CONFIG.supabase.tables));