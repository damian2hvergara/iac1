// config.js - CONFIGURACIÓN COMPLETA SIN PALABRAS RESERVADAS
const CONFIG = {
  supabase: {
    url: "https://cflpmluvhfldewiitymh.supabase.co",
    anonKey: "sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K",
    serviceKey: "sb_secret_su3AIpWkxPUYW1HLzT1NOw_ssNlHwwT",
    tabla: "vehiculos_publicos"
  },
  
  contacto: {
    whatsapp: "56938654827",
    instagram: "import_american_cars",
    email: "contacto@importamericancars.cl",
    telefono: "+56 9 8145 8545",
    ubicacion: "Zona Franca Arica, Chile"
  },
  
  app: {
    nombre: "Import American Cars Arica",
    imagenPorDefecto: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    
    estados: {
      stock: {
        texto: "En Stock Arica",
        color: "#34C759",
        icono: "fa-check-circle"
      },
      transit: {
        texto: "En Tránsito",
        color: "#FF9500",
        icono: "fa-shipping-fast"
      },
      reserved: {
        texto: "Reservado",
        color: "#0066cc",
        icono: "fa-calendar-check"
      }
    },
    
    kitsPorDefecto: [
      {
        id: "standard",
        nombre: "Standard",
        precio: 0,
        descripcion: "Preparación básica incluida",
        color: "#CD7F32",
        icon: "fa-star",
        incluye: ["Limpieza completa", "Revisión mecánica", "Documentación", "Garantía 30 días"]
      },
      {
        id: "medium",
        nombre: "Medium",
        precio: 1200000,
        descripcion: "Mejoras estéticas avanzadas",
        color: "#C0C0C0",
        icon: "fa-medal",
        incluye: ["Llantas 20\"", "Tratamiento cerámico", "Audio premium", "Asistencia 6 meses"]
      },
      {
        id: "full",
        nombre: "Full",
        precio: 2500000,
        descripcion: "Transformación premium completa",
        color: "#FFD700",
        icon: "fa-crown",
        incluye: ["Suspensión deportiva", "Kit carrocería", "Interior cuero", "Asistencia 12 meses"]
      }
    ]
  },
  
  urls: {
    social: {
      whatsapp: "https://wa.me/56938654827",
      instagram: "https://www.instagram.com/import_american_cars"
    }
  },
  
  clavesAlmacenamiento: {
    vehiculos: "iac_vehiculos_cache",
    kits: "iac_kits_cache",
    preferenciasUsuario: "iac_user_prefs"
  }
};

// Exportar como módulo ES6
export { CONFIG };
