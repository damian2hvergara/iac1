// En la clase UIKits dentro de ui-components.js - CORREGIR ESTOS MÉTODOS:

static showKitsModal(vehicleId) {
  try {
    console.log(`🎨 Abriendo personalizador para vehículo: ${vehicleId}`);
    
    // Obtener datos usando window.productosManager (asegurarse que existe)
    if (!window.productosManager) {
      console.error('❌ productosManager no disponible');
      if (window.UINotifications) {
        window.UINotifications.error('Sistema no disponible');
      }
      return;
    }
    
    const vehiculo = window.productosManager.getVehiculoById(vehicleId);
    if (!vehiculo) {
      console.error(`❌ Vehículo ${vehicleId} no encontrado`);
      if (window.UINotifications) {
        window.UINotifications.error('Vehículo no encontrado');
      }
      return;
    }
    
    console.log(`✅ Vehículo encontrado: ${vehiculo.nombre}`);
    
    this.vehicleForCustomization = vehiculo;
    this.kitOptions = window.productosManager.getKitsForDisplay() || [];
    
    const modalContent = document.getElementById('customizationContent');
    if (!modalContent) {
      console.error('❌ Elemento customizationContent no encontrado en el DOM');
      
      // Crear el elemento si no existe
      this.createCustomizationModal();
      return;
    }
    
    // Calcular precio total inicial
    const initialKit = this.kitOptions.find(k => k.id === 'standard') || this.kitOptions[0];
    const initialTotal = (vehiculo.precio || 0) + (initialKit?.precio || 0);
    
    // Crear el contenido HTML
    modalContent.innerHTML = this.createKitsModalHTML(vehiculo, this.kitOptions, initialKit, initialTotal);
    
    // Seleccionar kit por defecto
    this.selectKit(initialKit?.id || 'standard', vehicleId);
    
    // Configurar eventos
    this.setupKitsModalEvents(vehicleId);
    
    // Mostrar modal
    UIModals.showModal('customizationModal');
    
    console.log(`✅ Personalizador abierto para: ${vehiculo.nombre}`);
    
  } catch (error) {
    console.error('❌ Error crítico en showKitsModal:', error);
    
    // Mostrar error al usuario
    if (window.UINotifications) {
      window.UINotifications.error('Error al abrir personalizador', 5000);
    }
    
    // Fallback: abrir WhatsApp directamente
    this.openWhatsAppFallback(vehicleId);
  }
}

static createKitsModalHTML(vehiculo, kits, initialKit, initialTotal) {
  return `
    <div class="customization-container">
      <div class="customization-header">
        <h2 class="modal-title">Personalizar ${vehiculo.nombre || 'Vehículo'}</h2>
        <p class="modal-subtitle">Selecciona un kit de upgrade para ver el precio total estimado</p>
      </div>
      
      <div class="customization-body">
        <div class="kits-options-grid">
          ${kits.map(kit => `
            <div class="kit-option ${kit.id === 'standard' ? 'selected' : ''}" 
                 data-kit-id="${kit.id}"
                 role="button"
                 tabindex="0"
                 aria-label="Seleccionar kit ${kit.nombre}: ${kit.descripcion}">
              <div class="kit-option-icon" style="background: ${kit.color || '#007AFF'}20; color: ${kit.color || '#007AFF'};">
                <i class="fas ${kit.icon || 'fa-cog'}"></i>
              </div>
              <h4 class="kit-option-title">${kit.nombre}</h4>
              <div class="kit-option-price">
                ${kit.precio > 0 ? `+${window.productosManager?.formatPrice ? window.productosManager.formatPrice(kit.precio) : `$${kit.precio.toLocaleString()}`}` : 'INCLUIDO'}
              </div>
              <p class="kit-option-description">${kit.descripcion}</p>
              ${kit.includes && kit.includes.length > 0 ? `
                <ul class="kit-features">
                  ${kit.includes.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}
                </ul>
              ` : ''}
              <button class="button button-small button-outline kit-direct-button" 
                      data-kit-id="${kit.id}"
                      aria-label="Cotizar kit ${kit.nombre} para ${vehiculo.nombre}">
                <i class="fab fa-whatsapp"></i> Cotizar este kit
              </button>
            </div>
          `).join('')}
        </div>
        
        <div class="customization-summary" aria-live="polite">
          <div class="summary-line">
            <span>Vehículo base</span>
            <span class="price-value">
              ${window.productosManager?.formatPrice ? window.productosManager.formatPrice(vehiculo.precio) : `$${vehiculo.precio?.toLocaleString() || 'Consultar'}`}
            </span>
          </div>
          <div id="kit-selection-line" class="summary-line">
            <span id="selected-kit-name">Kit ${initialKit?.nombre || 'Standard'}</span>
            <span id="selected-kit-price" class="price-value">
              ${initialKit?.precio > 0 ? 
                `+${window.productosManager?.formatPrice ? window.productosManager.formatPrice(initialKit.precio) : `$${initialKit.precio.toLocaleString()}`}` : 
                'INCLUIDO'}
            </span>
          </div>
          <div class="summary-total">
            <span>Total estimado</span>
            <span id="total-price" class="price-value">
              ${window.productosManager?.formatPrice ? window.productosManager.formatPrice(initialTotal) : `$${initialTotal.toLocaleString()}`}
            </span>
          </div>
          <p class="text-sm text-gray-600 mt-2">* Precios sujetos a verificación y disponibilidad</p>
        </div>
        
        <div class="modal-actions">
          <button class="button button-outline" id="cancel-customization" aria-label="Cancelar personalización">
            <i class="fas fa-times"></i> Cancelar
          </button>
          <button class="button button-whatsapp" id="whatsapp-customization" aria-label="Cotizar por WhatsApp">
            <i class="fab fa-whatsapp"></i> Cotizar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  `;
}

static setupKitsModalEvents(vehicleId) {
  // 1. Selección de kits
  document.querySelectorAll('.kit-option').forEach(option => {
    option.addEventListener('click', (e) => {
      if (e.target.closest('.kit-direct-button')) return; // No interferir con botones
      
      const kitId = option.dataset.kitId;
      this.selectKit(kitId, vehicleId);
    });
    
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const kitId = option.dataset.kitId;
        this.selectKit(kitId, vehicleId);
      }
    });
  });
  
  // 2. Botones directos de kit
  document.querySelectorAll('.kit-direct-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const kitId = button.dataset.kitId;
      this.contactWithKit(vehicleId, kitId);
    });
  });
  
  // 3. Botón de cancelar
  const cancelBtn = document.getElementById('cancel-customization');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      UIModals.closeModal('customizationModal');
    });
  }
  
  // 4. Botón de WhatsApp principal
  const whatsappBtn = document.getElementById('whatsapp-customization');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => {
      this.contactWithSelectedKit(vehicleId);
    });
  }
}

static selectKit(kitId, vehicleId) {
  console.log(`🎯 Seleccionando kit: ${kitId} para vehículo: ${vehicleId}`);
  
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
  this.updateKitSummary(kit, vehicleId);
  
  this.selectedKit = kit;
  
  console.log(`✅ Kit ${kit.nombre} seleccionado`);
}

static updateKitSummary(kit, vehicleId) {
  const kitLine = document.getElementById('kit-selection-line');
  const kitName = document.getElementById('selected-kit-name');
  const kitPrice = document.getElementById('selected-kit-price');
  const totalPrice = document.getElementById('total-price');
  
  if (!kitLine || !kitName || !kitPrice || !totalPrice) {
    console.error('❌ Elementos del resumen no encontrados');
    return;
  }
  
  kitLine.style.display = 'flex';
  kitName.textContent = `Kit ${kit.nombre}`;
  kitPrice.textContent = kit.precio > 0 ? 
    `+${window.productosManager?.formatPrice ? window.productosManager.formatPrice(kit.precio) : `$${kit.precio.toLocaleString()}`}` : 
    'INCLUIDO';
  
  const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
  if (vehiculo) {
    const total = (vehiculo.precio || 0) + (kit.precio || 0);
    totalPrice.textContent = window.productosManager?.formatPrice ? 
      window.productosManager.formatPrice(total) : 
      `$${total.toLocaleString()}`;
    
    totalPrice.setAttribute('aria-label', `Total estimado: ${totalPrice.textContent}`);
  }
}

static contactWithKit(vehicleId, kitId) {
  console.log(`📞 Contactando con kit ${kitId} para vehículo ${vehicleId}`);
  
  if (!window.productosManager) {
    console.error('❌ productosManager no disponible');
    return;
  }
  
  const vehiculo = window.productosManager.getVehiculoById(vehicleId);
  const kit = this.kitOptions.find(k => k.id === kitId);
  
  if (!vehiculo || !kit) {
    console.error('❌ No se pudo generar la cotización');
    if (window.UINotifications) {
      window.UINotifications.error('No se pudo generar la cotización');
    }
    return;
  }
  
  // Cerrar modal
  UIModals.closeModal('customizationModal');
  
  // Generar URL de WhatsApp
  let whatsappUrl;
  if (window.productosManager.getWhatsAppUrl) {
    whatsappUrl = window.productosManager.getWhatsAppUrl(vehiculo, kit);
  } else {
    // Fallback manual
    const config = window.CONFIG;
    const baseUrl = config?.urls?.social?.whatsapp || 'https://wa.me/56938654827';
    
    let mensaje = `Hola, estoy interesado en:\n\n`;
    mensaje += `*${vehiculo.nombre}*\n`;
    mensaje += `💰 *Precio:* ${vehiculo.precio ? `$${vehiculo.precio.toLocaleString()}` : 'Consultar'}\n`;
    mensaje += `📋 *Disponibilidad:* ${vehiculo.estadoTexto || 'Disponible'}\n`;
    
    if (vehiculo.ano) mensaje += `📅 *Año:* ${vehiculo.ano}\n`;
    if (vehiculo.kilometraje) mensaje += `🛣️ *Kilometraje:* ${vehiculo.kilometraje.toLocaleString()} km\n`;
    
    mensaje += `\n🎁 *Kit:* ${kit.nombre}\n`;
    if (kit.precio > 0) mensaje += `💎 *Precio kit:* +$${kit.precio.toLocaleString()}\n`;
    
    mensaje += `\nMe gustaría más información.`;
    whatsappUrl = `${baseUrl}?text=${encodeURIComponent(mensaje)}`;
  }
  
  // Confirmación antes de abrir
  const message = kit 
    ? `¿Deseas contactar por WhatsApp para cotizar el ${vehiculo.nombre} con Kit ${kit.nombre}?`
    : `¿Deseas contactar por WhatsApp para consultar sobre el ${vehiculo.nombre}?`;
  
  if (window.confirm(message)) {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
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
}

static contactWithSelectedKit(vehicleId) {
  console.log(`📞 Contactando con kit seleccionado para vehículo ${vehicleId}`);
  
  if (!this.selectedKit) {
    console.log('⚠️ No hay kit seleccionado, usando default');
    const defaultKit = this.kitOptions.find(k => k.id === 'standard') || this.kitOptions[0];
    this.selectKit(defaultKit?.id || 'standard', vehicleId);
  }
  
  if (this.selectedKit) {
    this.contactWithKit(vehicleId, this.selectedKit.id);
  } else {
    console.error('❌ No se pudo determinar el kit a contactar');
    if (window.UINotifications) {
      window.UINotifications.error('Error al generar cotización');
    }
  }
}

static createCustomizationModal() {
  console.log('🛠️ Creando modal de personalización...');
  
  // Verificar si el modal ya existe
  let modal = document.getElementById('customizationModal');
  if (!modal) {
    // Crear modal
    modal = document.createElement('div');
    modal.id = 'customizationModal';
    modal.className = 'modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'customizationTitle');
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="customizationTitle" class="modal-title">Personalizar Vehículo</h2>
          <button id="closeCustomizationModal" class="close-modal" aria-label="Cerrar modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div id="customizationContent">
            <!-- El contenido se cargará dinámicamente -->
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ Modal de personalización creado');
  }
  
  // Configurar botón de cerrar
  const closeBtn = document.getElementById('closeCustomizationModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      UIModals.closeModal('customizationModal');
    });
  }
}

static openWhatsAppFallback(vehicleId) {
  console.log(`🔄 Fallback a WhatsApp directo para vehículo ${vehicleId}`);
  
  if (!window.productosManager) return;
  
  const vehiculo = window.productosManager.getVehiculoById(vehicleId);
  if (!vehiculo) return;
  
  const config = window.CONFIG;
  const whatsappUrl = config?.urls?.social?.whatsapp || 'https://wa.me/56938654827';
  
  let mensaje = `Hola, estoy interesado en:\n\n`;
  mensaje += `*${vehiculo.nombre}*\n`;
  mensaje += `💰 *Precio:* ${vehiculo.precio ? `$${vehiculo.precio.toLocaleString()}` : 'Consultar'}\n`;
  
  window.open(`${whatsappUrl}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
}
