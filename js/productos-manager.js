// productos-manager.js - VERSIÓN CORREGIDA

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
        case 'stock': estadoInventario = 'disponible'; break;
        case 'transit': estadoInventario = 'transito'; break;
        case 'reserved': estadoInventario = 'reservado'; break;
        default: estadoInventario = filter;
      }
      
      vehiculosFiltrados = this.vehiculos.filter(v => 
        v.estado_inventario === estadoInventario
      );
    }
    
    this.renderVehiculos(vehiculosFiltrados);
    this.actualizarBotonesFiltro(filter);
  }
  
  actualizarEstadisticas() {
    this.stats = {
      total: this.vehiculos.length,
      stock: this.vehiculos.filter(v => v.estado_inventario === 'disponible').length,
      transit: this.vehiculos.filter(v => v.estado_inventario === 'transito').length,
      reserved: this.vehiculos.filter(v => v.estado_inventario === 'reservado').length
    };
  }
  
  actualizarContadoresUI() {
    const ids = ['stockCount', 'transitCount', 'reservedCount', 'totalCount'];
    const values = [this.stats.stock, this.stats.transit, this.stats.reserved, this.stats.total];
    
    ids.forEach((id, index) => {
      const element = document.getElementById(id);
      if (element) element.textContent = values[index];
    });
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
    
    return `
      <div class="vehicle-card" data-vehicle-id="${vehiculo.id}">
        <div class="card-image-container">
          <img src="${imagen}" 
               alt="${vehiculo.nombre}" 
               class="vehicle-image"
               loading="lazy"
               onerror="this.src='${this.config.app.defaultImage}'">
          <div class="vehicle-status" style="background: ${vehiculo.estadoColor}10; color: ${vehiculo.estadoColor}">
            <i class="fas ${vehiculo.estadoIcono}"></i>
            ${vehiculo.estadoTexto}
          </div>
        </div>
        
        <div class="vehicle-info">
          <h3 class="vehicle-name">${vehiculo.nombre}</h3>
          
          <p class="vehicle-subtitle">
            ${vehiculo.marca ? `<span>${vehiculo.marca}</span>` : ''}
            ${vehiculo.modelo ? `<span>• ${vehiculo.modelo}</span>` : ''}
          </p>
          
          <div class="vehicle-price">${precio}</div>
          
          <div class="vehicle-specs">
            ${vehiculo.ano ? `<div class="vehicle-spec"><i class="fas fa-calendar"></i> ${vehiculo.ano}</div>` : ''}
            ${vehiculo.kilometraje ? `<div class="vehicle-spec"><i class="fas fa-road"></i> ${this.formatNumber(vehiculo.kilometraje)} km</div>` : ''}
            ${vehiculo.motor ? `<div class="vehicle-spec"><i class="fas fa-cogs"></i> ${vehiculo.motor}</div>` : ''}
          </div>
          
          <div class="vehicle-actions">
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
    mensaje += `📋 *Disponibilidad:* ${vehiculo.estadoTexto}\n`;
    
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
  
  formatPrice(price) {
    if (!price && price !== 0) return 'Consultar';
    const num = parseInt(price);
    if (isNaN(num) || num === 0) return 'Consultar';
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  mostrarLoading() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Cargando vehículos...</p>
        </div>
      `;
    }
  }
  
  ocultarLoading() {
    // Se maneja en renderVehiculos
  }
  
  getEmptyStateHTML() {
    return `
      <div class="empty-state">
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
        <div class="empty-state">
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
        <div class="empty-state">
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
        <div class="empty-state">
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
}

// Hacer disponible globalmente
window.ProductosManager = ProductosManager;
