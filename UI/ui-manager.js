// ui-manager.js - ORQUESTADOR PRINCIPAL DE UI MEJORADO
import { UICore, UINotifications } from './ui-core.js';
import { UIModals, UIKits, UISlider } from './ui-components.js';

export class UIManager {
  static initialized = false;
  static eventListeners = new Map();
  
  static async init(options = {}) {
    if (this.initialized) {
      console.warn('⚠️ UIManager ya está inicializado');
      return true;
    }
    
    console.log('🎭 Inicializando UIManager...');
    
    try {
      // Configurar preferencias del usuario
      UICore.applyUserPreferences();
      
      // Configurar eventos básicos
      UICore.setupEventListeners();
      UIModals.setupModalEvents();
      
      // Configurar eventos globales
      this.setupGlobalEvents();
      
      // Hacer disponibles globalmente
      this.exposeToGlobal();
      
      // Inicializar componentes específicos
      if (options.autoInitSlider) {
        this.initAutoSliders();
      }
      
      this.initialized = true;
      console.log('✅ UIManager listo');
      
      // Notificación de bienvenida
      UINotifications.success('Sistema UI inicializado correctamente', 3000);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando UIManager:', error);
      UINotifications.error('Error al inicializar el sistema UI');
      return false;
    }
  }
  
  static setupGlobalEvents() {
    // Detectar cambios en conexión
    window.addEventListener('online', () => {
      UINotifications.success('Conectado a internet', 3000);
    });
    
    window.addEventListener('offline', () => {
      UINotifications.warning('Sin conexión a internet', 5000);
    });
    
    // Detectar cambios en visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pausar sliders cuando la página no es visible
        UISlider.stopAutoplay('vehicleSlider');
      } else {
        // Reanudar sliders cuando la página vuelve a ser visible
        UISlider.startAutoplay('vehicleSlider');
      }
    });
    
    // Prevenir zoom en dispositivos móviles con doble tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Mejorar rendimiento en scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      document.body.classList.add('scrolling');
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 100);
    });
  }
  
  static exposeToGlobal() {
    window.UIManager = this;
    window.UICore = UICore;
    window.UIModals = UIModals;
    window.UIKits = UIKits;
    window.UISlider = UISlider;
    window.UINotifications = UINotifications;
    
    // Métodos abreviados para uso rápido
    window.showNotification = UINotifications.show;
    window.showError = UINotifications.error;
    window.showSuccess = UINotifications.success;
    window.showWarning = UINotifications.warning;
    window.showInfo = UINotifications.info;
    
    window.closeAllModals = this.closeAllModals;
    window.showModal = this.showModal;
    window.closeModal = this.closeModal;
  }
  
  static initAutoSliders() {
    // Inicializar sliders automáticamente si tienen data attributes
    document.querySelectorAll('[data-slider]').forEach(slider => {
      const sliderId = slider.id || `slider-${Date.now()}`;
      const images = JSON.parse(slider.dataset.images || '[]');
      const vehicleName = slider.dataset.vehicleName || '';
      
      if (images.length > 0) {
        UISlider.init(sliderId, images, vehicleName, {
          autoplay: slider.dataset.autoplay === 'true',
          autoplaySpeed: parseInt(slider.dataset.autoplaySpeed) || 5000,
          loop: slider.dataset.loop === 'true'
        });
      }
    });
  }
  
  // ========== MÉTODOS PÚBLICOS ==========
  
  // Para vehiculos-manager.js y productos.js
  static mostrarDetallesVehiculo(vehicleId) {
    try {
      const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
      if (!vehiculo) {
        this.showError('Vehículo no encontrado');
        return;
      }
      
      UIModals.showVehicleDetails(vehicleId);
      
      // Seguimiento de evento
      this.trackEvent('view_vehicle_details', {
        vehicle_id: vehicleId,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      this.showError('Error al cargar los detalles del vehículo');
    }
  }
  
  // Notificaciones
  static showNotification(mensaje, tipo = 'info', duration = 5000, title = null) {
    return UINotifications.show(mensaje, tipo, duration, title);
  }
  
  static showError(mensaje, duration = 5000) {
    return UINotifications.error(mensaje, duration);
  }
  
  static showSuccess(mensaje, duration = 5000) {
    return UINotifications.success(mensaje, duration);
  }
  
  static showWarning(mensaje, duration = 5000) {
    return UINotifications.warning(mensaje, duration);
  }
  
  static showInfo(mensaje, duration = 5000) {
    return UINotifications.info(mensaje, duration);
  }
  
  // Para productos.js (filtros)
  static updateFilterButtons(activeFilter) {
    UICore.updateFilterButtons(activeFilter);
  }
  
  static updateCounter(elementId, count, prefix = '', suffix = '') {
    UICore.updateCounter(elementId, count, prefix, suffix);
  }
  
  // Para botones en HTML
  static customizeVehicle(vehicleId) {
    try {
      const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
      if (!vehiculo) {
        this.showError('Vehículo no encontrado');
        return;
      }
      
      UIKits.showKitsModal(vehicleId);
      
      // Seguimiento de evento
      this.trackEvent('start_customization', {
        vehicle_id: vehicleId,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('Error al personalizar vehículo:', error);
      this.showError('Error al abrir el personalizador');
    }
  }
  
  static contactVehicle(vehicleId, kitId = null) {
    try {
      const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
      if (!vehiculo) {
        this.showError('Vehículo no encontrado');
        return;
      }
      
      const kits = window.productosManager?.getKitsForDisplay() || [];
      const kit = kitId ? kits.find(k => k.id === kitId) : null;
      
      if (window.productosManager?.getWhatsAppUrl) {
        const url = window.productosManager.getWhatsAppUrl(vehiculo, kit);
        
        // Confirmación
        const message = kit 
          ? `¿Deseas contactar por WhatsApp para cotizar el ${vehiculo.nombre} con Kit ${kit.nombre}?`
          : `¿Deseas contactar por WhatsApp para consultar sobre el ${vehiculo.nombre}?`;
        
        if (window.confirm(message)) {
          window.open(url, '_blank', 'noopener,noreferrer');
          
          // Seguimiento de evento
          this.trackEvent('whatsapp_contact', {
            vehicle_id: vehicleId,
            kit_id: kitId,
            vehicle_name: vehiculo.nombre,
            kit_name: kit?.nombre
          });
        }
      } else {
        this.showError('No se pudo generar el enlace de contacto');
      }
      
    } catch (error) {
      console.error('Error al contactar:', error);
      this.showError('Error al generar el enlace de contacto');
    }
  }
  
  // Slider methods
  static initSlider(sliderId, images, vehicleName = '', options = {}) {
    return UISlider.init(sliderId, images, vehicleName, options);
  }
  
  static prevSlide(sliderId = 'vehicleSlider') {
    UISlider.prevSlide(sliderId);
  }
  
  static nextSlide(sliderId = 'vehicleSlider') {
    UISlider.nextSlide(sliderId);
  }
  
  static goToSlide(sliderId = 'vehicleSlider', index) {
    UISlider.goToSlide(sliderId, index);
  }
  
  static getSlider(sliderId = 'vehicleSlider') {
    return UISlider.getSlider(sliderId);
  }
  
  static updateSlider(sliderId, images, vehicleName = '') {
    return UISlider.update(sliderId, images, vehicleName);
  }
  
  // Kit methods
  static selectKit(kitId, vehicleId) {
    UIKits.selectKit(kitId, vehicleId);
  }
  
  static contactWithKit(vehicleId, kitId) {
    UIKits.contactWithKit(vehicleId, kitId);
  }
  
  static contactWithSelectedKit(vehicleId) {
    UIKits.contactWithSelectedKit(vehicleId);
  }
  
  static getSelectedKit() {
    return UIKits.getSelectedKit();
  }
  
  // UI Core methods
  static showLoading(containerId, message = 'Cargando...') {
    UICore.showLoading(containerId, message);
  }
  
  static hideLoading(containerId) {
    UICore.hideLoading(containerId);
  }
  
  static showModal(modalId) {
    UIModals.showModal(modalId);
  }
  
  static closeModal(modalId) {
    UIModals.closeModal(modalId);
  }
  
  static closeAllModals() {
    UIModals.closeAllModals();
  }
  
  static smoothScrollTo(elementId, offset = 80) {
    UICore.smoothScrollTo(elementId, offset);
  }
  
  // Clear notifications
  static clearNotifications() {
    UINotifications.clearAll();
  }
  
  // Event handling
  static addEventListener(event, callback, element = document) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    element.addEventListener(event, callback);
    this.eventListeners.get(event).push({ element, callback });
  }
  
  static removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        if (listener.callback === callback) {
          listener.element.removeEventListener(event, callback);
        }
      });
      
      this.eventListeners.set(event, listeners.filter(l => l.callback !== callback));
    }
  }
  
  static removeAllEventListeners() {
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        listener.element.removeEventListener(event, listener.callback);
      });
    });
    
    this.eventListeners.clear();
  }
  
  // Utility methods
  static formatPrice(price) {
    return UICore.formatPrice(price);
  }
  
  static formatNumber(number) {
    return UICore.formatNumber(number);
  }
  
  static copyToClipboard(text) {
    return UICore.copyToClipboard(text).then(success => {
      if (success) {
        this.showSuccess('Copiado al portapapeles');
      } else {
        this.showError('Error al copiar');
      }
      return success;
    });
  }
  
  static isValidEmail(email) {
    return UICore.isValidEmail(email);
  }
  
  static isValidPhone(phone) {
    return UICore.isValidPhone(phone);
  }
  
  // Storage methods
  static getStorage(key) {
    return UICore.getLocalStorage(key);
  }
  
  static setStorage(key, value) {
    UICore.setLocalStorage(key, value);
  }
  
  static removeStorage(key) {
    UICore.removeLocalStorage(key);
  }
  
  // Session storage methods
  static getSession(key) {
    return UICore.getSessionStorage(key);
  }
  
  static setSession(key, value) {
    UICore.setSessionStorage(key, value);
  }
  
  static removeSession(key) {
    UICore.removeSessionStorage(key);
  }
  
  // Cookie methods
  static getCookie(name) {
    return UICore.getCookie(name);
  }
  
  static setCookie(name, value, days = 7) {
    UICore.setCookie(name, value, days);
  }
  
  static deleteCookie(name) {
    UICore.deleteCookie(name);
  }
  
  // URL methods
  static getUrlParams() {
    return UICore.getUrlParams();
  }
  
  static setUrlParams(params) {
    UICore.setUrlParams(params);
  }
  
  // Analytics/tracking
  static trackEvent(eventName, eventData = {}) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('trackCustom', eventName, eventData);
    }
    
    // Console para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Evento: ${eventName}`, eventData);
    }
    
    // Evento personalizado
    const event = new CustomEvent(`ui:${eventName}`, { detail: eventData });
    document.dispatchEvent(event);
  }
  
  static trackPageView(pageName) {
    this.trackEvent('page_view', { page_name: pageName });
  }
  
  // Performance
  static measurePerformance(metricName, callback) {
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) {
      console.warn(`⚠️ Métrica lenta: ${metricName} tomó ${duration.toFixed(2)}ms`);
    }
    
    this.trackEvent('performance_metric', {
      metric_name: metricName,
      duration_ms: Math.round(duration)
    });
    
    return result;
  }
  
  // Error handling
  static handleError(error, context = 'unknown') {
    console.error(`❌ Error en ${context}:`, error);
    
    // Notificación al usuario
    const userMessage = error.userMessage || 'Ocurrió un error. Por favor, intenta nuevamente.';
    this.showError(userMessage);
    
    // Seguimiento de error
    this.trackEvent('error', {
      context,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Reporte a servidor (si está configurado)
    if (window.errorReportingEndpoint) {
      fetch(window.errorReportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => { /* Ignorar errores en el reporte */ });
    }
  }
  
  // Internationalization
  static setLanguage(lang) {
    document.documentElement.lang = lang;
    this.setCookie('preferred_language', lang, 365);
    
    // Evento para notificar cambio de idioma
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    
    this.trackEvent('language_change', { language: lang });
  }
  
  static getLanguage() {
    return document.documentElement.lang || 
           this.getCookie('preferred_language') || 
           navigator.language || 
           'es';
  }
  
  // Accessibility
  static setHighContrast(enabled) {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
      this.setCookie('high_contrast', 'true', 365);
    } else {
      document.documentElement.classList.remove('high-contrast');
      this.deleteCookie('high_contrast');
    }
    
    this.trackEvent('accessibility_setting', {
      setting: 'high_contrast',
      enabled
    });
  }
  
  static setFontSize(size) {
    const sizes = ['small', 'normal', 'large', 'x-large'];
    if (sizes.includes(size)) {
      document.documentElement.setAttribute('data-font-size', size);
      this.setCookie('font_size', size, 365);
      
      this.trackEvent('accessibility_setting', {
        setting: 'font_size',
        value: size
      });
    }
  }
  
  // Reset/cleanup
  static destroy() {
    // Limpiar todos los event listeners
    this.removeAllEventListeners();
    
    // Cerrar todos los modales
    this.closeAllModals();
    
    // Limpiar notificaciones
    this.clearNotifications();
    
    // Destruir todos los sliders
    UISlider.sliders.forEach((_, sliderId) => {
      UISlider.destroy(sliderId);
    });
    
    // Remover del global scope
    delete window.UIManager;
    delete window.UICore;
    delete window.UIModals;
    delete window.UIKits;
    delete window.UISlider;
    delete window.UINotifications;
    delete window.showNotification;
    delete window.showError;
    delete window.showSuccess;
    delete window.showWarning;
    delete window.showInfo;
    delete window.closeAllModals;
    delete window.showModal;
    delete window.closeModal;
    
    this.initialized = false;
    console.log('🧹 UIManager destruido');
  }
  
  // Health check
  static healthCheck() {
    return {
      initialized: this.initialized,
      online: navigator.onLine,
      performance: {
        memory: performance.memory,
        timing: performance.timing
      },
      storage: {
        localStorage: localStorage.length,
        sessionStorage: sessionStorage.length
      },
      components: {
        sliders: UISlider.sliders.size,
        notifications: UINotifications.getCount()
      },
      breakpoint: UICore.getBreakpoint(),
      preferences: UICore.getUserPreferences()
    };
  }
}

// Inicialización automática si se usa como script global
if (typeof window !== 'undefined' && !window.UIManager) {
  window.addEventListener('DOMContentLoaded', () => {
    // Inicializar con opciones por defecto
    UIManager.init({
      autoInitSlider: true
    }).then(success => {
      if (success) {
        console.log('🚀 UIManager inicializado automáticamente');
      }
    });
  });
}
