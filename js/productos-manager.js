// productos-manager.js - VERSIÓN COMPLETA CORREGIDA

// ===================== PRODUCTOS MANAGER =====================
class ProductosManager {
  constructor(config) {
    this.config = config || window.CONFIG;
    this.supabaseService = null;
    this.vehiculos = [];
    this.kits = [];
    this.currentFilter = "all";
    this.filters = {};
    this.stats = { total: 0, stock: 0, transit: 0, reserved: 0 };
    this.isLoading = false;
    
    // Inicializar después de que SupabaseService esté disponible
    setTimeout(() => this.init(), 100);
  }
  
  async init() {
    console.log('🚗 Inicializando ProductosManager...');
    
    try {
      // Verificar que SupabaseService esté disponible
      if (typeof SupabaseService === 'undefined') {
        console.error('❌ SupabaseService no está definido');
        throw new Error('SupabaseService no disponible');
      }
      
      this.supabaseService = new SupabaseService(this.config);
      
      // Testear conexión
      const isConnected = await this.supabaseService.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Sin conexión a Supabase');
      }
      
      // Cargar datos
      await this.cargarKits();
      await this.cargarVehiculos();
      
      console.log('✅ ProductosManager listo');
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando:', error);
      this.mostrarErrorInicializacion();
      return false;
    }
  }
  
  async cargarVehiculos(forceRefresh = false) {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Mostrar loading
      this.mostrarLoading();
      
      // Obtener vehículos
      this.vehiculos = await this.supabaseService.getVehiculos(forceRefresh);
      
      if (this.vehiculos.length === 0) {
        this.mostrarMensajeSinVehiculos();
        return;
      }
      
      // Actualizar estadísticas
      this.actualizarEstadisticas();
      this.actualizarContadoresUI();
      
      // Renderizar
      this.renderVehiculos();
      
    } catch (error) {
      console.error('❌ Error cargando vehículos:', error);
      this.mostrarErrorCarga();
      
    } finally {
      this.isLoading = false;
      this.ocultarLoading();
    }
  }
  
  async cargarKits() {
    try {
      this.kits = await this.supabaseService.getKits();
      console.log(`✅ ${this.kits.length} kits cargados`);
    } catch (error) {
      console.error('❌ Error kits:', error);
      this.kits = this.config.app.kitsDefault;
    }
  }
  
  filtrarVehiculos(filter) {
    this.currentFilter = filter;
    
    let vehiculosFiltrados = this.vehiculos;
    
    if (filter !== 'all') {
      let estadoInventario;
      switch(filter) {
        case 'stock': estadoInventario = 'stock'; break;
        case 'transit': estadoInventario = 'transit'; break;
        case 'reserved': estadoInventario = 'reserved'; break;
        default: estadoInventario = filter;
      }
      
      vehiculosFiltrados = this.vehiculos.filter(v => 
        v.estado === estadoInventario
      );
    }
    
    this.renderVehiculos(vehiculosFiltrados);
    this.actualizarBotonesFiltro(filter);
    
    // Actualizar contador del filtro
    const filterCount = document.getElementById('filterCount');
    if (filterCount) {
      filterCount.textContent = vehiculosFiltrados.length;
    }
  }
  
  actualizarEstadisticas() {
    this.stats = {
      total: this.vehiculos.length,
      stock: this.vehiculos.filter(v => v.estado === 'stock').length,
      transit: this.vehiculos.filter(v => v.estado === 'transit').length,
      reserved: this.vehiculos.filter(v => v.estado === 'reserved').length
    };
  }
  
  actualizarContadoresUI() {
    // Actualizar contadores principales
    const ids = ['totalCount', 'stockCount', 'transitCount', 'reservedCount'];
    const values = [this.stats.total, this.stats.stock, this.stats.transit, this.stats.reserved];
    
    ids.forEach((id, index) => {
      const element = document.getElementById(id);
      if (element) element.textContent = values[index];
    });
    
    // Actualizar contador del filtro "Todos"
    const filterCount = document.getElementById('filterCount');
    if (filterCount) {
      filterCount.textContent = this.stats.total;
    }
  }
  
  actualizarBotonesFiltro(activeFilter) {
    document.querySelectorAll('.filter-button').forEach(btn => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
  }
  
  renderVehiculos(vehiculos = this.vehiculos) {
    const container = document.getElementById('vehiclesContainer');
    if (!container) return;
    
    if (!vehiculos || vehiculos.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }
    
    container.innerHTML = vehiculos.map(v => this.getVehicleCardHTML(v)).join('');
    this.setupVehicleCardsEvents();
  }
  
  getVehicleCardHTML(vehiculo) {
    const imagen = vehiculo.imagenes?.[0] || vehiculo.imagen_principal || this.config.app.defaultImage;
    const precio = this.formatPrice(vehiculo.precio);
    const estadoColor = this.getEstadoColor(vehiculo.estado);
    const estadoTexto = this.getEstadoTexto(vehiculo.estado);
    
    return `
      <div class="card vehicle-card" data-vehicle-id="${vehiculo.id}">
        <div class="card-image-container">
          <img src="${imagen}" 
               alt="${vehiculo.nombre}" 
               class="card-image vehicle-image"
               loading="lazy"
               onerror="this.src='${this.config.app.defaultImage}'">
          <div class="vehicle-status" style="background: ${estadoColor}10; color: ${estadoColor}; border-color: ${estadoColor}20;">
            <i class="fas ${vehiculo.estadoIcono || 'fa-circle'}"></i>
            ${estadoTexto}
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="card-title vehicle-name">${vehiculo.nombre}</h3>
          
          <div class="vehicle-subtitle mb-3">
            ${vehiculo.marca ? `<span class="tag">${vehiculo.marca}</span>` : ''}
            ${vehiculo.modelo ? `<span class="tag">${vehiculo.modelo}</span>` : ''}
          </div>
          
          <div class="vehicle-price mb-3">${precio}</div>
          
          <div class="vehicle-specs mb-4">
            ${vehiculo.ano ? `<div class="vehicle-spec"><i class="fas fa-calendar"></i> ${vehiculo.ano}</div>` : ''}
            ${vehiculo.kilometraje ? `<div class="vehicle-spec"><i class="fas fa-road"></i> ${this.formatNumber(vehiculo.kilometraje)} km</div>` : ''}
            ${vehiculo.motor ? `<div class="vehicle-spec"><i class="fas fa-cogs"></i> ${vehiculo.motor}</div>` : ''}
          </div>
          
          <div class="vehicle-actions mt-auto">
            <button class="button button-small button-whatsapp" 
                    onclick="event.stopPropagation(); window.UIManager?.contactVehicle('${vehiculo.id}')">
              <i class="fab fa-whatsapp"></i> Consultar
            </button>
            <button class="button button-small button-outline" 
                    onclick="event.stopPropagation(); window.UIManager?.mostrarDetallesVehiculo('${vehiculo.id}')">
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
        if (e.target.closest('button')) return;
        const vehicleId = card.dataset.vehicleId;
        if (vehicleId && window.UIManager) {
          window.UIManager.mostrarDetallesVehiculo(vehicleId);
        }
      });
    });
  }
  
  getVehiculoById(id) {
    return this.vehiculos.find(v => v.id === id) || null;
  }
  
  getKitsForDisplay() {
    return this.kits;
  }
  
  getWhatsAppUrl(vehiculo, kit = null) {
    let mensaje = `Hola, estoy interesado en:\n\n`;
    mensaje += `*${vehiculo.nombre}*\n`;
    mensaje += `💰 *Precio:* ${this.formatPrice(vehiculo.precio)}\n`;
    mensaje += `📋 *Disponibilidad:* ${this.getEstadoTexto(vehiculo.estado)}\n`;
    
    if (vehiculo.ano) mensaje += `📅 *Año:* ${vehiculo.ano}\n`;
    if (vehiculo.kilometraje) mensaje += `🛣️ *Kilometraje:* ${this.formatNumber(vehiculo.kilometraje)} km\n`;
    if (vehiculo.motor) mensaje += `⚙️ *Motor:* ${vehiculo.motor}\n`;
    
    if (kit) {
      mensaje += `\n🎁 *Kit:* ${kit.nombre}\n`;
      if (kit.precio > 0) mensaje += `💎 *Precio kit:* +${this.formatPrice(kit.precio)}\n`;
    }
    
    mensaje += `\nMe gustaría más información.`;
    return `${this.config.urls.social.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }
  
  // Métodos de utilidad
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
  
  // Métodos de UI
  mostrarLoading() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder" style="grid-column: 1 / -1;">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p class="loading-text">Cargando vehículos...</p>
        </div>
      `;
    }
  }
  
  ocultarLoading() {
    // Se maneja en renderVehiculos
  }
  
  getEmptyStateHTML() {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <i class="fas fa-car"></i>
        </div>
        <h3 class="empty-state-title">No hay vehículos</h3>
        <p class="empty-state-message">
          No tenemos vehículos disponibles en este momento.
        </p>
        <div class="empty-state-actions">
          <button class="button" onclick="window.productosManager.cargarVehiculos(true)">
            <i class="fas fa-sync"></i> Reintentar
          </button>
        </div>
      </div>
    `;
  }
  
  mostrarMensajeSinVehiculos() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <i class="fas fa-car-crash"></i>
          </div>
          <h3 class="empty-state-title">Inventario vacío</h3>
          <p class="empty-state-message">
            Estamos actualizando nuestro stock.
          </p>
          <div class="empty-state-actions">
            <a href="${this.config.urls.social.whatsapp}" target="_blank" class="button button-whatsapp">
              <i class="fab fa-whatsapp"></i> Consultar
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
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="empty-state-title">Error de carga</h3>
          <p class="empty-state-message">
            No pudimos cargar los vehículos.
          </p>
          <div class="empty-state-actions">
            <button class="button" onclick="window.productosManager.cargarVehiculos(true)">
              <i class="fas fa-redo"></i> Reintentar
            </button>
          </div>
        </div>
      `;
    }
  }
  
  mostrarErrorInicializacion() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="empty-state-title">Error de sistema</h3>
          <p class="empty-state-message">
            Problema al inicializar el sistema.
          </p>
          <div class="empty-state-actions">
            <button class="button" onclick="window.location.reload()">
              <i class="fas fa-redo"></i> Recargar página
            </button>
          </div>
        </div>
      `;
    }
  }
  
  // Método para obtener estadísticas
  getStats() {
    return this.stats;
  }
  
  // Método para buscar vehículos
  buscarVehiculos(query) {
    if (!query) return this.vehiculos;
    
    const searchTerm = query.toLowerCase();
    return this.vehiculos.filter(vehiculo => {
      return (
        (vehiculo.nombre && vehiculo.nombre.toLowerCase().includes(searchTerm)) ||
        (vehiculo.marca && vehiculo.marca.toLowerCase().includes(searchTerm)) ||
        (vehiculo.modelo && vehiculo.modelo.toLowerCase().includes(searchTerm)) ||
        (vehiculo.descripcion && vehiculo.descripcion.toLowerCase().includes(searchTerm))
      );
    });
  }
  
  // Método para ordenar vehículos
  ordenarVehiculos(criterio, direccion = 'asc') {
    const vehiculosCopy = [...this.vehiculos];
    
    vehiculosCopy.sort((a, b) => {
      let valorA = a[criterio];
      let valorB = b[criterio];
      
      // Manejar valores nulos/undefined
      if (valorA === undefined || valorA === null) valorA = direccion === 'asc' ? Infinity : -Infinity;
      if (valorB === undefined || valorB === null) valorB = direccion === 'asc' ? Infinity : -Infinity;
      
      if (direccion === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
    
    return vehiculosCopy;
  }
}

// Hacer disponible globalmente
window.ProductosManager = ProductosManager;
