// productos-manager.js - VERSIÓN COMPLETA Y CORREGIDA
export class ProductosManager {
  constructor(config) {
    console.log('🚗 Creando ProductosManager...');
    
    this.config = config || window.CONFIG;
    
    // Datos
    this.vehiculos = [];
    this.kits = [];
    this.currentFilter = "all";
    this.stats = { total: 0, stock: 0, transit: 0, reserved: 0 };
    
    // Estado
    this.isLoading = false;
    this.initialized = false;
    this.supabaseService = null;
    
    // Cache
    this.cache = new Map();
    
    console.log('🚗 ProductosManager creado (sin inicializar)');
  }
  
  async init() {
    if (this.initialized) {
      console.log('⚠️ ProductosManager ya está inicializado');
      return true;
    }
    
    console.log('🚗 Inicializando ProductosManager...');
    
    try {
      // 1. Verificar que SupabaseService esté disponible
      if (typeof SupabaseService === 'undefined') {
        console.error('❌ SupabaseService no está disponible');
        throw new Error('Módulo SupabaseService no encontrado');
      }
      
      this.supabaseService = SupabaseService;
      console.log('✅ SupabaseService referenciado');
      
      // 2. Inicializar SupabaseService si no está inicializado
      if (!this.supabaseService.initialized) {
        console.log('🔄 Inicializando SupabaseService...');
        const supabaseInitialized = await this.supabaseService.init(this.config);
        
        if (!supabaseInitialized) {
          console.error('❌ No se pudo inicializar SupabaseService');
          throw new Error('Error de conexión con la base de datos');
        }
      }
      
      console.log('✅ SupabaseService listo');
      
      // 3. Cargar kits (método estático)
      console.log('📦 Cargando kits...');
      this.kits = await this.supabaseService.getKits();
      console.log(`✅ ${this.kits.length} kits cargados`);
      
      // 4. Cargar vehículos (método estático)
      console.log('🚗 Cargando vehículos...');
      this.vehiculos = await this.supabaseService.getVehiculos();
      console.log(`✅ ${this.vehiculos.length} vehículos cargados`);
      
      // 5. Actualizar estadísticas
      this.actualizarEstadisticas();
      console.log('📊 Estadísticas:', this.stats);
      
      // 6. Actualizar UI inicial
      this.actualizarContadoresUI();
      
      // 7. Renderizar vehículos
      this.renderVehiculos();
      
      this.initialized = true;
      console.log('✅ ProductosManager inicializado correctamente');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error crítico inicializando ProductosManager:', error);
      this.mostrarErrorInicializacion(error);
      return false;
    }
  }
  
  async cargarVehiculos(forceRefresh = false) {
    if (this.isLoading) {
      console.log('⏳ Ya se está cargando, ignorando llamada duplicada');
      return;
    }
    
    this.isLoading = true;
    console.log(forceRefresh ? '🔄 Recargando vehículos...' : '📡 Cargando vehículos...');
    
    try {
      // Mostrar estado de carga
      this.mostrarLoading();
      
      // Obtener vehículos usando el método estático
      if (!this.supabaseService || typeof this.supabaseService.getVehiculos !== 'function') {
        throw new Error('SupabaseService no disponible');
      }
      
      this.vehiculos = await this.supabaseService.getVehiculos(forceRefresh);
      
      if (!this.vehiculos || this.vehiculos.length === 0) {
        console.warn('⚠️ No se obtuvieron vehículos');
        this.mostrarMensajeSinVehiculos();
      } else {
        console.log(`✅ ${this.vehiculos.length} vehículos obtenidos`);
        
        // Actualizar estadísticas
        this.actualizarEstadisticas();
        this.actualizarContadoresUI();
        
        // Renderizar
        this.renderVehiculos();
        
        // Notificación de éxito
        if (forceRefresh && window.UINotifications) {
          window.UINotifications.success(`Vehículos actualizados: ${this.vehiculos.length}`, 3000);
        }
      }
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      this.mostrarErrorCarga();
      
      // Notificación de error
      if (window.UINotifications) {
        window.UINotifications.error('Error al cargar vehículos', 5000);
      }
      
    } finally {
      this.isLoading = false;
      this.ocultarLoading();
    }
  }
  
  async cargarKits() {
    try {
      console.log('📦 Cargando kits...');
      
      if (!this.supabaseService || typeof this.supabaseService.getKits !== 'function') {
        console.warn('⚠️ SupabaseService no disponible, usando kits del config');
        this.kits = this.config?.app?.kitsDefault || [];
      } else {
        this.kits = await this.supabaseService.getKits();
      }
      
      console.log(`✅ ${this.kits.length} kits cargados`);
      return this.kits;
      
    } catch (error) {
      console.error('❌ Error cargando kits:', error);
      this.kits = this.config?.app?.kitsDefault || [];
      console.log('🔄 Usando kits por defecto del config');
      return this.kits;
    }
  }
  
  filtrarVehiculos(filter) {
    console.log(`🎯 Aplicando filtro: ${filter}`);
    
    this.currentFilter = filter;
    
    let vehiculosFiltrados = this.vehiculos;
    
    if (filter !== 'all') {
      vehiculosFiltrados = this.vehiculos.filter(v => 
        v.estado === filter
      );
    }
    
    console.log(`📊 ${vehiculosFiltrados.length} vehículos después del filtro`);
    this.renderVehiculos(vehiculosFiltrados);
    this.actualizarBotonesFiltro(filter);
    
    // Actualizar contador del filtro
    const filterCount = document.getElementById('filterCount');
    if (filterCount) {
      filterCount.textContent = vehiculosFiltrados.length;
    }
    
    // Scroll suave a la sección de vehículos
    if (filter !== this.currentFilter) {
      setTimeout(() => {
        if (window.UICore) {
          window.UICore.smoothScrollTo('vehiculos', 100);
        }
      }, 100);
    }
  }
  
  actualizarEstadisticas() {
    this.stats = {
      total: this.vehiculos.length,
      stock: this.vehiculos.filter(v => v.estado === 'stock').length,
      transit: this.vehiculos.filter(v => v.estado === 'transit').length,
      reserved: this.vehiculos.filter(v => v.estado === 'reserved').length
    };
    
    console.log('📊 Estadísticas actualizadas:', this.stats);
  }
  
  actualizarContadoresUI() {
    console.log('🔄 Actualizando contadores UI...');
    
    // Actualizar contadores principales en el hero
    const ids = ['totalCount', 'stockCount', 'transitCount', 'reservedCount'];
    const values = [this.stats.total, this.stats.stock, this.stats.transit, this.stats.reserved];
    
    ids.forEach((id, index) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = values[index];
        console.log(`  ${id}: ${values[index]}`);
      }
    });
    
    // Actualizar contador del filtro "Todos"
    const filterCount = document.getElementById('filterCount');
    if (filterCount) {
      filterCount.textContent = this.stats.total;
      console.log(`  filterCount: ${this.stats.total}`);
    }
    
    // Actualizar estadísticas en tiempo real
    this.actualizarEstadisticasReales();
  }
  
  actualizarEstadisticasReales() {
    // Podemos agregar animaciones o efectos aquí
    const indicators = document.querySelectorAll('.indicator-number');
    indicators.forEach(indicator => {
      indicator.classList.add('pulse');
      setTimeout(() => indicator.classList.remove('pulse'), 500);
    });
  }
  
  actualizarBotonesFiltro(activeFilter) {
    document.querySelectorAll('.filter-button').forEach(btn => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
      
      // Animación para el botón activo
      if (isActive) {
        btn.classList.add('filter-active');
        setTimeout(() => btn.classList.remove('filter-active'), 300);
      }
    });
  }
  
  renderVehiculos(vehiculos = this.vehiculos) {
    const container = document.getElementById('vehiclesContainer');
    if (!container) {
      console.error('❌ Container vehiclesContainer no encontrado');
      return;
    }
    
    console.log(`🎨 Renderizando ${vehiculos.length} vehículos...`);
    
    if (!vehiculos || vehiculos.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      console.log('⚠️ No hay vehículos para mostrar');
      return;
    }
    
    // Crear HTML de todos los vehículos
    const vehiclesHTML = vehiculos.map(v => this.getVehicleCardHTML(v)).join('');
    container.innerHTML = vehiclesHTML;
    
    // Configurar eventos
    this.setupVehicleCardsEvents();
    
    console.log(`✅ ${vehiculos.length} vehículos renderizados`);
  }
  
  getVehicleCardHTML(vehiculo) {
    const imagen = vehiculo.imagenes?.[0] || vehiculo.imagen_principal || this.config.app.defaultImage;
    const precio = this.formatPrice(vehiculo.precio);
    const estadoColor = this.getEstadoColor(vehiculo.estado);
    const estadoTexto = this.getEstadoTexto(vehiculo.estado);
    const estadoIcono = vehiculo.estadoIcono || 'fa-circle';
    
    // Crear HTML de especificaciones
    const specs = [];
    if (vehiculo.ano) specs.push(`<div class="vehicle-spec"><i class="fas fa-calendar"></i> ${vehiculo.ano}</div>`);
    if (vehiculo.kilometraje) specs.push(`<div class="vehicle-spec"><i class="fas fa-road"></i> ${this.formatNumber(vehiculo.kilometraje)} km</div>`);
    if (vehiculo.motor) specs.push(`<div class="vehicle-spec"><i class="fas fa-cogs"></i> ${vehiculo.motor}</div>`);
    if (vehiculo.transmision) specs.push(`<div class="vehicle-spec"><i class="fas fa-exchange-alt"></i> ${vehiculo.transmision}</div>`);
    
    // Tags para marca y modelo
    const tags = [];
    if (vehiculo.marca) tags.push(`<span class="tag">${vehiculo.marca}</span>`);
    if (vehiculo.modelo) tags.push(`<span class="tag">${vehiculo.modelo}</span>`);
    
    return `
      <div class="card vehicle-card" data-vehicle-id="${vehiculo.id}">
        <div class="card-image-container">
          <img src="${imagen}" 
               alt="${vehiculo.nombre}" 
               class="card-image vehicle-image"
               loading="lazy"
               onerror="this.onerror=null; this.src='${this.config.app.defaultImage}'">
          <div class="vehicle-status" style="background: ${estadoColor}15; color: ${estadoColor}; border-color: ${estadoColor}30;">
            <i class="fas ${estadoIcono}"></i>
            ${estadoTexto}
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="card-title vehicle-name">${vehiculo.nombre}</h3>
          
          ${tags.length > 0 ? `
            <div class="vehicle-subtitle mb-3">
              ${tags.join('')}
            </div>
          ` : ''}
          
          <div class="vehicle-price mb-3">
            ${precio}
            ${vehiculo.ano ? `<span class="text-sm text-gray-500 ml-2">(${vehiculo.ano})</span>` : ''}
          </div>
          
          ${specs.length > 0 ? `
            <div class="vehicle-specs mb-4">
              ${specs.join('')}
            </div>
          ` : ''}
          
          ${vehiculo.descripcion ? `
            <div class="vehicle-description mb-4">
              <p class="text-sm text-gray-600">${vehiculo.descripcion.substring(0, 100)}${vehiculo.descripcion.length > 100 ? '...' : ''}</p>
            </div>
          ` : ''}
          
          <div class="vehicle-actions mt-auto">
            <button class="button button-small button-whatsapp" 
                    onclick="event.stopPropagation(); window.UIManager?.contactVehicle('${vehiculo.id}')"
                    aria-label="Consultar por WhatsApp">
              <i class="fab fa-whatsapp"></i> Consultar
            </button>
            <button class="button button-small button-outline" 
                    onclick="event.stopPropagation(); window.UIManager?.mostrarDetallesVehiculo('${vehiculo.id}')"
                    aria-label="Ver detalles">
              <i class="fas fa-eye"></i> Detalles
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  setupVehicleCardsEvents() {
    document.querySelectorAll('.vehicle-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No hacer nada si se hizo clic en un botón
        if (e.target.closest('button') || e.target.tagName === 'BUTTON') {
          return;
        }
        
        const vehicleId = card.dataset.vehicleId;
        if (vehicleId && window.UIManager) {
          window.UIManager.mostrarDetallesVehiculo(vehicleId);
        }
      });
      
      // Efecto hover para dispositivos con mouse
      card.addEventListener('mouseenter', () => {
        if (!window.UICore?.isMobile()) {
          card.classList.add('card-hover');
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('card-hover');
      });
    });
  }
  
  // ========== MÉTODOS DE UTILIDAD ==========
  
  getVehiculoById(id) {
    const vehiculo = this.vehiculos.find(v => v.id === id);
    if (!vehiculo) {
      console.warn(`⚠️ Vehículo con ID ${id} no encontrado`);
    }
    return vehiculo || null;
  }
  
  getKitsForDisplay() {
    return this.kits;
  }
  
  getWhatsAppUrl(vehiculo, kit = null) {
    if (!vehiculo) return this.config.urls.social.whatsapp;
    
    let mensaje = `Hola, estoy interesado en:\n\n`;
    mensaje += `*${vehiculo.nombre}*\n`;
    mensaje += `💰 *Precio:* ${this.formatPrice(vehiculo.precio)}\n`;
    mensaje += `📋 *Disponibilidad:* ${vehiculo.estadoTexto || this.getEstadoTexto(vehiculo.estado)}\n`;
    
    if (vehiculo.ano) mensaje += `📅 *Año:* ${vehiculo.ano}\n`;
    if (vehiculo.kilometraje) mensaje += `🛣️ *Kilometraje:* ${this.formatNumber(vehiculo.kilometraje)} km\n`;
    if (vehiculo.motor) mensaje += `⚙️ *Motor:* ${vehiculo.motor}\n`;
    if (vehiculo.modelo) mensaje += `🚗 *Modelo:* ${vehiculo.modelo}\n`;
    if (vehiculo.marca) mensaje += `🏭 *Marca:* ${vehiculo.marca}\n`;
    
    if (kit) {
      mensaje += `\n🎁 *Kit:* ${kit.nombre}\n`;
      mensaje += `📝 ${kit.descripcion}\n`;
      if (kit.precio > 0) mensaje += `💎 *Precio kit:* +${this.formatPrice(kit.precio)}\n`;
    }
    
    mensaje += `\nMe gustaría más información.`;
    
    const whatsappUrl = this.config.urls.social.whatsapp || 'https://wa.me/56938654827';
    return `${whatsappUrl}?text=${encodeURIComponent(mensaje)}`;
  }
  
  // ========== MÉTODOS DE FORMATO ==========
  
  formatPrice(price) {
    if (!price && price !== 0) return 'Consultar';
    const num = parseInt(price);
    if (isNaN(num) || num === 0) return 'Consultar';
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  getEstadoColor(estado) {
    const estados = this.config.app.estados;
    const estadoKey = estado?.toLowerCase() || 'stock';
    return estados[estadoKey]?.color || estados.stock.color;
  }
  
  getEstadoTexto(estado) {
    const estados = this.config.app.estados;
    const estadoKey = estado?.toLowerCase() || 'stock';
    return estados[estadoKey]?.texto || estados.stock.texto;
  }
  
  // ========== MÉTODOS DE UI ==========
  
  mostrarLoading() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <div class="loading-spinner" style="margin: 0 auto 1rem;">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
          </div>
          <p class="text-gray-600">Cargando vehículos...</p>
        </div>
      `;
    }
  }
  
  ocultarLoading() {
    // Se maneja automáticamente en renderVehiculos
  }
  
  getEmptyStateHTML() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div class="empty-state-icon" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;">
          <i class="fas fa-car"></i>
        </div>
        <h3 class="empty-state-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">No hay vehículos disponibles</h3>
        <p class="empty-state-message" style="color: var(--gray-600); margin-bottom: 1.5rem;">
          Estamos actualizando nuestro inventario.
        </p>
        <div class="empty-state-actions" style="display: flex; gap: 0.5rem; justify-content: center;">
          <button class="button button-small" onclick="window.productosManager?.cargarVehiculos(true)">
            <i class="fas fa-sync"></i> Reintentar
          </button>
          <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-small button-whatsapp">
            <i class="fab fa-whatsapp"></i> Consultar
          </a>
        </div>
      </div>
    `;
  }
  
  mostrarMensajeSinVehiculos() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = this.getEmptyStateHTML();
    }
  }
  
  mostrarErrorCarga() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div class="empty-state-icon" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="empty-state-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Error de conexión</h3>
          <p class="empty-state-message" style="color: var(--gray-600); margin-bottom: 1.5rem;">
            No pudimos cargar los vehículos en este momento.
          </p>
          <div class="empty-state-actions" style="display: flex; gap: 0.5rem; justify-content: center;">
            <button class="button" onclick="window.location.reload()">
              <i class="fas fa-redo"></i> Recargar página
            </button>
          </div>
        </div>
      `;
    }
  }
  
  mostrarErrorInicializacion(error) {
    console.error('💥 Error de inicialización:', error);
    
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <div class="empty-state-icon" style="font-size: 3rem; color: var(--error); margin-bottom: 1rem;">
            <i class="fas fa-times-circle"></i>
          </div>
          <h3 class="empty-state-title" style="font-size: 1.5rem; margin-bottom: 0.5rem;">Error del sistema</h3>
          <p class="empty-state-message" style="color: var(--gray-600); margin-bottom: 1.5rem;">
            Problema al inicializar el sistema.<br>
            ${error?.message || 'Error desconocido'}
          </p>
          <div class="empty-state-actions" style="display: flex; gap: 0.5rem; justify-content: center;">
            <button class="button" onclick="window.location.reload()">
              <i class="fas fa-redo"></i> Recargar aplicación
            </button>
            <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-outline">
              <i class="fab fa-whatsapp"></i> Soporte técnico
            </a>
          </div>
        </div>
      `;
    }
  }
  
  // ========== MÉTODOS ADICIONALES ==========
  
  buscarVehiculos(query) {
    if (!query || query.trim() === '') {
      return this.vehiculos;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return this.vehiculos.filter(vehiculo => {
      const searchFields = [
        vehiculo.nombre,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.descripcion,
        vehiculo.color,
        vehiculo.motor
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchTerm)
      );
    });
  }
  
  ordenarVehiculos(criterio = 'precio', direccion = 'asc') {
    const vehiculosCopy = [...this.vehiculos];
    
    vehiculosCopy.sort((a, b) => {
      let valorA = a[criterio];
      let valorB = b[criterio];
      
      // Convertir a números si es posible
      if (!isNaN(valorA) && !isNaN(valorB)) {
        valorA = parseFloat(valorA);
        valorB = parseFloat(valorB);
      }
      
      // Manejar valores nulos/undefined
      if (valorA === undefined || valorA === null) {
        return direccion === 'asc' ? 1 : -1;
      }
      if (valorB === undefined || valorB === null) {
        return direccion === 'asc' ? -1 : 1;
      }
      
      if (valorA < valorB) {
        return direccion === 'asc' ? -1 : 1;
      }
      if (valorA > valorB) {
        return direccion === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return vehiculosCopy;
  }
  
  getStats() {
    return this.stats;
  }
  
  getStatus() {
    return {
      initialized: this.initialized,
      vehiculosCount: this.vehiculos.length,
      kitsCount: this.kits.length,
      currentFilter: this.currentFilter,
      isLoading: this.isLoading
    };
  }
  
  // ========== MÉTODOS PARA DEBUG ==========
  
  debugInfo() {
    return {
      config: {
        supabaseUrl: this.config.supabase.url,
        table: this.config.supabase.table,
        anonKey: this.config.supabase.anonKey ? '✓ Configurada' : '✗ No configurada'
      },
      status: this.getStatus(),
      stats: this.stats,
      cache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      }
    };
  }
}

// Exportar también como default para compatibilidad
export default ProductosManager;
