import { CONFIG } from './config.js';
import { supabaseService } from './supabase.js';
import { UI } from './ui.js';

// Gestión de productos/vehículos - VERSIÓN PREMIUM
export class ProductosManager {
  constructor() {
    this.vehiculos = [];
    this.kits = [];
    this.currentFilter = "all";
    this.imagesCache = new Map(); // Cache para imágenes
  }
  
  // Cargar vehículos y kits desde Supabase
  async cargarVehiculos() {
    try {
      console.log('🚗 === INICIANDO CARGA DE VEHÍCULOS PREMIUM ===');
      UI.showLoading();
      
      // 1. Cargar Vehículos
      this.vehiculos = await supabaseService.getVehiculos();
      
      // 2. Cargar Kits
      this.kits = await supabaseService.getKits();
      
      console.log(`📦 ${this.vehiculos.length} vehículos cargados`);
      console.log(`📦 ${this.kits.length} kits cargados`);
      
      if (!this.vehiculos || this.vehiculos.length === 0) {
        console.warn('⚠️ No se encontraron vehículos');
        this.mostrarMensajeSinVehiculos();
        UI.hideLoading();
        return;
      }
      
      console.log('🖼️ Procesando imágenes premium...');
      
      // Procesar cada vehículo
      this.vehiculos = await Promise.all(
        this.vehiculos.map(async vehiculo => {
          return await this.procesarVehiculoPremium(vehiculo);
        })
      );
      
      this.actualizarContadores();
      UI.renderVehiculosGrid(this.vehiculos);
      UI.hideLoading();
      
      console.log('✅ === CARGA PREMIUM COMPLETADA ===');
      
      // Inicializar testimonios si están activos
      if (CONFIG.app.mostrarTestimonios && window.testimoniosManager) {
        setTimeout(() => {
          testimoniosManager.init();
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      UI.showError('Error al cargar los vehículos. Por favor, intenta nuevamente.');
      UI.hideLoading();
    }
  }
  
  // Procesar vehículo con galería premium
  async procesarVehiculoPremium(vehiculo) {
    // 1. Asignar ID y precio
    vehiculo.id = vehiculo.id || 'temp_id_' + Math.random();
    vehiculo.precio = supabaseService.findVehiclePrice(vehiculo);
    
    // 2. Procesar galería de imágenes (6-8 imágenes)
    vehiculo.imagenes = await this.procesarGaleriaImagenes(vehiculo);
    
    // 3. Imagen principal para cards
    vehiculo.imagen_principal_card = vehiculo.imagenes[0];
    
    // 4. Estado
    vehiculo.estado = this.normalizarEstado(vehiculo.estado);
    
    // 5. Procesar kits
    await this.procesarKitsParaVehiculo(vehiculo);
    
    // 6. Enriquecer con datos adicionales
    this.enriquecerDatosVehiculo(vehiculo);
    
    return vehiculo;
  }
  
  // Procesar galería de 6-8 imágenes
  async procesarGaleriaImagenes(vehiculo) {
    const imagenes = [];
    
    // Estrategia 1: Usar array de imágenes de Supabase
    if (Array.isArray(vehiculo.imagenes) && vehiculo.imagenes.length > 0) {
      const urlsValidas = vehiculo.imagenes
        .map(url => this.getOptimizedImageUrl(url))
        .filter(url => url && !url.includes('ejemplo-imagen.com'));
      
      imagenes.push(...urlsValidas.slice(0, 8)); // Máximo 8 imágenes
    }
    
    // Estrategia 2: Buscar en columnas individuales
    if (imagenes.length < 6) {
      const posiblesColumnas = [
        'imagen_1', 'imagen_2', 'imagen_3', 'imagen_4', 'imagen_5', 'imagen_6', 'imagen_7', 'imagen_8',
        'foto_principal', 'foto_1', 'foto_2', 'foto_3', 'foto_4', 'foto_5',
        'imagen_principal', 'url_imagen', 'main_image', 'photo_url'
      ];
      
      for (const columna of posiblesColumnas) {
        if (imagenes.length >= 8) break;
        
        if (vehiculo[columna] && typeof vehiculo[columna] === 'string' && vehiculo[columna].trim()) {
          const url = this.getOptimizedImageUrl(vehiculo[columna]);
          if (url && !url.includes('ejemplo-imagen.com') && !imagenes.includes(url)) {
            imagenes.push(url);
          }
        }
      }
    }
    
    // Estrategia 3: Completar con imágenes de categorías específicas
    if (imagenes.length < 6) {
      const categoriasFaltantes = 6 - imagenes.length;
      const imagenesCategoria = this.getCategorizedPlaceholderImages(vehiculo, categoriasFaltantes);
      imagenes.push(...imagenesCategoria);
    }
    
    // Estrategia 4: Fallback a imágenes por defecto
    if (imagenes.length === 0) {
      imagenes.push(
        'https://images.unsplash.com/photo-1580274455191-1c62238fa333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      );
    }
    
    // Limitar a 8 imágenes máximo
    return imagenes.slice(0, 8);
  }
  
  // Obtener imágenes placeholder categorizadas
  getCategorizedPlaceholderImages(vehiculo, count) {
    const categorias = [
      {
        tipo: 'exterior',
        urls: [
          'https://images.unsplash.com/photo-1580274455191-1c62238fa333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        tipo: 'interior',
        urls: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1555212697-194d092e3b8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        tipo: 'detalles',
        urls: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]
      }
    ];
    
    const selectedUrls = [];
    let categoriaIndex = 0;
    
    while (selectedUrls.length < count && categoriaIndex < categorias.length) {
      const urls = categorias[categoriaIndex].urls;
      for (const url of urls) {
        if (selectedUrls.length < count && !selectedUrls.includes(url)) {
          selectedUrls.push(url);
        }
      }
      categoriaIndex++;
    }
    
    return selectedUrls;
  }
  
  // Obtener URL optimizada para Cloudinary
  getOptimizedImageUrl(publicId, size = 'card') {
    if (!publicId) return null;
    
    // Si ya es una URL completa
    if (publicId.startsWith('http')) {
      if (publicId.includes('ejemplo-imagen.com')) {
        return null;
      }
      
      // Si es de Cloudinary, optimizarla
      if (publicId.includes('cloudinary.com')) {
        return this.optimizeCloudinaryUrl(publicId, size);
      }
      
      return publicId;
    }
    
    // Limpiar publicId
    let cleanId = publicId.trim();
    
    // Remover extensión si existe
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    for (const ext of extensions) {
      if (cleanId.toLowerCase().endsWith(ext)) {
        cleanId = cleanId.substring(0, cleanId.length - ext.length);
        break;
      }
    }
    
    // Construir URL optimizada de Cloudinary
    const transformation = CONFIG.cloudinary.transformations[size] || 'q_auto,f_auto';
    
    if (cleanId.includes('/')) {
      const parts = cleanId.split('/');
      const filename = parts[parts.length - 1];
      return `https://res.cloudinary.com/${CONFIG.cloudinary.cloudName}/image/upload/${transformation}/vehiculos/${filename}`;
    }
    
    return `https://res.cloudinary.com/${CONFIG.cloudinary.cloudName}/image/upload/${transformation}/vehiculos/${cleanId}`;
  }
  
  // Optimizar URL existente de Cloudinary
  optimizeCloudinaryUrl(url, size) {
    const transformation = CONFIG.cloudinary.transformations[size];
    
    if (url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformation}/`);
    }
    
    return url;
  }
  
  // Normalizar estado del vehículo
  normalizarEstado(estado) {
    if (!estado) return 'reserve';
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower.includes('stock') || estadoLower.includes('disponible')) {
      return 'stock';
    } else if (estadoLower.includes('transit') || estadoLower.includes('transito') || estadoLower.includes('camino')) {
      return 'transit';
    } else {
      return 'reserve';
    }
  }
  
  // Procesar kits para vehículo con precios específicos
  async procesarKitsParaVehiculo(vehiculo) {
    // Si ya tiene kits, asegurar que estén completos
    if (vehiculo.kits && Array.isArray(vehiculo.kits)) {
      vehiculo.kits = await this.enriquecerKitsConPrecios(vehiculo.kits, vehiculo.id);
      return;
    }
    
    // Crear kits basados en kits generales
    vehiculo.kits = await Promise.all(
      this.kits.map(async kit => {
        const kitVehiculo = { ...kit };
        
        // Obtener precio específico desde Supabase
        const precioEspecifico = await supabaseService.getPrecioEspecifico(vehiculo.id, kit.id);
        if (precioEspecifico !== null) {
          kitVehiculo.precio = precioEspecifico;
        }
        
        // Asignar includes si no existen
        if (!kitVehiculo.includes) {
          kitVehiculo.includes = this.getDefaultIncludesForKit(kitVehiculo.nivel);
        }
        
        // Obtener imagen específica si existe
        const imagenesKit = await supabaseService.getKitImagesForVehicle(vehiculo.id, kit.id);
        if (imagenesKit && imagenesKit.length > 0) {
          kitVehiculo.imagen_kit = imagenesKit[0].imagen_url;
          kitVehiculo.imagenes_kit = imagenesKit.map(img => img.imagen_url);
        } else {
          kitVehiculo.imagen_kit = vehiculo.imagen_principal_card;
        }
        
        return kitVehiculo;
      })
    );
  }
  
  // Enriquecer kits con precios específicos
  async enriquecerKitsConPrecios(kits, vehiculoId) {
    return await Promise.all(
      kits.map(async kit => {
        const precioEspecifico = await supabaseService.getPrecioEspecifico(vehiculoId, kit.id);
        if (precioEspecifico !== null) {
          return { ...kit, precio: precioEspecifico };
        }
        return kit;
      })
    );
  }
  
  // Enriquecer datos del vehículo
  enriquecerDatosVehiculo(vehiculo) {
    // Asegurar descripción
    if (!vehiculo.descripcion) {
      vehiculo.descripcion = `${vehiculo.nombre || 'Vehículo'} importado desde USA. ` +
                            `Estado: ${vehiculo.estado === 'stock' ? 'Disponible inmediatamente en Arica.' : 
                                     vehiculo.estado === 'transit' ? 'En camino desde USA.' : 
                                     'Disponible para reserva.'}`;
    }
    
    // Normalizar año
    if (vehiculo.ano) {
      vehiculo.ano = parseInt(vehiculo.ano);
    }
    
    // Normalizar kilometraje
    if (vehiculo.kilometraje) {
      vehiculo.kilometraje = parseInt(vehiculo.kilometraje);
    }
  }
  
  // Resto de métodos (se mantienen similares pero optimizados)
  mostrarMensajeSinVehiculos() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="no-vehicles-message">
          <div class="empty-state">
            <i class="fas fa-car"></i>
            <h3>No hay vehículos disponibles</h3>
            <p>Estamos actualizando nuestro inventario. Contáctanos para consultar por próximos arribos.</p>
            <a href="https://wa.me/${CONFIG.contacto.whatsapp}" target="_blank" class="button whatsapp-btn">
              <i class="fab fa-whatsapp"></i> Consultar Disponibilidad
            </a>
          </div>
        </div>
      `;
    }
  }
  
  getDefaultIncludesForKit(nivel) {
    const includesMap = {
      'standar': [
        "Lavado y encerado exterior completo",
        "Limpieza interior profunda",
        "Revisión mecánica básica",
        "Cambio de aceite y filtros",
        "Documentación en regla"
      ],
      'medium': [
        "Todo lo del kit Standard",
        "Llantas deportivas 20\"",
        "Tinte de ventanas premium",
        "Step bar laterales",
        "Sistema de audio mejorado"
      ],
      'full': [
        "Todo lo del kit Medium",
        "Lift kit suspensión 2\"",
        "Rines Fuel de 22\"",
        "Neumáticos Off-Road 35\"",
        "Kit carrocería exclusivo",
        "Sistema de escape deportivo"
      ]
    };
    
    return includesMap[nivel] || includesMap['standar'];
  }
  
  getKitsForDisplay() {
    const standarKit = this.kits.find(k => k.nivel === 'standar');
    const otherKits = this.kits.filter(k => k.nivel !== 'standar');
    return standarKit ? [standarKit, ...otherKits] : this.kits;
  }
  
  async getCustomizationImage(vehiculoId, kitId) {
    // Cache check
    const cacheKey = `${vehiculoId}_${kitId}`;
    if (this.imagesCache.has(cacheKey)) {
      return this.imagesCache.get(cacheKey);
    }
    
    // Obtener imagen específica
    const imagenesKit = await supabaseService.getKitImagesForVehicle(vehiculoId, kitId);
    
    if (imagenesKit && imagenesKit.length > 0) {
      const imagenUrl = imagenesKit[0].imagen_url;
      this.imagesCache.set(cacheKey, imagenUrl);
      return imagenUrl;
    }
    
    // Fallback a imagen del vehículo
    const vehiculo = this.getVehiculoById(vehiculoId);
    if (vehiculo) {
      const imagenUrl = vehiculo.imagen_principal_card || vehiculo.imagenes?.[0];
      this.imagesCache.set(cacheKey, imagenUrl);
      return imagenUrl;
    }
    
    return CONFIG.app.defaultImage;
  }
  
  getVehiculoById(id) {
    let vehiculo = this.vehiculos.find(v => v.id === id);
    if (vehiculo) return vehiculo;
    
    vehiculo = this.vehiculos.find(v => String(v.id) === String(id));
    return vehiculo || null;
  }
  
  actualizarContadores() {
    const stockCount = this.vehiculos.filter(v => v.estado === 'stock').length;
    const transitCount = this.vehiculos.filter(v => v.estado === 'transit').length;
    const reserveCount = this.vehiculos.filter(v => v.estado === 'reserve').length;
    
    UI.updateCounter('stockCount', stockCount);
    UI.updateCounter('transitCount', transitCount);
    UI.updateCounter('reserveCount', reserveCount);
    
    // Actualizar también en mobile menu
    const mobileStockCount = document.getElementById('mobileStockCount');
    if (mobileStockCount) {
      mobileStockCount.textContent = stockCount;
    }
  }
  
  filtrarVehiculos(filter) {
    this.currentFilter = filter;
    let vehiculosFiltrados = this.vehiculos;
    
    if (filter !== 'all') {
      vehiculosFiltrados = this.vehiculos.filter(v => v.estado === filter);
    }
    
    UI.updateFilterButtons(filter);
    UI.renderVehiculosGrid(vehiculosFiltrados);
    
    // Track event
    if (window.supabaseService) {
      window.supabaseService.trackEvent('filter_applied', {
        filter,
        result_count: vehiculosFiltrados.length
      });
    }
  }
  
  formatPrice(price) {
    if (CONFIG.app.mostrarPrecios === false) {
      return 'Consultar';
    }
    
    if (!price && price !== 0) {
      return 'Consultar';
    }
    
    const num = parseInt(price);
    if (isNaN(num)) {
      return 'Consultar';
    }
    
    if (num === 0) {
      return 'Consultar';
    }
    
    return '$' + num.toLocaleString('es-CL');
  }
  
  getWhatsAppUrl(vehiculo, kit = null) {
    const statusText = 
      vehiculo.estado === 'stock' ? 'En Stock Arica' : 
      vehiculo.estado === 'transit' ? 'En Tránsito' : 
      'Para Reservar';
    
    let message = `Hola, estoy interesado en el vehículo:\n\n`;
    message += `*${vehiculo.nombre}*\n`;
    
    if (vehiculo.precio > 0) {
      message += `*Precio:* ${this.formatPrice(vehiculo.precio)} ${CONFIG.app.moneda}\n`;
    } else {
      message += `*Precio:* Consultar\n`;
    }
    
    message += `*Estado:* ${statusText}\n`;
    
    if (kit) {
      message += `\n*Kit Upgrade seleccionado:* ${kit.nombre}\n`;
      if (kit.precio > 0) {
        message += `*Precio Kit:* +${this.formatPrice(kit.precio)}\n`;
        const total = (vehiculo.precio || 0) + kit.precio;
        if (total > 0) {
          message += `*Precio Total Estimado:* ${this.formatPrice(total)} ${CONFIG.app.moneda}\n`;
        }
      } else {
        message += `*Kit:* Básico Incluido\n`;
      }
      
      if (kit.includes && kit.includes.length > 0) {
        message += `\n*Incluye:*\n`;
        kit.includes.forEach(item => {
          message += `   ✅ ${item}\n`;
        });
      }
    }
    
    message += `\nURL de referencia: ${window.location.href}`;
    
    return `https://wa.me/${CONFIG.contacto.whatsapp}?text=${encodeURIComponent(message)}`;
  }
  
  getKitById(kitId) {
    return this.kits.find(k => k.id === kitId) || null;
  }
  
  getVehiculos() {
    return this.vehiculos;
  }
  
  getKitsForVehicle(vehicleId) {
    const vehiculo = this.getVehiculoById(vehicleId);
    if (!vehiculo) return [];
    
    return vehiculo.kits || this.kits;
  }
}

// Instancia global
export const productosManager = new ProductosManager();
window.productosManager = productosManager;