// ui-components.js - VERSIÓN COMPLETA CORREGIDA

// ===================== UI SLIDER =====================
class UISlider {
  static sliders = new Map();
  static touchStartX = 0;
  static touchEndX = 0;
  static minSwipeDistance = 50;
  
  static init(sliderId, images, vehicleName = '', options = {}) {
    const slider = document.getElementById(sliderId);
    if (!slider) {
      console.error(`❌ Slider ${sliderId} no encontrado`);
      return null;
    }
    
    const wrapper = slider.querySelector('.slider-wrapper');
    const prevBtn = slider.querySelector('.slider-button-prev');
    const nextBtn = slider.querySelector('.slider-button-next');
    
    if (!wrapper) {
      console.error(`❌ Slider wrapper no encontrado en ${sliderId}`);
      return null;
    }
    
    const config = {
      autoplay: options.autoplay || false,
      autoplaySpeed: options.autoplaySpeed || 5000,
      loop: options.loop || false,
      showDots: images.length > 1,
      showNav: images.length > 1,
      ...options
    };
    
    let currentSlide = 0;
    const totalSlides = images.length;
    let autoplayInterval = null;
    
    // Limpiar contenido existente
    wrapper.innerHTML = '';
    
    // Crear slides
    wrapper.innerHTML = images.map((url, index) => `
      <div class="slider-slide" data-index="${index}" role="tabpanel" aria-labelledby="slide-${sliderId}-${index}">
        <img src="${url}" 
             alt="Imagen ${index + 1} de ${vehicleName}" 
             loading="${index === 0 ? 'eager' : 'lazy'}"
             onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'"
             draggable="false">
      </div>
    `).join('');
    
    // Crear puntos de navegación
    if (config.showDots && !slider.querySelector('.slider-dots')) {
      const dotsContainer = this.createDots(slider, totalSlides, sliderId);
      this.setupDotsEvents(dotsContainer, sliderId);
    }
    
    // Configurar navegación por teclado
    slider.setAttribute('role', 'tablist');
    slider.setAttribute('aria-label', `Galería de imágenes de ${vehicleName}`);
    
    // Configurar navegación
    const updateSlider = () => {
      const translateX = -currentSlide * 100;
      wrapper.style.transform = `translateX(${translateX}%)`;
      wrapper.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Actualizar ARIA
      this.updateAria(sliderId, currentSlide);
      
      // Actualizar puntos
      if (config.showDots) {
        this.updateDots(sliderId, currentSlide);
      }
      
      // Actualizar botones de navegación
      if (config.showNav) {
        this.updateNavButtons(prevBtn, nextBtn, currentSlide, totalSlides, config.loop);
      }
    };
    
    // Configurar eventos táctiles
    this.setupTouchEvents(wrapper, sliderId);
    
    // Configurar navegación con teclado
    slider.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.prevSlide(sliderId);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextSlide(sliderId);
          break;
        case 'Home':
          e.preventDefault();
          this.goToSlide(sliderId, 0);
          break;
        case 'End':
          e.preventDefault();
          this.goToSlide(sliderId, totalSlides - 1);
          break;
      }
    });
    
    // Asignar eventos a botones
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.prevSlide(sliderId);
      };
      
      prevBtn.setAttribute('aria-label', 'Imagen anterior');
    }
    
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.nextSlide(sliderId);
      };
      
      nextBtn.setAttribute('aria-label', 'Imagen siguiente');
    }
    
    // Auto-play
    if (config.autoplay && totalSlides > 1) {
      this.startAutoplay(sliderId, config.autoplaySpeed);
      
      // Pausar auto-play al interactuar
      slider.addEventListener('mouseenter', () => this.stopAutoplay(sliderId));
      slider.addEventListener('mouseleave', () => this.startAutoplay(sliderId, config.autoplaySpeed));
      slider.addEventListener('focusin', () => this.stopAutoplay(sliderId));
      slider.addEventListener('focusout', () => this.startAutoplay(sliderId, config.autoplaySpeed));
    }
    
    // Guardar referencia del slider
    const sliderData = {
      currentSlide,
      totalSlides,
      config,
      updateSlider,
      goToSlide: (index) => {
        if (index >= 0 && index < totalSlides) {
          currentSlide = index;
          updateSlider();
        } else if (config.loop) {
          if (index < 0) {
            currentSlide = totalSlides - 1;
          } else if (index >= totalSlides) {
            currentSlide = 0;
          }
          updateSlider();
        }
      },
      prevSlide: () => {
        if (currentSlide > 0) {
          currentSlide--;
        } else if (config.loop) {
          currentSlide = totalSlides - 1;
        }
        updateSlider();
      },
      nextSlide: () => {
        if (currentSlide < totalSlides - 1) {
          currentSlide++;
        } else if (config.loop) {
          currentSlide = 0;
        }
        updateSlider();
      },
      startAutoplay: () => {
        if (config.autoplay && totalSlides > 1) {
          this.stopAutoplay(sliderId);
          autoplayInterval = setInterval(() => {
            sliderData.nextSlide();
          }, config.autoplaySpeed);
        }
      },
      stopAutoplay: () => {
        if (autoplayInterval) {
          clearInterval(autoplayInterval);
          autoplayInterval = null;
        }
      }
    };
    
    this.sliders.set(sliderId, sliderData);
    
    // Inicializar
    updateSlider();
    
    // Precargar imágenes
    this.preloadImages(images);
    
    return sliderData;
  }
  
  static createDots(slider, total, sliderId) {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.setAttribute('role', 'tablist');
    dotsContainer.setAttribute('aria-label', 'Seleccionar imagen');
    
    dotsContainer.innerHTML = Array.from({length: total}, (_, i) => `
      <button class="slider-dot ${i === 0 ? 'active' : ''}" 
              id="slide-${sliderId}-${i}"
              data-index="${i}"
              role="tab"
              aria-controls="slide-${sliderId}-${i}"
              aria-selected="${i === 0}"
              aria-label="Imagen ${i + 1} de ${total}"
              tabindex="${i === 0 ? '0' : '-1'}">
      </button>
    `).join('');
    
    slider.appendChild(dotsContainer);
    return dotsContainer;
  }
  
  static setupDotsEvents(dotsContainer, sliderId) {
    dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(dot.dataset.index);
        this.goToSlide(sliderId, index);
      });
      
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const index = parseInt(dot.dataset.index);
          this.goToSlide(sliderId, index);
        }
      });
    });
  }
  
  static setupTouchEvents(wrapper, sliderId) {
    wrapper.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    wrapper.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(sliderId);
    }, { passive: true });
    
    // También para mouse drag
    let mouseDownX = 0;
    let mouseUpX = 0;
    
    wrapper.addEventListener('mousedown', (e) => {
      mouseDownX = e.clientX;
    });
    
    wrapper.addEventListener('mouseup', (e) => {
      mouseUpX = e.clientX;
      const distance = mouseUpX - mouseDownX;
      
      if (Math.abs(distance) > this.minSwipeDistance) {
        if (distance > 0) {
          this.prevSlide(sliderId);
        } else {
          this.nextSlide(sliderId);
        }
      }
    });
  }
  
  static handleSwipe(sliderId) {
    const distance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(distance) > this.minSwipeDistance) {
      if (distance > 0) {
        this.nextSlide(sliderId);
      } else {
        this.prevSlide(sliderId);
      }
    }
  }
  
  static prevSlide(sliderId) {
    const sliderData = this.sliders.get(sliderId);
    if (sliderData) {
      sliderData.prevSlide();
    }
  }
  
  static nextSlide(sliderId) {
    const sliderData = this.sliders.get(sliderId);
    if (sliderData) {
      sliderData.nextSlide();
    }
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
      const isActive = index === currentSlide;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive);
      dot.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }
  
  static updateNavButtons(prevBtn, nextBtn, currentSlide, totalSlides, loop = false) {
    if (prevBtn) {
      const isDisabled = !loop && currentSlide === 0;
      prevBtn.disabled = isDisabled;
      prevBtn.style.opacity = isDisabled ? '0.3' : '1';
      prevBtn.style.cursor = isDisabled ? 'default' : 'pointer';
      prevBtn.setAttribute('aria-disabled', isDisabled);
    }
    
    if (nextBtn) {
      const isDisabled = !loop && currentSlide === totalSlides - 1;
      nextBtn.disabled = isDisabled;
      nextBtn.style.opacity = isDisabled ? '0.3' : '1';
      nextBtn.style.cursor = isDisabled ? 'default' : 'pointer';
      nextBtn.setAttribute('aria-disabled', isDisabled);
    }
  }
  
  static updateAria(sliderId, currentSlide) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.slider-slide');
    slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index !== currentSlide);
    });
    
    const activeSlide = slides[currentSlide];
    if (activeSlide) {
      slider.setAttribute('aria-live', 'polite');
      setTimeout(() => {
        slider.setAttribute('aria-live', 'off');
      }, 500);
    }
  }
  
  static startAutoplay(sliderId, speed = 5000) {
    const sliderData = this.sliders.get(sliderId);
    if (sliderData && sliderData.config.autoplay) {
      sliderData.startAutoplay();
    }
  }
  
  static stopAutoplay(sliderId) {
    const sliderData = this.sliders.get(sliderId);
    if (sliderData) {
      sliderData.stopAutoplay();
    }
  }
  
  static preloadImages(images) {
    images.forEach((src, index) => {
      if (index > 0) { // No precargar la primera (ya está cargada)
        const img = new Image();
        img.src = src;
      }
    });
  }
  
  // Destruir slider
  static destroy(sliderId) {
    const sliderData = this.sliders.get(sliderId);
    if (sliderData) {
      sliderData.stopAutoplay();
      this.sliders.delete(sliderId);
    }
  }
  
  // Obtener slider data
  static getSlider(sliderId) {
    return this.sliders.get(sliderId);
  }
  
  // Reiniciar slider
  static reset(sliderId) {
    this.goToSlide(sliderId, 0);
  }
  
  // Actualizar slider con nuevas imágenes
  static update(sliderId, images, vehicleName = '') {
    const sliderData = this.sliders.get(sliderId);
    if (!sliderData) return;
    
    this.destroy(sliderId);
    return this.init(sliderId, images, vehicleName, sliderData.config);
  }
}

// ===================== UI MODALS =====================
class UIModals {
  static currentVehicle = null;
  static currentSlide = 0;
  static totalSlides = 0;
  static activeModal = null;
  static focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  static showVehicleDetails(vehicleId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      console.error(`❌ Vehículo ${vehicleId} no encontrado`);
      if (window.UINotifications) {
        UINotifications.error('Vehículo no encontrado');
      }
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
    
    // Formatear características
    const features = [
      { icon: 'fa-calendar', label: 'Año', value: vehiculo.ano },
      { icon: 'fa-palette', label: 'Color', value: vehiculo.color },
      { icon: 'fa-cogs', label: 'Motor', value: vehiculo.motor },
      { icon: 'fa-road', label: 'Kilometraje', value: vehiculo.kilometraje ? `${parseInt(vehiculo.kilometraje).toLocaleString()} km` : null },
      { icon: 'fa-car', label: 'Modelo', value: vehiculo.modelo },
      { icon: 'fa-industry', label: 'Marca', value: vehiculo.marca },
      { icon: 'fa-cog', label: 'Transmisión', value: vehiculo.transmision },
      { icon: 'fa-gas-pump', label: 'Combustible', value: vehiculo.combustible }
    ].filter(feature => feature.value);
    
    modalContent.innerHTML = `
      <div class="vehicle-details">
        <div class="slider-container" id="vehicleSlider">
          <div class="slider-wrapper">
            ${imagenes.map((url, index) => `
              <div class="slider-slide" data-index="${index}">
                <img src="${url}" 
                     alt="Imagen ${index + 1} de ${vehiculo.nombre}" 
                     loading="${index === 0 ? 'eager' : 'lazy'}"
                     onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
              </div>
            `).join('')}
          </div>
          
          ${imagenes.length > 1 ? `
            <button class="slider-button slider-button-prev" aria-label="Imagen anterior">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="slider-button slider-button-next" aria-label="Imagen siguiente">
              <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="slider-dots">
              ${imagenes.map((_, index) => `
                <button class="slider-dot ${index === 0 ? 'active' : ''}" 
                        aria-label="Imagen ${index + 1} de ${imagenes.length}"
                        data-index="${index}">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="details-content">
          <div class="vehicle-status-large" style="background: ${vehiculo.estadoColor}10; color: ${vehiculo.estadoColor}; border-color: ${vehiculo.estadoColor}30;">
            <i class="fas fa-circle" style="font-size: 0.5rem;"></i>
            ${vehiculo.estadoTexto}
          </div>
          
          <h1 class="detail-title">${vehiculo.nombre || 'Vehículo'}</h1>
          
          <div class="detail-price">
            ${window.productosManager?.formatPrice(vehiculo.precio) || 'Consultar precio'}
          </div>
          
          <div class="detail-specs-grid">
            ${features.map(feature => `
              <div class="detail-spec">
                <div class="detail-spec-label">
                  <i class="fas ${feature.icon}"></i> ${feature.label}
                </div>
                <div class="detail-spec-value">${feature.value}</div>
              </div>
            `).join('')}
          </div>
          
          ${vehiculo.descripcion ? `
            <div class="detail-description">
              <h3 class="detail-subtitle">Descripción</h3>
              <p>${vehiculo.descripcion}</p>
            </div>
          ` : ''}

          <div class="modal-actions">
            <button class="button button-whatsapp button-large" onclick="window.UIManager.contactVehicle('${vehicleId}')" aria-label="Consultar por WhatsApp">
              <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
            </button>
            <button class="button button-outline button-large" onclick="window.UIManager.customizeVehicle('${vehicleId}')" aria-label="Personalizar vehículo con kit">
              <i class="fas fa-crown"></i> Personalizar con Kit
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Inicializar slider
    if (imagenes.length > 0) {
      UISlider.init('vehicleSlider', imagenes, vehiculo.nombre, {
        autoplay: true,
        autoplaySpeed: 5000,
        loop: true,
        showDots: imagenes.length > 1,
        showNav: imagenes.length > 1
      });
    }
    
    // Mostrar modal
    this.showModal('vehicleModal');
  }
  
  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Guardar referencia al modal activo
    this.activeModal = modalId;
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Enfocar el modal para accesibilidad
    modal.setAttribute('aria-hidden', 'false');
    
    // Guardar el elemento que tenía el foco
    this.previouslyFocused = document.activeElement;
    
    // Encontrar y enfocar el primer elemento focusable
    const focusableContent = modal.querySelectorAll(this.focusableElements);
    if (focusableContent.length > 0) {
      focusableContent[0].focus();
    } else {
      modal.focus();
    }
    
    // Trabar el foco dentro del modal
    this.trapFocus(modal);
    
    // Agregar clase al body
    document.body.classList.add('modal-open');
  }
  
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Limpiar referencia
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    
    // Ocultar modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Restaurar foco al elemento anterior
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
    
    // Remover clase del body
    document.body.classList.remove('modal-open');
    
    // Destruir slider si existe
    if (modalId === 'vehicleModal') {
      UISlider.destroy('vehicleSlider');
    }
  }
  
  static trapFocus(modal) {
    const focusableContent = modal.querySelectorAll(this.focusableElements);
    const firstFocusableElement = focusableContent[0];
    const lastFocusableElement = focusableContent[focusableContent.length - 1];
    
    modal.addEventListener('keydown', (e) => {
      let isTabPressed = e.key === 'Tab';
      
      if (!isTabPressed) {
        return;
      }
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    });
  }
  
  static setupModalEvents() {
    // Botones de cerrar
    document.getElementById('closeVehicleModal')?.addEventListener('click', () => {
      this.closeModal('vehicleModal');
    });
    
    document.getElementById('closeCustomizationModal')?.addEventListener('click', () => {
      this.closeModal('customizationModal');
    });
    
    // Cerrar modal al hacer click fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });
  }
  
  static closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      this.closeModal(modal.id);
    });
  }
}

// ===================== UI KITS =====================
class UIKits {
  static selectedKit = null;
  static vehicleForCustomization = null;
  static kitOptions = [];
  
  static showKitsModal(vehicleId) {
    // Obtener datos usando window.productosManager
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      console.error(`❌ Vehículo ${vehicleId} no encontrado`);
      if (window.UINotifications) {
        UINotifications.error('Vehículo no encontrado');
      }
      return;
    }
    
    this.vehicleForCustomization = vehiculo;
    this.kitOptions = window.productosManager?.getKitsForDisplay() || [];
    
    const modalContent = document.getElementById('customizationContent');
    if (!modalContent) {
      console.error('❌ Elemento customizationContent no encontrado');
      return;
    }
    
    // Calcular precio total inicial
    const initialKit = this.kitOptions.find(k => k.id === 'standard') || this.kitOptions[0];
    const initialTotal = (vehiculo.precio || 0) + (initialKit?.precio || 0);
    
    modalContent.innerHTML = `
      <div class="customization-container">
        <div class="customization-header">
          <h2 class="modal-title">Personalizar ${vehiculo.nombre}</h2>
          <p class="modal-subtitle">Selecciona un kit de upgrade para ver el precio total estimado</p>
        </div>
        
        <div class="customization-body">
          <div class="kits-options-grid">
            ${this.kitOptions.map(kit => `
              <div class="kit-option ${kit.id === 'standard' ? 'selected' : ''}" 
                   data-kit-id="${kit.id}"
                   role="button"
                   tabindex="0"
                   aria-label="Seleccionar kit ${kit.nombre}: ${kit.descripcion}"
                   onclick="window.UIManager.selectKit('${kit.id}', '${vehicleId}')"
                   onkeydown="if(event.key === 'Enter' || event.key === ' ') { window.UIManager.selectKit('${kit.id}', '${vehicleId}'); event.preventDefault(); }">
                <div class="kit-option-icon" style="background: ${kit.color}20; color: ${kit.color};">
                  <i class="fas ${kit.icon || 'fa-cog'}"></i>
                </div>
                <h4 class="kit-option-title">${kit.nombre}</h4>
                <div class="kit-option-price">
                  ${kit.precio > 0 ? `+${window.productosManager?.formatPrice(kit.precio) || 'Consultar'}` : 'INCLUIDO'}
                </div>
                <p class="kit-option-description">${kit.descripcion}</p>
                <ul class="kit-features">
                  ${kit.includes?.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('') || ''}
                </ul>
                <button class="button button-small button-outline" 
                        onclick="window.UIManager.contactWithKit('${vehicleId}', '${kit.id}'); event.stopPropagation();"
                        aria-label="Cotizar kit ${kit.nombre} para ${vehiculo.nombre}">
                  <i class="fab fa-whatsapp"></i> Cotizar este kit
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="customization-summary" aria-live="polite">
            <div class="summary-line">
              <span>Vehículo base</span>
              <span class="price-value">${window.productosManager?.formatPrice(vehiculo.precio) || 'Consultar'}</span>
            </div>
            <div id="kit-selection-line" class="summary-line" style="${this.kitOptions.find(k => k.id === 'standard') ? '' : 'display: none;'}">
              <span id="selected-kit-name">Kit ${initialKit?.nombre || 'Standard'}</span>
              <span id="selected-kit-price" class="price-value">${initialKit?.precio > 0 ? `+${window.productosManager?.formatPrice(initialKit.precio)}` : 'INCLUIDO'}</span>
            </div>
            <div class="summary-total">
              <span>Total estimado</span>
              <span id="total-price" class="price-value">${window.productosManager?.formatPrice(initialTotal) || 'Consultar'}</span>
            </div>
            <p class="text-sm text-gray-600 mt-2">* Precios sujetos a verificación y disponibilidad</p>
          </div>
          
          <div class="modal-actions">
            <button class="button button-outline" onclick="window.UIManager.closeAllModals()" aria-label="Cancelar personalización">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="button button-whatsapp" onclick="window.UIManager.contactWithSelectedKit('${vehicleId}')" aria-label="Cotizar por WhatsApp">
              <i class="fab fa-whatsapp"></i> Cotizar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Seleccionar kit por defecto
    this.selectKit(initialKit?.id || 'standard', vehicleId);
    
    // Mostrar modal
    UIModals.showModal('customizationModal');
  }
  
  static selectKit(kitId, vehicleId) {
    const kit = this.kitOptions.find(k => k.id === kitId);
    if (!kit) {
      console.error(`❌ Kit ${kitId} no encontrado`);
      return;
    }
    
    // Actualizar selección visual
    document.querySelectorAll('.kit-option').forEach(opt => {
      opt.classList.remove('selected');
      opt.setAttribute('aria-selected', 'false');
    });
    
    const selectedOpt = document.querySelector(`[data-kit-id="${kitId}"]`);
    if (selectedOpt) {
      selectedOpt.classList.add('selected');
      selectedOpt.setAttribute('aria-selected', 'true');
      
      // Enfocar para accesibilidad
      selectedOpt.focus();
    }
    
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
        totalPrice.setAttribute('aria-label', `Total estimado: ${window.productosManager?.formatPrice(total) || 'Consultar'}`);
      }
    }
    
    this.selectedKit = kit;
    
    // Notificación de accesibilidad
    const notification = document.createElement('div');
    notification.className = 'sr-only';
    notification.textContent = `Kit ${kit.nombre} seleccionado. Precio adicional: ${kit.precio > 0 ? window.productosManager?.formatPrice(kit.precio) : 'Incluido'}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1000);
  }
  
  static contactWithKit(vehicleId, kitId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    const kit = this.kitOptions.find(k => k.id === kitId);
    
    if (!vehiculo || !kit) {
      if (window.UINotifications) {
        UINotifications.error('No se pudo generar la cotización');
      }
      return;
    }
    
    // Cerrar modal
    UIModals.closeModal('customizationModal');
    
    // Abrir WhatsApp
    if (window.productosManager?.getWhatsAppUrl) {
      const url = window.productosManager.getWhatsAppUrl(vehiculo, kit);
      
      // Confirmación antes de abrir
      if (window.confirm(`¿Deseas contactar por WhatsApp para cotizar el ${vehiculo.nombre} con Kit ${kit.nombre}?`)) {
        window.open(url, '_blank', 'noopener,noreferrer');
        
        // Seguimiento de evento
        if (typeof gtag !== 'undefined') {
          gtag('event', 'whatsapp_contact', {
            'vehicle_id': vehicleId,
            'kit_id': kitId,
            'vehicle_name': vehiculo.nombre,
            'kit_name': kit.nombre
          });
        }
      }
    } else {
      if (window.UINotifications) {
        UINotifications.error('No se pudo generar el enlace de WhatsApp');
      }
    }
  }
  
  static contactWithSelectedKit(vehicleId) {
    if (!this.selectedKit) {
      const defaultKit = this.kitOptions.find(k => k.id === 'standard') || this.kitOptions[0];
      this.selectKit(defaultKit?.id || 'standard', vehicleId);
    }
    
    this.contactWithKit(vehicleId, this.selectedKit.id);
  }
  
  static closeModal() {
    UIModals.closeModal('customizationModal');
  }
  
  // Método para actualizar kits dinámicamente
  static updateKits(kits) {
    this.kitOptions = kits;
  }
  
  // Método para obtener kit seleccionado
  static getSelectedKit() {
    return this.selectedKit;
  }
  
  // Método para obtener vehículo en personalización
  static getVehicleForCustomization() {
    return this.vehicleForCustomization;
  }
  
  // Método para calcular precio total
  static calculateTotal(vehiclePrice, kitPrice) {
    return (vehiclePrice || 0) + (kitPrice || 0);
  }
}

// Exportar todas las clases
export { UISlider, UIModals, UIKits };
