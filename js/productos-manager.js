// ===================== PRODUCTOS MANAGER MEJORADO =====================
class ProductosManager {
  constructor(config) {
    this.config = config || window.CONFIG;
    this.supabaseService = new SupabaseService(this.config);
    this.vehiculos = [];
    this.kits = [];
    this.currentFilter = "all";
    this.filters = {
      estado: null,
      marca: null,
      minPrecio: null,
      maxPrecio: null,
      sortBy: 'orden',
      sortOrder: 'asc'
    };
    this.stats = {
      total: 0,
      stock: 0,
      transit: 0,
      reserved: 0
    };
    this.isLoading = false;
    this.init();
  }
  
  async init() {
    console.log('🚗 Inicializando ProductosManager...');
    
    // Cargar configuración de usuario
    this.loadUserPreferences();
    
    // Testear conexión a Supabase
    const isConnected = await this.supabaseService.testConnection();
    if (!isConnected) {
      console.warn('⚠️ Sin conexión a Supabase. Usando datos locales.');
      UINotifications.warning('Modo offline activado. Mostrando datos almacenados.', 5000);
    }
    
    // Cargar kits primero (son más pequeños)
    await this.cargarKits();
    
    // Cargar vehículos
    await this.cargarVehiculos();
    
    // Actualizar estadísticas
    this.actualizarEstadisticas();
    
    console.log('✅ ProductosManager listo');
    return true;
  }
  
  async cargarVehiculos(forceRefresh = false) {
    if (this.isLoading) {
      console.log('⏳ Ya se están cargando vehículos...');
      return;
    }
    
    this.isLoading = true;
    
    try {
      // Mostrar loading en UI
      if (window.UIManager) {
        window.UIManager.showLoading('vehiclesContainer', 'Cargando vehículos...');
      }
      
      // Obtener vehículos del servicio
      this.vehiculos = await this.supabaseService.getVehiculos(forceRefresh);
      
      if (this.vehiculos.length === 0) {
        this.mostrarMensajeSinVehiculos();
        return;
      }
      
      // Aplicar filtros guardados
      this.aplicarFiltrosGuardados();
      
      // Renderizar vehículos
      this.renderVehiculos();
      
      // Actualizar contadores en UI
      this.actualizarContadoresUI();
      
      // Guardar timestamp de última actualización
      this.guardarUltimaActualizacion();
      
      // Evento para notificar que los vehículos se cargaron
      this.emitirEvento('vehiculos:cargados', {
        count: this.vehiculos.length,
        forceRefresh
      });
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      
      // Mostrar error en UI
      if (window.UINotifications) {
        window.UINotifications.error('Error al cargar los vehículos. Intenta nuevamente.');
      }
      
      this.mostrarErrorCarga();
      
    } finally {
      this.isLoading = false;
      
      // Ocultar loading
      if (window.UIManager) {
        window.UIManager.hideLoading('vehiclesContainer');
      }
    }
  }
  
  async cargarKits(forceRefresh = false) {
    try {
      this.kits = await this.supabaseService.getKits(forceRefresh);
      
      // Actualizar kits en UIKits si está disponible
      if (window.UIKits) {
        window.UIKits.updateKits(this.kits);
      }
      
      console.log(`✅ ${this.kits.length} kits cargados`);
      
    } catch (error) {
      console.error('❌ Error cargando kits:', error);
      this.kits = this.config.app.kitsDefault;
    }
  }
  
  async buscarVehiculos(query, filters = {}) {
    try {
      // Mostrar loading
      if (window.UIManager) {
        window.UIManager.showLoading('vehiclesContainer', 'Buscando vehículos...');
      }
      
      // Combinar filtros
      const filtrosCombinados = { ...this.filters, ...filters };
      
      // Buscar en Supabase
      const resultados = await this.supabaseService.searchVehiculos(query, filtrosCombinados);
      
      // Renderizar resultados
      this.renderVehiculos(resultados);
      
      // Mostrar mensaje si no hay resultados
      if (resultados.length === 0) {
        this.mostrarMensajeSinResultados(query);
      }
      
      return resultados;
      
    } catch (error) {
      console.error('❌ Error buscando vehículos:', error);
      
      // Buscar localmente como fallback
      const resultadosLocales = this.buscarLocalmente(query, filters);
      this.renderVehiculos(resultadosLocales);
      
      if (resultadosLocales.length === 0) {
        this.mostrarMensajeSinResultados(query);
      }
      
      return resultadosLocales;
      
    } finally {
      // Ocultar loading
      if (window.UIManager) {
        window.UIManager.hideLoading('vehiclesContainer');
      }
    }
  }
  
  buscarLocalmente(query, filters = {}) {
    if (!query && !Object.keys(filters).length) {
      return this.getVehiculosFiltrados();
    }
    
    return this.vehiculos.filter(vehiculo => {
      // Búsqueda por texto
      if (query) {
        const searchable = [
          vehiculo.nombre,
          vehiculo.descripcion,
          vehiculo.marca,
          vehiculo.modelo,
          vehiculo.motor
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(query.toLowerCase())) {
          return false;
        }
      }
      
      // Filtros
      if (filters.estado && vehiculo.estado !== filters.estado) {
        return false;
      }
      
      if (filters.marca && vehiculo.marca !== filters.marca) {
        return false;
      }
      
      if (filters.minPrecio && vehiculo.precio < filters.minPrecio) {
        return false;
      }
      
      if (filters.maxPrecio && vehiculo.precio > filters.maxPrecio) {
        return false;
      }
      
      return true;
    });
  }
  
  filtrarVehiculos(filter) {
    this.currentFilter = filter;
    
    let vehiculosFiltrados = this.vehiculos;
    
    if (filter !== 'all') {
      vehiculosFiltrados = this.vehiculos.filter(v => v.estado === filter);
    }
    
    // Actualizar filtro en estado
    this.filters.estado = filter === 'all' ? null : filter;
    
    // Guardar preferencia de usuario
    this.guardarPreferenciaUsuario('filtroActivo', filter);
    
    // Actualizar UI
    this.actualizarBotonesFiltro(filter);
    this.renderVehiculos(vehiculosFiltrados);
    
    // Actualizar contador
    this.actualizarContadorFiltro(vehiculosFiltrados.length);
    
    // Evento
    this.emitirEvento('vehiculos:filtrados', {
      filter,
      count: vehiculosFiltrados.length
    });
  }
  
  aplicarFiltros(filters) {
    this.filters = { ...this.filters, ...filters };
    
    // Aplicar filtros
    const vehiculosFiltrados = this.vehiculos.filter(vehiculo => {
      if (this.filters.estado && vehiculo.estado !== this.filters.estado) {
        return false;
      }
      
      if (this.filters.marca && vehiculo.marca !== this.filters.marca) {
        return false;
      }
      
      if (this.filters.minPrecio && vehiculo.precio < this.filters.minPrecio) {
        return false;
      }
      
      if (this.filters.maxPrecio && vehiculo.precio > this.filters.maxPrecio) {
        return false;
      }
      
      return true;
    });
    
    // Ordenar
    vehiculosFiltrados.sort((a, b) => {
      let valueA = a[this.filters.sortBy];
      let valueB = b[this.filters.sortBy];
      
      // Convertir a números si es precio
      if (this.filters.sortBy === 'precio') {
        valueA = Number(valueA) || 0;
        valueB = Number(valueB) || 0;
      }
      
      if (this.filters.sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    this.renderVehiculos(vehiculosFiltrados);
    this.guardarFiltros();
  }
  
  getVehiculosFiltrados() {
    return this.vehiculos.filter(v => {
      if (this.currentFilter !== 'all' && v.estado !== this.currentFilter) {
        return false;
      }
      
      if (this.filters.marca && v.marca !== this.filters.marca) {
        return false;
      }
      
      if (this.filters.minPrecio && v.precio < this.filters.minPrecio) {
        return false;
      }
      
      if (this.filters.maxPrecio && v.precio > this.filters.maxPrecio) {
        return false;
      }
      
      return true;
    });
  }
  
  getVehiculoById(id) {
    return this.vehiculos.find(v => v.id === id) || null;
  }
  
  getVehiculoByIndex(index) {
    return this.vehiculos[index] || null;
  }
  
  getKitsForDisplay() {
    return this.kits;
  }
  
  getKitById(kitId) {
    return this.kits.find(k => k.id === kitId) || null;
  }
  
  getMarcasDisponibles() {
    const marcas = new Set();
    this.vehiculos.forEach(v => {
      if (v.marca) {
        marcas.add(v.marca);
      }
    });
    return Array.from(marcas).sort();
  }
  
  getRangoPrecios() {
    if (this.vehiculos.length === 0) {
      return { min: 0, max: 0 };
    }
    
    const precios = this.vehiculos.map(v => v.precio || 0).filter(p => p > 0);
    
    if (precios.length === 0) {
      return { min: 0, max: 0 };
    }
    
    return {
      min: Math.min(...precios),
      max: Math.max(...precios)
    };
  }
  
  // UI Methods
  renderVehiculos(vehiculos = this.getVehiculosFiltrados()) {
    const container = document.getElementById('vehiclesContainer');
    if (!container) return;
    
    if (!vehiculos || vehiculos.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }
    
    container.innerHTML = vehiculos.map(vehiculo => this.getVehicleCardHTML(vehiculo)).join('');
    
    // Agregar event listeners a las cards
    this.setupVehicleCardsEvents();
  }
  
  getVehicleCardHTML(vehiculo) {
    const primeraImagen = vehiculo.imagenes?.[0] || vehiculo.imagen_principal || this.config.app.defaultImage;
    const precioFormateado = this.formatPrice(vehiculo.precio);
    
    return `
      <div class="vehicle-card" data-vehicle-id="${vehiculo.id}" role="article" aria-label="${vehiculo.nombre}">
        <div class="card-image-container">
          <img src="${primeraImagen}" 
               alt="${vehiculo.nombre}" 
               class="vehicle-image"
               loading="lazy"
               onerror="this.src='${this.config.app.defaultImage}'">
          <div class="vehicle-status" style="background: ${vehiculo.estadoColor}10; color: ${vehiculo.estadoColor}; border-color: ${vehiculo.estadoColor}30;">
            <i class="fas ${vehiculo.estadoIcono}"></i>
            ${vehiculo.estadoTexto}
          </div>
        </div>
        
        <div class="vehicle-info">
          <h3 class="vehicle-name">${vehiculo.nombre}</h3>
          
          ${vehiculo.marca || vehiculo.modelo ? `
            <p class="vehicle-subtitle">
              ${vehiculo.marca ? `<span>${vehiculo.marca}</span>` : ''}
              ${vehiculo.modelo ? `<span>• ${vehiculo.modelo}</span>` : ''}
            </p>
          ` : ''}
          
          <div class="vehicle-price">${precioFormateado}</div>
          
          <div class="vehicle-specs">
            ${vehiculo.ano ? `<div class="vehicle-spec"><i class="fas fa-calendar"></i> ${vehiculo.ano}</div>` : ''}
            ${vehiculo.kilometraje ? `<div class="vehicle-spec"><i class="fas fa-road"></i> ${this.formatNumber(vehiculo.kilometraje)} km</div>` : ''}
            ${vehiculo.motor ? `<div class="vehicle-spec"><i class="fas fa-cogs"></i> ${vehiculo.motor}</div>` : ''}
          </div>
          
          <p class="vehicle-description">
            ${vehiculo.descripcion?.substring(0, 100) || 'Vehículo americano importado en excelentes condiciones.'}
            ${vehiculo.descripcion?.length > 100 ? '...' : ''}
          </p>
          
          <div class="vehicle-actions">
            <button class="button button-small button-whatsapp" 
                    onclick="event.stopPropagation(); window.UIManager.contactVehicle('${vehiculo.id}')"
                    aria-label="Consultar por WhatsApp sobre ${vehiculo.nombre}">
              <i class="fab fa-whatsapp"></i> Consultar
            </button>
            <button class="button button-small button-outline" 
                    onclick="event.stopPropagation(); window.UIManager.mostrarDetallesVehiculo('${vehiculo.id}')"
                    aria-label="Ver detalles de ${vehiculo.nombre}">
              <i class="fas fa-eye"></i> Detalles
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  getEmptyStateHTML() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas fa-car"></i>
        </div>
        <h3 class="empty-state-title">No hay vehículos disponibles</h3>
        <p class="empty-state-message">
          Por el momento no tenemos vehículos en esta categoría.<br>
          Pronto agregaremos nuevos modelos.
        </p>
        <div class="empty-state-actions">
          <button class="button" onclick="productosManager.cargarVehiculos(true)">
            <i class="fas fa-sync"></i> Recargar
          </button>
          <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-whatsapp">
            <i class="fab fa-whatsapp"></i> Consultar disponibilidad
          </a>
        </div>
      </div>
    `;
  }
  
  setupVehicleCardsEvents() {
    document.querySelectorAll('.vehicle-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // No activar si se hizo clic en un botón
        if (e.target.closest('button')) {
          return;
        }
        
        const vehicleId = card.dataset.vehicleId;
        if (vehicleId) {
          window.UIManager.mostrarDetallesVehiculo(vehicleId);
        }
      });
      
      // Soporte para teclado
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const vehicleId = card.dataset.vehicleId;
          if (vehicleId) {
            window.UIManager.mostrarDetallesVehiculo(vehicleId);
          }
        }
      });
      
      // Mejorar accesibilidad
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
    });
  }
  
  mostrarMensajeSinVehiculos() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-car-crash"></i>
          </div>
          <h3 class="empty-state-title">No hay vehículos en stock</h3>
          <p class="empty-state-message">
            Estamos actualizando nuestro inventario.<br>
            Vuelve pronto o contáctanos para saber qué tenemos disponible.
          </p>
          <div class="empty-state-actions">
            <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-whatsapp button-large">
              <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
            </a>
          </div>
        </div>
      `;
    }
  }
  
  mostrarErrorCarga() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="empty-state-title">Error al cargar vehículos</h3>
          <p class="empty-state-message">
            No pudimos cargar los vehículos en este momento.<br>
            Por favor, intenta nuevamente más tarde.
          </p>
          <div class="empty-state-actions">
            <button class="button" onclick="productosManager.cargarVehiculos(true)">
              <i class="fas fa-redo"></i> Reintentar
            </button>
            <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-outline">
              <i class="fab fa-whatsapp"></i> Contactar
            </a>
          </div>
        </div>
      `;
    }
  }
  
  mostrarMensajeSinResultados(query = '') {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3 class="empty-state-title">No encontramos resultados</h3>
          <p class="empty-state-message">
            ${query ? `No hay vehículos que coincidan con "${query}".` : 'No hay vehículos que coincidan con los filtros aplicados.'}<br>
            Intenta con otros términos o filtros.
          </p>
          <div class="empty-state-actions">
            <button class="button" onclick="productosManager.filtrarVehiculos('all')">
              <i class="fas fa-times"></i> Limpiar filtros
            </button>
            <button class="button button-outline" onclick="productosManager.cargarVehiculos()">
              <i class="fas fa-sync"></i> Ver todos
            </button>
          </div>
        </div>
      `;
    }
  }
  
  actualizarBotonesFiltro(activeFilter) {
    if (window.UIManager) {
      window.UIManager.updateFilterButtons(activeFilter);
    } else {
      // Fallback manual
      document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        btn.setAttribute('aria-pressed', btn.dataset.filter === activeFilter);
      });
    }
  }
  
  actualizarContadorFiltro(count) {
    const counter = document.getElementById('filterCount');
    if (counter) {
      counter.textContent = `(${count})`;
      counter.classList.add('updated');
      setTimeout(() => counter.classList.remove('updated'), 300);
    }
  }
  
  actualizarContadoresUI() {
    // Actualizar contadores en el hero
    this.actualizarContadorHero();
    
    // Actualizar estadísticas
    this.actualizarEstadisticasUI();
  }
  
  actualizarContadorHero() {
    const counters = {
      stockCount: this.stats.stock,
      transitCount: this.stats.transit,
      reservedCount: this.stats.reserved,
      totalCount: this.stats.total
    };
    
    Object.entries(counters).forEach(([id, count]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = count;
      }
    });
  }
  
  actualizarEstadisticas() {
    this.stats = {
      total: this.vehiculos.length,
      stock: this.vehiculos.filter(v => v.estado === 'stock').length,
      transit: this.vehiculos.filter(v => v.estado === 'transit').length,
      reserved: this.vehiculos.filter(v => v.estado === 'reserved').length
    };
  }
  
  actualizarEstadisticasUI() {
    // Actualizar badges o indicadores
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">${this.stats.total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat">
            <div class="stat-number">${this.stats.stock}</div>
            <div class="stat-label">En Stock</div>
          </div>
          <div class="stat">
            <div class="stat-number">${this.stats.transit}</div>
            <div class="stat-label">En Tránsito</div>
          </div>
          <div class="stat">
            <div class="stat-number">${this.stats.reserved}</div>
            <div class="stat-label">Reservados</div>
          </div>
        </div>
      `;
    }
  }
  
  // WhatsApp Integration
  getWhatsAppUrl(vehiculo, kit = null) {
    let mensaje = `Hola, estoy interesado en el vehículo:\n\n`;
    mensaje += `*${vehiculo.nombre || 'Vehículo'}*\n`;
    
    if (vehiculo.precio && this.config.app.mostrarPrecios) {
      mensaje += `💰 *Precio:* ${this.formatPrice(vehiculo.precio)}\n`;
    }
    
    mensaje += `📋 *Disponibilidad:* ${vehiculo.estadoTexto || vehiculo.estado}\n`;
    
    if (vehiculo.ano) {
      mensaje += `📅 *Año:* ${vehiculo.ano}\n`;
    }
    
    if (vehiculo.kilometraje) {
      mensaje += `🛣️ *Kilometraje:* ${this.formatNumber(vehiculo.kilometraje)} km\n`;
    }
    
    if (vehiculo.motor) {
      mensaje += `⚙️ *Motor:* ${vehiculo.motor}\n`;
    }
    
    if (kit) {
      mensaje += `\n🎁 *Kit seleccionado:* ${kit.nombre}\n`;
      if (kit.precio > 0) {
        mensaje += `💎 *Precio kit:* +${this.formatPrice(kit.precio)}\n`;
      }
      
      const total = (vehiculo.precio || 0) + (kit.precio || 0);
      mensaje += `💵 *Total estimado:* ${this.formatPrice(total)}\n`;
    }
    
    mensaje += `\nMe gustaría obtener más información sobre este vehículo.`;
    mensaje += `\n\n*Información de contacto:*\n`;
    mensaje += `📧 Email: ${this.config.contacto.email}\n`;
    mensaje += `📍 Ubicación: ${this.config.contacto.ubicacion}`;
    
    return `${this.config.urls.social.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }
  
  // Formatting methods
  formatPrice(price) {
    if (!this.config.app.mostrarPrecios) return 'Consultar';
    if (!price && price !== 0) return 'Consultar';
    
    const num = parseInt(price);
    if (isNaN(num) || num === 0) return 'Consultar';
    
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  getEstadoTexto(estado) {
    return this.config.app.estados[estado]?.texto || estado;
  }
  
  getEstadoColor(estado) {
    return this.config.app.estados[estado]?.color || '#86868b';
  }
  
  getEstadoIcono(estado) {
    return this.config.app.estados[estado]?.icono || 'fa-car';
  }
  
  // User preferences
  loadUserPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem(this.config.storageKeys.userPreferences)) || {};
      
      if (prefs.filtroActivo) {
        this.currentFilter = prefs.filtroActivo;
      }
      
      if (prefs.filtros) {
        this.filters = { ...this.filters, ...prefs.filtros };
      }
      
    } catch (error) {
      console.error('❌ Error cargando preferencias:', error);
    }
  }
  
  guardarPreferenciaUsuario(key, value) {
    try {
      const prefs = JSON.parse(localStorage.getItem(this.config.storageKeys.userPreferences)) || {};
      prefs[key] = value;
      localStorage.setItem(this.config.storageKeys.userPreferences, JSON.stringify(prefs));
    } catch (error) {
      console.error('❌ Error guardando preferencia:', error);
    }
  }
  
  guardarFiltros() {
    this.guardarPreferenciaUsuario('filtros', this.filters);
  }
  
  aplicarFiltrosGuardados() {
    if (this.filters.estado) {
      this.currentFilter = this.filters.estado;
    }
  }
  
  guardarUltimaActualizacion() {
    try {
      localStorage.setItem(
        this.config.storageKeys.lastUpdate,
        JSON.stringify({
          timestamp: Date.now(),
          count: this.vehiculos.length
        })
      );
    } catch (error) {
      console.error('❌ Error guardando última actualización:', error);
    }
  }
  
  getUltimaActualizacion() {
    try {
      const data = localStorage.getItem(this.config.storageKeys.lastUpdate);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
  
  // Event system
  emitirEvento(nombre, datos = {}) {
    const evento = new CustomEvent(`productos:${nombre}`, { detail: datos });
    document.dispatchEvent(evento);
  }
  
  // Refresh data
  async refreshData() {
    await this.cargarKits(true);
    await this.cargarVehiculos(true);
    
    if (window.UINotifications) {
      window.UINotifications.success('Datos actualizados correctamente', 3000);
    }
  }
  
  // Get summary for analytics
  getSummary() {
    return {
      totalVehicles: this.vehiculos.length,
      totalKits: this.kits.length,
      stats: this.stats,
      filters: this.filters,
      lastUpdate: this.getUltimaActualizacion()
    };
  }
}

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductosManager;
} else {
  // Hacer disponible globalmente
  window.ProductosManager = ProductosManager;
}
