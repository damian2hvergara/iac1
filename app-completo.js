// ===================== CONFIGURACIÓN =====================
const CONFIG = {
  supabase: {
    url: "https://cflpmluvhfldewiitymh.supabase.co",
    anonKey: "sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K"
  },
  contacto: {
    whatsapp: "56938654827",
    instagram: "import_american_cars",
    instagramUrl: "https://www.instagram.com/import_american_cars",
    email: "contacto@importamericancars.cl"
  },
  app: {
    mostrarPrecios: true,
    defaultImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    textosEstado: {
      stock: "En Stock Arica",
      transit: "En Tránsito",
      reserved: "Para Reservar"
    },
    coloresEstado: {
      stock: "#34C759",
      transit: "#FF9500",
      reserved: "#0066cc"
    }
  }
};

// ===================== SUPABASE SERVICE =====================
const supabaseService = {
  async getVehiculos() {
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/vehiculos?select=*&order=orden.asc,created_at.desc`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return [];
      const vehiculos = await response.json();
      
      // Procesar vehículos con imágenes
      return await Promise.all(vehiculos.map(async vehiculo => {
        const imagenes = await this.getImagenesVehiculo(vehiculo.id);
        return {
          ...vehiculo,
          imagenes: imagenes,
          imagen_principal: imagenes.length > 0 ? imagenes[0] : CONFIG.app.defaultImage
        };
      }));
      
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  },
  
  async getImagenesVehiculo(vehiculoId) {
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/vehiculo_imagenes?vehiculo_id=eq.${vehiculoId}&select=url,orden&order=orden.asc`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data.map(img => img.url);
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  },
  
  async getVehiculoById(id) {
    try {
      const url = `${CONFIG.supabase.url}/rest/v1/vehiculos?id=eq.${id}&select=*`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      const vehiculo = data[0];
      if (!vehiculo) return null;
      
      const imagenes = await this.getImagenesVehiculo(id);
      return {
        ...vehiculo,
        imagenes: imagenes,
        imagen_principal: imagenes.length > 0 ? imagenes[0] : CONFIG.app.defaultImage
      };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
};

// ===================== PRODUCTOS MANAGER =====================
class ProductosManager {
  constructor() {
    this.vehiculos = [];
    this.currentFilter = "all";
    this.kits = this.getKitsForDisplay();
  }
  
  async cargarVehiculos() {
    try {
      this.mostrarLoading();
      this.vehiculos = await supabaseService.getVehiculos();
      
      if (this.vehiculos.length === 0) {
        this.mostrarMensajeSinVehiculos();
        return;
      }
      
      this.vehiculos = this.vehiculos.map(vehiculo => this.procesarVehiculo(vehiculo));
      this.actualizarContadores();
      this.renderVehiculos();
      
    } catch (error) {
      console.error('Error:', error);
      this.mostrarError('Error al cargar los vehículos.');
    }
  }
  
  procesarVehiculo(vehiculo) {
    const imagenes = Array.isArray(vehiculo.imagenes) ? vehiculo.imagenes : [];
    let estado = vehiculo.estado || 'stock';
    if (estado === 'reserve') estado = 'reserved';
    
    return {
      id: vehiculo.id || Date.now().toString(),
      nombre: vehiculo.nombre || 'Vehículo',
      descripcion: vehiculo.descripcion || 'Vehículo americano importado',
      precio: vehiculo.precio || 0,
      estado: estado,
      imagenes: imagenes,
      imagen_principal: vehiculo.imagen_principal || imagenes[0] || CONFIG.app.defaultImage,
      ano: vehiculo.ano || '',
      color: vehiculo.color || '',
      motor: vehiculo.motor || '',
      kilometraje: vehiculo.kilometraje || 0,
      modelo: vehiculo.modelo || '',
      marca: vehiculo.marca || ''
    };
  }
  
  formatPrice(price) {
    if (!CONFIG.app.mostrarPrecios) return 'Consultar';
    if (!price && price !== 0) return 'Consultar';
    const num = parseInt(price);
    if (isNaN(num) || num === 0) return 'Consultar';
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  getWhatsAppUrl(vehiculo, kit = null) {
    let mensaje = `Hola, estoy interesado en el vehículo:\n\n`;
    mensaje += `*${vehiculo.nombre || 'Vehículo'}*\n`;
    if (vehiculo.precio) mensaje += `Precio: ${this.formatPrice(vehiculo.precio)}\n`;
    if (vehiculo.estado) mensaje += `Disponibilidad: ${CONFIG.app.textosEstado[vehiculo.estado] || vehiculo.estado}\n`;
    if (vehiculo.ano) mensaje += `Año: ${vehiculo.ano}\n`;
    if (vehiculo.kilometraje) mensaje += `Kilometraje: ${vehiculo.kilometraje.toLocaleString()} km\n`;
    if (kit) mensaje += `\nKit seleccionado: ${kit.nombre}\n`;
    mensaje += `\nMe gustaría obtener más información.`;
    
    return `https://wa.me/${CONFIG.contacto.whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }
  
  mostrarLoading() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>
          <p>Cargando vehículos...</p>
        </div>
      `;
    }
  }
  
  mostrarMensajeSinVehiculos() {
    const container = document.getElementById('vehiclesContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-car"></i></div>
          <h3>No hay vehículos disponibles</h3>
          <a href="https://wa.me/${CONFIG.contacto.whatsapp}" target="_blank" class="button whatsapp-btn">
            <i class="fab fa-whatsapp"></i> Consultar
          </a>
        </div>
      `;
    }
  }
  
  actualizarContadores() {
    const stockCount = this.vehiculos.filter(v => v.estado === 'stock').length;
    const transitCount = this.vehiculos.filter(v => v.estado === 'transit').length;
    const reservedCount = this.vehiculos.filter(v => v.estado === 'reserved').length;
    
    this.actualizarElemento('stockCount', stockCount);
    this.actualizarElemento('transitCount', transitCount);
    this.actualizarElemento('reservedCount', reservedCount);
  }
  
  actualizarElemento(id, valor) {
    const element = document.getElementById(id);
    if (element) element.textContent = valor;
  }
  
  filtrarVehiculos(filter) {
    this.currentFilter = filter;
    let vehiculosFiltrados = this.vehiculos;
    
    if (filter !== 'all') {
      vehiculosFiltrados = this.vehiculos.filter(v => v.estado === filter);
    }
    
    this.actualizarBotonesFiltro(filter);
    this.renderVehiculos(vehiculosFiltrados);
  }
  
  actualizarBotonesFiltro(filter) {
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }
  
  renderVehiculos(vehiculos = this.vehiculos) {
    const container = document.getElementById('vehiclesContainer');
    if (!container) return;
    
    if (!vehiculos || vehiculos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-car"></i></div>
          <h3>No hay vehículos en esta categoría</h3>
          <button class="button" onclick="productosManager.filtrarVehiculos('all')">
            Ver todos los vehículos
          </button>
        </div>
      `;
      return;
    }
    
    container.innerHTML = vehiculos.map(vehiculo => {
      const primeraImagen = vehiculo.imagenes?.[0] || vehiculo.imagen_principal || CONFIG.app.defaultImage;
      const estadoTexto = CONFIG.app.textosEstado[vehiculo.estado] || vehiculo.estado;
      const estadoColor = CONFIG.app.coloresEstado[vehiculo.estado] || '#86868b';
      
      return `
        <div class="vehicle-card">
          <img src="${primeraImagen}" alt="${vehiculo.nombre}" class="vehicle-image"
               onerror="this.src='${CONFIG.app.defaultImage}'">
          <div class="vehicle-info">
            <div class="vehicle-status" style="background: ${estadoColor}10; color: ${estadoColor};">
              ${estadoTexto}
            </div>
            <h3>${vehiculo.nombre}</h3>
            <div class="vehicle-price">${this.formatPrice(vehiculo.precio)}</div>
            <p>${vehiculo.descripcion?.substring(0, 80) || 'Sin descripción'}${vehiculo.descripcion?.length > 80 ? '...' : ''}</p>
            <div style="display: flex; gap: 8px;">
              <button class="button" onclick="window.open('${this.getWhatsAppUrl(vehiculo)}', '_blank')" style="flex: 1;">
                <i class="fab fa-whatsapp"></i> Consultar
              </button>
              <button class="button button-outline" onclick="mostrarDetallesVehiculo('${vehiculo.id}')" style="flex: 1;">
                <i class="fas fa-eye"></i> Detalles
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  getKitsForDisplay() {
    return [
      { id: "standard", nombre: "Standard", precio: 0, descripcion: "Preparación básica incluida", color: "#CD7F32" },
      { id: "medium", nombre: "Medium", precio: 1200000, descripcion: "Mejoras estéticas y funcionales", color: "#C0C0C0" },
      { id: "full", nombre: "Full", precio: 2500000, descripcion: "Transformación premium completa", color: "#FFD700" }
    ];
  }
  
  getKitById(kitId) {
    return this.kits.find(kit => kit.id === kitId) || null;
  }
  
  getVehiculoById(id) {
    return this.vehiculos.find(v => v.id === id) || null;
  }
}

// ===================== UI MANAGER =====================
class UIManager {
  static async mostrarDetallesVehiculo(vehiculoId) {
    const vehiculo = await supabaseService.getVehiculoById(vehiculoId);
    if (!vehiculo) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="vehicle-detail">
          <img src="${vehiculo.imagen_principal}" alt="${vehiculo.nombre}" class="detail-image">
          <h2>${vehiculo.nombre}</h2>
          <div class="vehicle-price">${productosManager.formatPrice(vehiculo.precio)}</div>
          <div class="vehicle-specs">
            ${vehiculo.ano ? `<div><i class="fas fa-calendar"></i> ${vehiculo.ano}</div>` : ''}
            ${vehiculo.kilometraje ? `<div><i class="fas fa-tachometer-alt"></i> ${vehiculo.kilometraje.toLocaleString()} km</div>` : ''}
            ${vehiculo.motor ? `<div><i class="fas fa-cogs"></i> ${vehiculo.motor}</div>` : ''}
            ${vehiculo.color ? `<div><i class="fas fa-palette"></i> ${vehiculo.color}</div>` : ''}
          </div>
          <p>${vehiculo.descripcion || 'Sin descripción adicional.'}</p>
          <a href="${productosManager.getWhatsAppUrl(vehiculo)}" target="_blank" class="button whatsapp-btn">
            <i class="fab fa-whatsapp"></i> Consultar en WhatsApp
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }
  
  static mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: #ff3b30; color: white; padding: 12px 20px;
      border-radius: 8px; z-index: 9999; max-width: 90%;
      text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// ===================== APP PRINCIPAL =====================
class App {
  constructor() {
    this.productosManager = new ProductosManager();
  }
  
  async init() {
    console.log('🚀 Iniciando aplicación...');
    
    // Configurar eventos básicos
    this.setupEvents();
    
    // Cargar vehículos
    await this.productosManager.cargarVehiculos();
    
    // Configurar año actual
    document.getElementById('currentYear')?.textContent = new Date().getFullYear();
    
    // Quitar loading
    document.body.classList.add('loaded');
    
    console.log('✅ Aplicación lista');
  }
  
  setupEvents() {
    // Menú móvil
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      document.getElementById('mobileMenu')?.classList.toggle('active');
    });
    
    // Filtros
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.productosManager.filtrarVehiculos(btn.dataset.filter);
      });
    });
    
    // Indicadores
    document.querySelectorAll('.indicator').forEach(indicator => {
      indicator.addEventListener('click', () => {
        const filter = indicator.dataset.filter;
        if (filter) {
          this.productosManager.filtrarVehiculos(filter);
          const vehiclesSection = document.getElementById('vehicles');
          if (vehiclesSection) {
            window.scrollTo({ top: vehiclesSection.offsetTop - 60, behavior: 'smooth' });
          }
        }
      });
    });
  }
}

// ===================== INICIALIZACIÓN =====================
window.productosManager = new ProductosManager();
window.mostrarDetallesVehiculo = UIManager.mostrarDetallesVehiculo;

// Iniciar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});

// Prueba de conexión inicial
if (CONFIG.supabase.url && !CONFIG.supabase.url.includes("TU_PROYECTO")) {
  supabaseService.getVehiculos().then(data => {
    console.log(data.length > 0 ? '✅ Conexión exitosa' : 'ℹ️ Conexión ok, sin datos');
  }).catch(error => {
    console.error('❌ Error de conexión:', error);
  });
}
