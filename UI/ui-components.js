// UI SLIDER - Manejo de sliders de imágenes
export class UISlider {
  static sliders = new Map();
  
  static init(sliderId, images, vehicleName = '') {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    const wrapper = slider.querySelector('.slider-wrapper');
    const prevBtn = slider.querySelector('.slider-button-prev');
    const nextBtn = slider.querySelector('.slider-button-next');
    
    if (!wrapper) return;
    
    let currentSlide = 0;
    const totalSlides = images.length;
    
    // Crear slides si no existen
    if (wrapper.children.length === 0) {
      wrapper.innerHTML = images.map((url, index) => `
        <div class="slider-slide" data-index="${index}">
          <img src="${url}" 
               alt="Imagen ${index + 1} de ${vehicleName}" 
               onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
        </div>
      `).join('');
    }
    
    // Crear puntos de navegación si no existen
    if (totalSlides > 1 && !slider.querySelector('.slider-dots')) {
      const dotsContainer = this.createDots(slider, totalSlides);
      this.setupDotsEvents(dotsContainer, sliderId);
    }
    
    // Configurar navegación
    const updateSlider = () => {
      wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
      this.updateDots(sliderId, currentSlide);
      this.updateNavButtons(prevBtn, nextBtn, currentSlide, totalSlides);
    };
    
    // Asignar eventos
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentSlide > 0) {
          currentSlide--;
          updateSlider();
        }
      };
    }
    
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentSlide < totalSlides - 1) {
          currentSlide++;
          updateSlider();
        }
      };
    }
    
    // Guardar referencia
    this.sliders.set(sliderId, { 
      currentSlide, 
      totalSlides, 
      updateSlider,
      goToSlide: (index) => {
        if (index >= 0 && index < totalSlides) {
          currentSlide = index;
          updateSlider();
        }
      }
    });
    
    updateSlider();
  }
  
  static createDots(slider, total) {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.innerHTML = Array.from({length: total}, (_, i) => 
      `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
    ).join('');
    slider.appendChild(dotsContainer);
    return dotsContainer;
  }
  
  static setupDotsEvents(dotsContainer, sliderId) {
    dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
      dot.onclick = () => {
        const index = parseInt(dot.dataset.index);
        this.goToSlide(sliderId, index);
      };
    });
  }
  
  static goToSlide(sliderId, index) {
    const sliderData = this.sliders.get(sliderId);
    if (!sliderData || index < 0 || index >= sliderData.totalSlides) return;
    
    sliderData.goToSlide(index);
  }
  
  static updateDots(sliderId, currentSlide) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    const dots = slider.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }
  
  static updateNavButtons(prevBtn, nextBtn, currentSlide, totalSlides) {
    if (prevBtn) {
      prevBtn.disabled = currentSlide === 0;
      prevBtn.style.opacity = currentSlide === 0 ? '0.3' : '1';
      prevBtn.style.cursor = currentSlide === 0 ? 'default' : 'pointer';
    }
    if (nextBtn) {
      nextBtn.disabled = currentSlide === totalSlides - 1;
      nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.3' : '1';
      nextBtn.style.cursor = currentSlide === totalSlides - 1 ? 'default' : 'pointer';
    }
  }
  
  // Destruir slider
  static destroy(sliderId) {
    this.sliders.delete(sliderId);
  }
}

// UI MODALS - Manejo de modales de vehículos
export class UIModals {
  static currentVehicle = null;
  static currentSlide = 0;
  static totalSlides = 0;
  
  static showVehicleDetails(vehicleId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      console.error(`❌ Vehículo ${vehicleId} no encontrado`);
      return;
    }
    
    this.currentVehicle = vehiculo;
    this.currentSlide = 0;
    this.totalSlides = vehiculo.imagenes?.length || 0;
    
    const imagenes = vehiculo.imagenes?.length > 0 ? vehiculo.imagenes : [
      vehiculo.imagen_principal || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ];
    
    const modalContent = document.getElementById('vehicleModalContent');
    if (!modalContent) {
      console.error('❌ Elemento vehicleModalContent no encontrado');
      return;
    }
    
    modalContent.innerHTML = `
      <div class="vehicle-details">
        <div class="slider-container" id="vehicleSlider">
          <div class="slider-wrapper">
            ${imagenes.map((url, index) => `
              <div class="slider-slide" data-index="${index}">
                <img src="${url}" 
                     alt="Imagen ${index + 1} de ${vehiculo.nombre}" 
                     onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
              </div>
            `).join('')}
          </div>
          
          ${imagenes.length > 1 ? `
            <button class="slider-button-prev" onclick="window.UIManager.prevSlide()">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="slider-button-next" onclick="window.UIManager.nextSlide()">
              <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="slider-dots">
              ${imagenes.map((_, index) => `
                <button class="slider-dot ${index === 0 ? 'active' : ''}" 
                        onclick="window.UIManager.goToSlide(${index})">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="details-content">
          <div class="vehicle-status" style="background: ${window.productosManager.getEstadoColor(vehiculo.estado)}10; color: ${window.productosManager.getEstadoColor(vehiculo.estado)};">
            ${window.productosManager.getEstadoTexto(vehiculo.estado)}
          </div>
          <h2 class="detail-title">${vehiculo.nombre || 'Vehículo'}</h2>
          <div class="detail-price">
            ${window.productosManager?.formatPrice(vehiculo.precio) || 'Consultar'}
          </div>
          
          <div class="detail-features">
            ${vehiculo.ano ? `<div><i class="fas fa-calendar"></i> <span>Año: ${vehiculo.ano}</span></div>` : ''}
            ${vehiculo.color ? `<div><i class="fas fa-palette"></i> <span>Color: ${vehiculo.color}</span></div>` : ''}
            ${vehiculo.motor ? `<div><i class="fas fa-cogs"></i> <span>Motor: ${vehiculo.motor}</span></div>` : ''}
            ${vehiculo.kilometraje ? `<div><i class="fas fa-road"></i> <span>${vehiculo.kilometraje.toLocaleString()} km</span></div>` : ''}
            ${vehiculo.modelo ? `<div><i class="fas fa-car"></i> <span>Modelo: ${vehiculo.modelo}</span></div>` : ''}
            ${vehiculo.marca ? `<div><i class="fas fa-industry"></i> <span>Marca: ${vehiculo.marca}</span></div>` : ''}
            ${vehiculo.transmision ? `<div><i class="fas fa-cog"></i> <span>Transmisión: ${vehiculo.transmision}</span></div>` : ''}
            ${vehiculo.combustible ? `<div><i class="fas fa-gas-pump"></i> <span>Combustible: ${vehiculo.combustible}</span></div>` : ''}
          </div>
          
          ${vehiculo.descripcion ? `
            <div class="detail-description">
              <h4>Descripción</h4>
              <p>${vehiculo.descripcion}</p>
            </div>
          ` : ''}

          <div class="modal-actions">
            <button class="button" onclick="window.UIManager.contactVehicle('${vehicleId}')">
              <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
            </button>
            <button class="button button-outline" onclick="window.UIManager.customizeVehicle('${vehicleId}')">
              <i class="fas fa-crown"></i> Personalizar con Kit
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Inicializar slider
    if (imagenes.length > 0) {
      UISlider.init('vehicleSlider', imagenes, vehiculo.nombre);
    }
    
    // Mostrar modal
    const modal = document.getElementById('vehicleModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  // Métodos del slider para acceso global
  static prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.updateSlider();
    }
  }
  
  static nextSlide() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.currentSlide++;
      this.updateSlider();
    }
  }
  
  static goToSlide(index) {
    this.currentSlide = index;
    this.updateSlider();
  }
  
  static updateSlider() {
    const wrapper = document.querySelector('#vehicleSlider .slider-wrapper');
    const dots = document.querySelectorAll('#vehicleSlider .slider-dot');
    const prevBtn = document.querySelector('#vehicleSlider .slider-button-prev');
    const nextBtn = document.querySelector('#vehicleSlider .slider-button-next');
    
    if (wrapper) {
      wrapper.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }
    
    // Actualizar dots
    if (dots) {
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === this.currentSlide);
      });
    }
    
    // Actualizar botones de navegación
    if (prevBtn) {
      prevBtn.disabled = this.currentSlide === 0;
      prevBtn.style.opacity = this.currentSlide === 0 ? '0.3' : '1';
      prevBtn.style.cursor = this.currentSlide === 0 ? 'default' : 'pointer';
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
      nextBtn.style.opacity = this.currentSlide === this.totalSlides - 1 ? '0.3' : '1';
      nextBtn.style.cursor = this.currentSlide === this.totalSlides - 1 ? 'default' : 'pointer';
    }
  }
  
  static setupModalEvents() {
    // Botones de cerrar
    document.getElementById('closeVehicleModal')?.addEventListener('click', () => {
      this.closeAllModals();
    });
    
    document.getElementById('closeCustomizationModal')?.addEventListener('click', () => {
      this.closeAllModals();
    });
    
    // Cerrar modal al hacer click fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAllModals();
      }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }
  
  static closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

// UI KITS - Manejo de kits de personalización
export class UIKits {
  static selectedKit = null;
  static vehicleForCustomization = null;
  
  static showKitsModal(vehicleId) {
    // Obtener datos usando window.productosManager
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      console.error(`❌ Vehículo ${vehicleId} no encontrado`);
      return;
    }
    
    this.vehicleForCustomization = vehiculo;
    const kits = window.productosManager?.getKitsForDisplay() || [];
    
    const modalContent = document.getElementById('customizationContent');
    if (!modalContent) {
      console.error('❌ Elemento customizationContent no encontrado');
      return;
    }
    
    modalContent.innerHTML = `
      <div class="customization-container">
        <div class="customization-header">
          <h3>Personalizar ${vehiculo.nombre}</h3>
          <p>Selecciona un kit de upgrade para ver el precio total</p>
        </div>
        
        <div class="customization-body">
          <div class="kits-options-grid">
            ${kits.map(kit => `
              <div class="kit-option ${kit.id === 'standard' ? 'selected' : ''}" 
                   data-kit-id="${kit.id}"
                   onclick="window.UIManager.selectKit('${kit.id}', '${vehicleId}')">
                <div class="kit-icon" style="color: ${kit.color};">
                  <i class="fas ${kit.icon}"></i>
                </div>
                <h4>${kit.nombre}</h4>
                <div class="kit-price">
                  ${kit.precio > 0 ? `+${window.productosManager?.formatPrice(kit.precio) || 'Consultar'}` : 'INCLUIDO'}
                </div>
                <p>${kit.descripcion}</p>
                <ul class="kit-features">
                  ${kit.includes.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}
                </ul>
                <button class="button" onclick="window.UIManager.contactWithKit('${vehicleId}', '${kit.id}')" style="margin-top: auto;">
                  <i class="fab fa-whatsapp"></i> Cotizar este kit
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="customization-summary">
            <div class="summary-line">
              <span>Vehículo base</span>
              <span class="price-value">${window.productosManager?.formatPrice(vehiculo.precio) || 'Consultar'}</span>
            </div>
            <div id="kit-selection-line" class="summary-line" style="${kits.find(k => k.id === 'standard') ? '' : 'display: none;'}">
              <span id="selected-kit-name">Kit Standard</span>
              <span id="selected-kit-price" class="price-value">INCLUIDO</span>
            </div>
            <div class="summary-total">
              <span>Total estimado</span>
              <span id="total-price">${window.productosManager?.formatPrice(vehiculo.precio) || 'Consultar'}</span>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="button button-outline" onclick="window.UIManager.closeAllModals()">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="button" onclick="window.UIManager.contactWithSelectedKit('${vehicleId}')">
              <i class="fab fa-whatsapp"></i> Cotizar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Seleccionar kit por defecto
    this.selectKit('standard', vehicleId);
    
    // Mostrar modal
    const modal = document.getElementById('customizationModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  
  static selectKit(kitId, vehicleId) {
    const kits = window.productosManager?.getKitsForDisplay() || [];
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;
    
    // Actualizar selección visual
    document.querySelectorAll('.kit-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    const selectedOpt = document.querySelector(`[data-kit-id="${kitId}"]`);
    if (selectedOpt) selectedOpt.classList.add('selected');
    
    // Actualizar resumen
    const kitLine = document.getElementById('kit-selection-line');
    const kitName = document.getElementById('selected-kit-name');
    const kitPrice = document.getElementById('selected-kit-price');
    const totalPrice = document.getElementById('total-price');
    
    if (kitLine && kitName && kitPrice && totalPrice) {
      kitLine.style.display = 'flex';
      kitName.textContent = `Kit ${kit.nombre}`;
      kitPrice.textContent = kit.precio > 0 ? 
        `+${window.productosManager?.formatPrice(kit.precio) || 'Consultar'}` : 
        'INCLUIDO';
      
      const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
      if (vehiculo) {
        const total = (vehiculo.precio || 0) + (kit.precio || 0);
        totalPrice.textContent = window.productosManager?.formatPrice(total) || 'Consultar';
      }
    }
    
    this.selectedKit = kit;
  }
  
  static contactWithKit(vehicleId, kitId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    const kits = window.productosManager?.getKitsForDisplay() || [];
    const kit = kits.find(k => k.id === kitId);
    
    if (!vehiculo || !kit) return;
    
    // Cerrar modal
    this.closeModal();
    
    // Abrir WhatsApp
    if (window.productosManager?.getWhatsAppUrl) {
      const url = window.productosManager.getWhatsAppUrl(vehiculo, kit);
      window.open(url, '_blank');
    }
  }
  
  static contactWithSelectedKit(vehicleId) {
    if (!this.selectedKit) {
      this.selectKit('standard', vehicleId);
    }
    
    this.contactWithKit(vehicleId, this.selectedKit.id);
  }
  
  static closeModal() {
    const modal = document.getElementById('customizationModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }
}
