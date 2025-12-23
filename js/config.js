[file name]: config.js
[file content begin]
// ===================== CONFIGURACIÓN CENTRALIZADA =====================
const CONFIG = {
  // Supabase Configuration
  supabase: {
    url: "https://cflpmluvhfldewiitymh.supabase.co",
    anonKey: "sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K",
    endpoints: {
      vehiculos: "/rest/v1/vehiculos_arica",
      imagenes: "/rest/v1/vehiculos_arica",
      kits: "/rest/v1/vehiculos_arica"
    }
  },
  
  // Contact Information
  contacto: {
    whatsapp: "56938654827",
    instagram: "import_american_cars",
    instagramUrl: "https://www.instagram.com/import_american_cars",
    email: "contacto@importamericancars.cl",
    telefono: "+56 9 8145 8545",
    ubicacion: "Zona Franca Arica, Chile",
    horario: "Lunes a Viernes 9:00 - 19:00"
  },
  
  // Application Settings
  app: {
    nombre: "Import American Cars Arica",
    tagline: "El desierto merece su leyenda.",
    version: "2.0.0",
    
    // Features
    mostrarPrecios: true,
    mostrarWhatsApp: true,
    mostrarInstagram: true,
    mostrarKits: true,
    
    // Default Images
    defaultImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    heroImage: "https://res.cloudinary.com/df2gprqhp/image/upload/v1765988412/CHEVROLET_yjwbxt.jpg",
    
    // Estados de vehículos (mapeo con tus estados_inventario)
    estados: {
      stock: {
        texto: "En Stock Arica",
        color: "#34C759",
        icono: "fa-check-circle",
        orden: 1
      },
      transit: {
        texto: "En Tránsito",
        color: "#FF9500",
        icono: "fa-shipping-fast",
        orden: 2
      },
      reserved: {
        texto: "Reservado",
        color: "#0066cc",
        icono: "fa-calendar-check",
        orden: 3
      }
    },
    
    // Kits por defecto (se actualizan con precios de la tabla)
    kitsDefault: [
      {
        id: "standard",
        nombre: "Standard",
        precio: 0,
        descripcion: "Preparación básica incluida con cada vehículo",
        color: "#CD7F32",
        icon: "fa-star",
        includes: [
          "Limpieza completa exterior e interior",
          "Revisión mecánica básica",
          "Documentación en regla",
          "Garantía 30 días"
        ],
        orden: 1
      },
      {
        id: "medium",
        nombre: "Medium",
        precio: 1200000, // Valor por defecto, se actualiza desde BD
        descripcion: "Mejoras estéticas y funcionales avanzadas",
        color: "#C0C0C0",
        icon: "fa-medal",
        includes: [
          "Todo lo del Kit Standard",
          "Llantas deportivas 20\"",
          "Tratamiento cerámico de pintura",
          "Sistema de audio premium",
          "Asistencia 6 meses"
        ],
        orden: 2
      },
      {
        id: "full",
        nombre: "Full",
        precio: 2500000, // Valor por defecto, se actualiza desde BD
        descripcion: "Transformación premium completa",
        color: "#FFD700",
        icon: "fa-crown",
        includes: [
          "Todo lo del Kit Medium",
          "Suspensión deportiva ajustable",
          "Kit de carrocería exclusivo",
          "Interior en cuero premium",
          "Asistencia 12 meses",
          "Certificado de autenticidad"
        ],
        orden: 3
      }
    ],
    
    // Analytics
    analytics: {
      googleAnalyticsId: null,
      facebookPixelId: null,
      hotjarId: null
    },
    
    // Performance
    performance: {
      lazyLoadImages: true,
      preloadCriticalAssets: true,
      cacheDuration: 3600,
      debounceTime: 300,
      throttleTime: 100
    },
    
    // SEO
    seo: {
      title: "Import American Cars Arica | Vehículos Americanos Premium",
      description: "Importamos los vehículos americanos más icónicos para que escribas tu propia historia en el desierto más extenso del mundo.",
      keywords: "vehículos americanos, importación USA, Arica, kits upgrade, Ford, Chevrolet, RAM, 4x4, camionetas, pickup",
      ogImage: "https://res.cloudinary.com/df2gprqhp/image/upload/v1765988412/CHEVROLET_yjwbxt.jpg",
      twitterHandle: "@importamericancars"
    }
  },
  
  // URLs
  urls: {
    api: {
      vehiculos: "https://cflpmluvhfldewiitymh.supabase.co/rest/v1/vehiculos_arica",
      imagenes: "https://cflpmluvhfldewiitymh.supabase.co/rest/v1/vehiculos_arica",
      kits: "https://cflpmluvhfldewiitymh.supabase.co/rest/v1/vehiculos_arica"
    },
    social: {
      whatsapp: "https://wa.me/56938654827",
      instagram: "https://www.instagram.com/import_american_cars",
      facebook: null,
      twitter: null
    }
  },
  
  // Local Storage Keys
  storageKeys: {
    vehiculos: "iac_vehiculos_cache",
    kits: "iac_kits_cache",
    lastUpdate: "iac_last_update",
    userPreferences: "iac_user_prefs",
    cart: "iac_cart_items"
  }
};

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  // Hacer disponible globalmente
  window.CONFIG = CONFIG;
}
[file content end]
