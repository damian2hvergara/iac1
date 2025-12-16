import { CONFIG } from './config.js';
import { supabaseService } from './supabase.js';

// Sistema de comparación visual avanzado
export class ComparadorManager {
  constructor() {
    this.modoActual = CONFIG.comparador.defaultMode;
    this.vehiculoActual = null;
    this.kitActual = null;
    this.imagenesKit = [];
    this.isComparing = false;
  }
  
  // Inicializar comparador para un vehículo
  async initComparador(vehiculoId, kitId = 'standar') {
    try {
      console.log(`🔍 Iniciando comparador para vehículo ${vehiculoId}, kit ${kitId}`);
      
      // Obtener vehículo
      this.vehiculoActual = await supabaseService.getVehiculoById(vehiculoId);
      if (!this.vehiculoActual) {
        console.error('❌ Vehículo no encontrado');
        return false;
      }
      
      this.kitActual = kitId;
      
      // Obtener imágenes específicas del kit desde Supabase
      this.imagenesKit = await supabaseService.getKitImagesForVehicle(vehiculoId, kitId);
      
      // Si no hay imágenes específicas, usar las del vehículo
      if (!this.imagenesKit || this.imagenesKit.length === 0) {
        console.log('ℹ️ No hay imágenes específicas, usando imágenes del vehículo');
        this.imagenesKit = this.vehiculoActual.imagenes?.map((url, index) => ({
          id: `default_${index}`,
          imagen_url: url,
          tipo_visualizacion: 'standard',
          orden: index
        })) || [];
      }
      
      // Renderizar comparador
      this.renderComparador();
      
      // Inicializar controles
      this.initComparadorControls();
      
      // Track event
      supabaseService.trackEvent('comparator_opened', {
        vehicle_id: vehiculoId,
        kit_id: kitId,
        has_specific_images: this.imagenesKit.length > 0
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando comparador:', error);
      return false;
    }
  }
  
  // Renderizar interfaz del comparador
  renderComparador() {
    const modalContent = document.getElementById('comparadorContent');
    if (!modalContent) return;
    
    const kitNombre = this.getKitName(this.kitActual);
    const vehiculoImagen = this.vehiculoActual.imagenes?.[0] || CONFIG.app.defaultImage;
    const kitImagen = this.imagenesKit[0]?.imagen_url || vehiculoImagen;
    
    modalContent.innerHTML = `
      <div class="comparador-container">
        <!-- Header -->
        <div class="comparador-header">
          <h2>
            <i class="fas fa-exchange-alt"></i>
            Comparador Visual - ${this.vehiculoActual.nombre}
          </h2>
          <p class="comparador-subtitle">
            Compara el vehículo original vs. Kit ${kitNombre}
          </p>
        </div>
        
        <!-- Selector de modo -->
        <div class="comparador-mode-selector">
          <div class="mode-options">
            ${CONFIG.comparador.modos.map(mode => `
              <button class="mode-btn ${this.modoActual === mode ? 'active' : ''}" 
                      data-mode="${mode}">
                <i class="fas fa-${this.getModeIcon(mode)}"></i>
                ${this.getModeLabel(mode)}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Contenedor de comparación -->
        <div class="comparison-viewport" id="comparisonViewport">
          ${this.getComparisonHTML()}
        </div>
        
        <!-- Selector de imágenes -->
        ${this.imagenesKit.length > 1 ? `
        <div class="image-selector">
          <h4><i class="fas fa-images"></i> Seleccionar Ángulo de Comparación</h4>
          <div class="image-thumbnails">
            ${this.imagenesKit.map((img, index) => `
              <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                   data-index="${index}"
                   onclick="comparadorManager.selectComparisonImage(${index})">
                <img src="${img.imagen_url}" 
                     alt="Vista ${index + 1}"
                     loading="lazy"
                     onerror="this.src='${CONFIG.app.defaultImage}'">
                <div class="thumbnail-overlay">
                  <i class="fas fa-check"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <!-- Información del kit -->
        <div class="kit-info-panel">
          <div class="kit-badge large ${this.kitActual}">
            <i class="fas fa-${this.getKitIcon(this.kitActual)}"></i>
            <span>Kit ${kitNombre}</span>
          </div>
          
          <div class="kit-details">
            <h4><i class="fas fa-clipboard-list"></i> Transformaciones incluidas:</h4>
            <ul class="kit-features-list">
              ${this.getKitFeatures(this.kitActual).map(feature => `
                <li>
                  <i class="fas fa-check-circle" style="color: var(--success);"></i>
                  ${feature}
                </li>
              `).join('')}
            </ul>
          </div>
          
          <div class="comparator-actions">
            <button class="button" onclick="comparadorManager.openWhatsApp()">
              <i class="fab fa-whatsapp"></i> Cotizar Esta Transformación
            </button>
            <button class="button button-outline" onclick="UI.closeModal('comparadorModal')">
              <i class="fas fa-times"></i> Cerrar Comparador
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Inicializar modo específico
    this.initMode(this.modoActual);
  }
  
  // Obtener HTML según modo de comparación
  getComparisonHTML() {
    const vehiculoImagen = this.vehiculoActual.imagenes?.[0] || CONFIG.app.defaultImage;
    const kitImagen = this.imagenesKit[0]?.imagen_url || vehiculoImagen;
    
    switch(this.modoActual) {
      case 'split':
        return `
          <div class="comparison-split">
            <div class="split-left">
              <div class="comparison-label">
                <span class="label-badge original">
                  <i class="fas fa-car"></i> Original
                </span>
              </div>
              <img src="${vehiculoImagen}" 
                   alt="Vehículo original" 
                   class="comparison-image"
                   onerror="this.src='${CONFIG.app.defaultImage}'">
            </div>
            <div class="split-divider">
              <div class="divider-handle">
                <i class="fas fa-arrows-alt-h"></i>
              </div>
            </div>
            <div class="split-right">
              <div class="comparison-label">
                <span class="label-badge transformed">
                  <i class="fas fa-crown"></i> Con Kit ${this.getKitName(this.kitActual)}
                </span>
              </div>
              <img src="${kitImagen}" 
                   alt="Vehículo con kit" 
                   class="comparison-image"
                   onerror="this.src='${CONFIG.app.defaultImage}'">
            </div>
          </div>
        `;
        
      case 'slider':
        return `
          <div class="comparison-slider">
            <div class="slider-container">
              <div class="before-image">
                <img src="${vehiculoImagen}" 
                     alt="Antes"
                     onerror="this.src='${CONFIG.app.defaultImage}'">
                <div class="slider-label left">Original</div>
              </div>
              <div class="after-image">
                <img src="${kitImagen}" 
                     alt="Después"
                     onerror="this.src='${CONFIG.app.defaultImage}'">
                <div class="slider-label right">Con Kit</div>
              </div>
              <div class="slider-handle">
                <div class="handle-circle">
                  <i class="fas fa-arrows-alt-h"></i>
                </div>
                <div class="slider-line"></div>
              </div>
            </div>
          </div>
        `;
        
      case 'overlay':
        return `
          <div class="comparison-overlay">
            <div class="overlay-container">
              <img src="${vehiculoImagen}" 
                   alt="Base" 
                   class="base-image"
                   onerror="this.src='${CONFIG.app.defaultImage}'">
              <img src="${kitImagen}" 
                   alt="Overlay" 
                   class="overlay-image"
                   onerror="this.src='${CONFIG.app.defaultImage}'">
            </div>
            <div class="overlay-controls">
              <div class="opacity-slider">
                <span class="slider-label">Original</span>
                <input type="range" min="0" max="100" value="50" class="opacity-range" 
                       oninput="comparadorManager.updateOverlay(this.value)">
                <span class="slider-label">Con Kit</span>
              </div>
              <div class="blend-mode-selector">
                <select onchange="comparadorManager.updateBlendMode(this.value)">
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiplicar</option>
                  <option value="screen">Pantalla</option>
                  <option value="overlay">Overlay</option>
                </select>
              </div>
            </div>
          </div>
        `;
        
      default:
        return `<div>Modo no disponible</div>`;
    }
  }
  
  // Inicializar controles del comparador
  initComparadorControls() {
    // Botones de modo
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setMode(mode);
      });
    });
    
    // Inicializar modo específico
    this.initMode(this.modoActual);
  }
  
  // Configurar modo de comparación
  setMode(mode) {
    if (!CONFIG.comparador.modos.includes(mode)) return;
    
    this.modoActual = mode;
    
    // Actualizar botones activos
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Actualizar vista
    const viewport = document.getElementById('comparisonViewport');
    if (viewport) {
      viewport.innerHTML = this.getComparisonHTML();
      this.initMode(mode);
    }
    
    // Track event
    supabaseService.trackEvent('comparator_mode_changed', { mode });
  }
  
  // Inicializar modo específico
  initMode(mode) {
    switch(mode) {
      case 'split':
        this.initSplitMode();
        break;
      case 'slider':
        this.initSliderMode();
        break;
      case 'overlay':
        this.initOverlayMode();
        break;
    }
  }
  
  // Modo Split (50/50)
  initSplitMode() {
    const splitDivider = document.querySelector('.split-divider');
    const splitLeft = document.querySelector('.split-left');
    const splitRight = document.querySelector('.split-right');
    
    if (!splitDivider || !splitLeft || !splitRight) return;
    
    let isDragging = false;
    
    splitDivider.addEventListener('mousedown', startDrag);
    splitDivider.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
      isDragging = true;
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('touchmove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      e.preventDefault();
    }
    
    function onDrag(e) {
      if (!isDragging) return;
      
      const container = document.querySelector('.comparison-split');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const percentage = ((x - rect.left) / rect.width) * 100;
      
      const clampedPercentage = Math.max(25, Math.min(75, percentage));
      
      splitLeft.style.width = `${clampedPercentage}%`;
      splitDivider.style.left = `${clampedPercentage}%`;
      splitRight.style.width = `${100 - clampedPercentage}%`;
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }
  
  // Modo Slider (interactivo)
  initSliderMode() {
    const slider = document.querySelector('.comparison-slider .slider-container');
    const handle = document.querySelector('.slider-handle');
    const beforeImage = document.querySelector('.before-image');
    
    if (!slider || !handle || !beforeImage) return;
    
    let isDragging = false;
    
    handle.addEventListener('mousedown', startSlide);
    handle.addEventListener('touchstart', startSlide);
    slider.addEventListener('click', onClick);
    
    function startSlide(e) {
      isDragging = true;
      document.addEventListener('mousemove', onSlide);
      document.addEventListener('touchmove', onSlide);
      document.addEventListener('mouseup', stopSlide);
      document.addEventListener('touchend', stopSlide);
      e.preventDefault();
    }
    
    function onSlide(e) {
      if (!isDragging) return;
      updateSliderPosition(e);
    }
    
    function onClick(e) {
      updateSliderPosition(e);
    }
    
    function updateSliderPosition(e) {
      const rect = slider.getBoundingClientRect();
      const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      let percentage = ((x - rect.left) / rect.width) * 100;
      
      percentage = Math.max(0, Math.min(100, percentage));
      
      beforeImage.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }
    
    function stopSlide() {
      isDragging = false;
      document.removeEventListener('mousemove', onSlide);
      document.removeEventListener('touchmove', onSlide);
      document.removeEventListener('mouseup', stopSlide);
      document.removeEventListener('touchend', stopSlide);
    }
  }
  
  // Modo Overlay
  initOverlayMode() {
    // Los controles ya están conectados via oninput/onchange
  }
  
  // Actualizar overlay
  updateOverlay(value) {
    const overlayImage = document.querySelector('.overlay-image');
    if (overlayImage) {
      overlayImage.style.opacity = value / 100;
    }
  }
  
  // Actualizar blend mode
  updateBlendMode(mode) {
    const overlayImage = document.querySelector('.overlay-image');
    if (overlayImage) {
      overlayImage.style.mixBlendMode = mode;
    }
  }
  
  // Seleccionar imagen para comparación
  selectComparisonImage(index) {
    if (index < 0 || index >= this.imagenesKit.length) return;
    
    const kitImagen = this.imagenesKit[index].imagen_url;
    const vehiculoImagen = this.vehiculoActual.imagenes?.[index] || 
                          this.vehiculoActual.imagenes?.[0] || 
                          CONFIG.app.defaultImage;
    
    // Actualizar miniaturas
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
    
    // Actualizar imágenes según modo
    switch(this.modoActual) {
      case 'split':
        document.querySelector('.split-left img').src = vehiculoImagen;
        document.querySelector('.split-right img').src = kitImagen;
        break;
      case 'slider':
        document.querySelector('.before-image img').src = vehiculoImagen;
        document.querySelector('.after-image img').src = kitImagen;
        break;
      case 'overlay':
        document.querySelector('.base-image').src = vehiculoImagen;
        document.querySelector('.overlay-image').src = kitImagen;
        break;
    }
    
    // Track event
    supabaseService.trackEvent('comparator_image_changed', { 
      image_index: index 
    });
  }
  
  // Abrir WhatsApp con configuración actual
  async openWhatsApp() {
    if (!this.vehiculoActual) return;
    
    const kitNombre = this.getKitName(this.kitActual);
    const precioKit = await this.getKitPrice();
    const precioTotal = (this.vehiculoActual.precio || 0) + precioKit;
    
    let message = `🚗 *SOLICITUD DE COTIZACIÓN - COMPARADOR VISUAL*\n\n`;
    message += `*Vehículo:* ${this.vehiculoActual.nombre}\n`;
    message += `*Kit seleccionado:* ${kitNombre}\n`;
    message += `*Modo de visualización:* ${this.getModeLabel(this.modoActual)}\n\n`;
    message += `*Inversión estimada:*\n`;
    message += `- Vehículo: $${(this.vehiculoActual.precio || 0).toLocaleString('es-CL')}\n`;
    message += `- Kit ${kitNombre}: $${precioKit.toLocaleString('es-CL')}\n`;
    message += `*TOTAL: $${precioTotal.toLocaleString('es-CL')}*\n\n`;
    message += `Me interesa esta transformación. ¿Podemos proceder?`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.contacto.whatsapp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Track event
    supabaseService.trackEvent('whatsapp_from_comparator', {
      vehicle_id: this.vehiculoActual.id,
      kit_id: this.kitActual,
      mode: this.modoActual
    });
  }
  
  // Helper functions
  getKitName(kitId) {
    const kits = {
      'standar': 'Standard',
      'medium': 'Medium',
      'full': 'Full'
    };
    return kits[kitId] || kitId;
  }
  
  getKitIcon(kitId) {
    const icons = {
      'standar': 'star',
      'medium': 'medal',
      'full': 'crown'
    };
    return icons[kitId] || 'star';
  }
  
  getModeIcon(mode) {
    const icons = {
      'split': 'columns',
      'slider': 'sliders-h',
      'overlay': 'layer-group'
    };
    return icons[mode] || 'columns';
  }
  
  getModeLabel(mode) {
    const labels = {
      'split': 'Vista Dividida',
      'slider': 'Deslizador',
      'overlay': 'Superposición'
    };
    return labels[mode] || mode;
  }
  
  getKitFeatures(kitId) {
    const features = {
      'standar': [
        "Lavado y encerado completo",
        "Limpieza interior profunda",
        "Revisión mecánica básica",
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
        "Kit carrocería exclusivo"
      ]
    };
    return features[kitId] || features['standar'];
  }
  
  async getKitPrice() {
    // Intentar obtener precio específico desde Supabase
    const precioEspecifico = await supabaseService.getPrecioEspecifico(
      this.vehiculoActual.id, 
      this.kitActual
    );
    
    if (precioEspecifico !== null) {
      return precioEspecifico;
    }
    
    // Si no hay precio específico, usar precio general del kit
    const kits = await supabaseService.getKits();
    const kit = kits.find(k => k.id === this.kitActual);
    return kit?.precio || 0;
  }
}

// Instancia global
export const comparadorManager = new ComparadorManager();

// Hacer accesible globalmente
window.comparadorManager = comparadorManager;