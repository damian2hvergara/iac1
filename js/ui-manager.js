// ui-manager.js - ORQUESTADOR PRINCIPAL DE UI MEJORADO - VERSIÓN COMPLETA
import { UICore, UINotifications } from './ui-core.js';
import { UIModals, UIKits, UISlider } from './ui-components.js';

export class UIManager {
  static initialized = false;
  static eventListeners = new Map();
  static activeModal = null;
  static previouslyFocused = null;
  
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
    
    // Prevenir múltiples clicks rápidos
    let lastClickTime = 0;
    document.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastClickTime < 300) {
        e.preventDefault();
        e.stopPropagation();
      }
      lastClickTime = now;
    }, true);
  }
  
  static exposeToGlobal() {
    // Solo exponer si no existen ya
    if (!window.UIManager) {
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
      window.customizeVehicle = this.customizeVehicle;
      window.contactVehicle = this.contactVehicle;
      window.mostrarDetallesVehiculo = this.mostrarDetallesVehiculo;
    }
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
  
  // ========== MÉTODOS PÚBLICOS PRINCIPALES ==========
  
  // Para vehiculos-manager.js y productos.js
  static mostrarDetallesVehiculo(vehicleId) {
    console.log(`🔍 Mostrando detalles del vehículo: ${vehicleId}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.showError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(vehicleId);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${vehicleId} no encontrado`);
        this.showError('Vehículo no encontrado');
        return;
      }
      
      // Verificar que UIModals esté disponible
      if (!window.UIModals || typeof window.UIModals.showVehicleDetails !== 'function') {
        console.error('❌ UIModals no disponible');
        
        // Fallback: abrir WhatsApp directamente
        this.contactVehicle(vehicleId);
        return;
      }
      
      window.UIModals.showVehicleDetails(vehicleId);
      
      // Seguimiento de evento
      this.trackEvent('view_vehicle_details', {
        vehicle_id: vehicleId,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      this.showError('Error al cargar los detalles del vehículo');
      
      // Fallback: contactar por WhatsApp
      this.contactVehicle(vehicleId);
    }
  }
  
  // Para personalización de vehículos
  static customizeVehicle(vehicleId) {
    console.log(`🔧 Personalizando vehículo: ${vehicleId}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.showError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(vehicleId);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${vehicleId} no encontrado`);
        this.showError('Vehículo no encontrado');
        return;
      }
      
      // Verificar que UIKits esté disponible
      if (!window.UIKits || typeof window.UIKits.showKitsModal !== 'function') {
        console.error('❌ UIKits no disponible');
        
        // Fallback: abrir WhatsApp directamente
        this.contactVehicle(vehicleId);
        return;
      }
      
      // Verificar y crear modal si no existe
      if (!document.getElementById('customizationModal')) {
        console.log('🛠️ Creando modal de personalización...');
        window.UIKits.createCustomizationModal();
      }
      
      // Abrir personalizador
      window.UIKits.showKitsModal(vehicleId);
      
      // Seguimiento de evento
      this.trackEvent('start_customization', {
        vehicle_id: vehicleId,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('❌ Error al personalizar vehículo:', error);
      this.showError('Error al abrir el personalizador');
      
      // Fallback extremo: contactar por WhatsApp
      this.contactVehicle(vehicleId);
    }
  }
  
  // Para contacto por WhatsApp
  static contactVehicle(vehicleId, kitId = null) {
    console.log(`📞 Contactando vehículo: ${vehicleId}${kitId ? ` con kit: ${kitId}` : ''}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.showError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(vehicleId);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${vehicleId} no encontrado`);
        this.showError('Vehículo no encontrado');
        return;
      }
      
      const kits = window.productosManager.getKitsForDisplay() || [];
      const kit = kitId ? kits.find(k => k.id === kitId) : null;
      
      // Generar URL de WhatsApp
      let whatsappUrl;
      if (window.productosManager.getWhatsAppUrl) {
        whatsappUrl = window.productosManager.getWhatsAppUrl(vehiculo, kit);
      } else {
        // Fallback manual
        const config = window.CONFIG || {};
        const baseUrl = config.urls?.social?.whatsapp || 'https://wa.me/56938654827';
        
        let mensaje = `Hola, estoy interesado en:\n\n`;
        mensaje += `*${vehiculo.nombre}*\n`;
        mensaje += `💰 *Precio:* ${vehiculo.precio ? `$${vehiculo.precio.toLocaleString()}` : 'Consultar'}\n`;
        mensaje += `📋 *Disponibilidad:* ${vehiculo.estadoTexto || 'Disponible'}\n`;
        
        if (vehiculo.ano) mensaje += `📅 *Año:* ${vehiculo.ano}\n`;
        if (vehiculo.kilometraje) mensaje += `🛣️ *Kilometraje:* ${vehiculo.kilometraje.toLocaleString()} km\n`;
        if (vehiculo.motor) mensaje += `⚙️ *Motor:* ${vehiculo.motor}\n`;
        
        if (kit) {
          mensaje += `\n🎁 *Kit:* ${kit.nombre}\n`;
          if (kit.precio > 0) mensaje += `💎 *Precio kit:* +$${kit.precio.toLocaleString()}\n`;
        }
        
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
        this.trackEvent('whatsapp_contact', {
          vehicle_id: vehicleId,
          kit_id: kitId,
          vehicle_name: vehiculo.nombre,
          kit_name: kit?.nombre
        });
      }
      
    } catch (error) {
      console.error('❌ Error al contactar:', error);
      this.showError('Error al generar el enlace de contacto');
      
      // Fallback extremo: URL básica de WhatsApp
      const baseUrl = 'https://wa.me/56938654827';
      const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
      const nombre = vehiculo?.nombre || 'Vehículo';
      const fallbackUrl = `${baseUrl}?text=${encodeURIComponent(`Hola, estoy interesado en: ${nombre}`)}`;
      
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }
  
  // ========== SISTEMA DE NOTIFICACIONES ==========
  
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
  
  // ========== MÉTODOS PARA FILTROS Y CONTADORES ==========
  
  static updateFilterButtons(activeFilter) {
    UICore.updateFilterButtons(activeFilter);
  }
  
  static updateCounter(elementId, count, prefix = '', suffix = '') {
    UICore.updateCounter(elementId, count, prefix, suffix);
  }
  
  static filtrarVehiculos(filter) {
    console.log(`🎯 Filtro solicitado: ${filter}`);
    
    if (window.productosManager && typeof window.productosManager.filtrarVehiculos === 'function') {
      window.productosManager.filtrarVehiculos(filter);
    } else {
      console.error('❌ productosManager o método filtrarVehiculos no disponible');
    }
  }
  
  // ========== MÉTODOS DE SLIDER ==========
  
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
  
  // ========== MÉTODOS DE KITS ==========
  
  static selectKit(kitId, vehicleId) {
    if (window.UIKits && typeof window.UIKits.selectKit === 'function') {
      window.UIKits.selectKit(kitId, vehicleId);
    }
  }
  
  static contactWithKit(vehicleId, kitId) {
    if (window.UIKits && typeof window.UIKits.contactWithKit === 'function') {
      window.UIKits.contactWithKit(vehicleId, kitId);
    }
  }
  
  static contactWithSelectedKit(vehicleId) {
    if (window.UIKits && typeof window.UIKits.contactWithSelectedKit === 'function') {
      window.UIKits.contactWithSelectedKit(vehicleId);
    }
  }
  
  static getSelectedKit() {
    if (window.UIKits && typeof window.UIKits.getSelectedKit === 'function') {
      return window.UIKits.getSelectedKit();
    }
    return null;
  }
  
  // ========== MÉTODOS DE UI CORE ==========
  
  static showLoading(containerId, message = 'Cargando...') {
    UICore.showLoading(containerId, message);
  }
  
  static hideLoading(containerId) {
    UICore.hideLoading(containerId);
  }
  
  static showModal(modalId) {
    this.activeModal = modalId;
    UIModals.showModal(modalId);
  }
  
  static closeModal(modalId) {
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    UIModals.closeModal(modalId);
  }
  
  static closeAllModals() {
    this.activeModal = null;
    UIModals.closeAllModals();
  }
  
  static smoothScrollTo(elementId, offset = 80) {
    UICore.smoothScrollTo(elementId, offset);
  }
  
  static clearNotifications() {
    UINotifications.clearAll();
  }
  
  // ========== MANEJO DE EVENTOS ==========
  
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
  
  // ========== MÉTODOS DE UTILIDAD ==========
  
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
  
  // ========== MÉTODOS DE ALMACENAMIENTO ==========
  
  static getStorage(key) {
    return UICore.getLocalStorage(key);
  }
  
  static setStorage(key, value) {
    UICore.setLocalStorage(key, value);
  }
  
  static removeStorage(key) {
    UICore.removeLocalStorage(key);
  }
  
  static getSession(key) {
    return UICore.getSessionStorage(key);
  }
  
  static setSession(key, value) {
    UICore.setSessionStorage(key, value);
  }
  
  static removeSession(key) {
    UICore.removeSessionStorage(key);
  }
  
  static getCookie(name) {
    return UICore.getCookie(name);
  }
  
  static setCookie(name, value, days = 7) {
    UICore.setCookie(name, value, days);
  }
  
  static deleteCookie(name) {
    UICore.deleteCookie(name);
  }
  
  // ========== MÉTODOS DE URL ==========
  
  static getUrlParams() {
    return UICore.getUrlParams();
  }
  
  static setUrlParams(params) {
    UICore.setUrlParams(params);
  }
  
  // ========== ANALYTICS Y SEGUIMIENTO ==========
  
  static trackEvent(eventName, eventData = {}) {
    try {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
      }
      
      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, eventData);
      }
      
      // Console para desarrollo
      console.log(`📊 Evento: ${eventName}`, eventData);
      
      // Evento personalizado
      const event = new CustomEvent(`ui:${eventName}`, { detail: eventData });
      document.dispatchEvent(event);
      
      // Guardar en localStorage para análisis posterior
      const analyticsKey = 'ui_analytics_events';
      const events = this.getStorage(analyticsKey) || [];
      events.push({
        event: eventName,
        data: eventData,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Mantener solo los últimos 100 eventos
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      this.setStorage(analyticsKey, events);
      
    } catch (error) {
      console.warn('⚠️ Error en trackEvent:', error);
    }
  }
  
  static trackPageView(pageName) {
    this.trackEvent('page_view', { page_name: pageName });
  }
  
  static getAnalyticsEvents() {
    return this.getStorage('ui_analytics_events') || [];
  }
  
  static clearAnalytics() {
    this.removeStorage('ui_analytics_events');
  }
  
  // ========== PERFORMANCE ==========
  
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
  
  // ========== MANEJO DE ERRORES ==========
  
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
    
    // Lanzar evento global de error
    const errorEvent = new CustomEvent('ui:error', { 
      detail: { error, context } 
    });
    document.dispatchEvent(errorEvent);
  }
  
  // ========== INTERNACIONALIZACIÓN ==========
  
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
  
  // ========== ACCESIBILIDAD ==========
  
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
  
  static toggleDarkMode(enabled = null) {
    const current = document.documentElement.classList.contains('dark-mode');
    const shouldEnable = enabled !== null ? enabled : !current;
    
    if (shouldEnable) {
      document.documentElement.classList.add('dark-mode');
      this.setCookie('dark_mode', 'true', 365);
    } else {
      document.documentElement.classList.remove('dark-mode');
      this.deleteCookie('dark_mode');
    }
    
    this.trackEvent('accessibility_setting', {
      setting: 'dark_mode',
      enabled: shouldEnable
    });
  }
  
  // ========== RESET/CLEANUP ==========
  
  static destroy() {
    console.log('🧹 Destruyendo UIManager...');
    
    // Limpiar todos los event listeners
    this.removeAllEventListeners();
    
    // Cerrar todos los modales
    this.closeAllModals();
    
    // Limpiar notificaciones
    this.clearNotifications();
    
    // Destruir todos los sliders
    if (UISlider.sliders) {
      UISlider.sliders.forEach((_, sliderId) => {
        UISlider.destroy(sliderId);
      });
    }
    
    // Remover del global scope
    delete window.UIManager;
    delete window.UICore;
    delete window.UIModals;
    delete window.UIKits;
    delete window.UISlider;
    delete window.UINotifications;
    
    // Remover métodos abreviados
    delete window.showNotification;
    delete window.showError;
    delete window.showSuccess;
    delete window.showWarning;
    delete window.showInfo;
    delete window.closeAllModals;
    delete window.showModal;
    delete window.closeModal;
    delete window.customizeVehicle;
    delete window.contactVehicle;
    delete window.mostrarDetallesVehiculo;
    
    this.initialized = false;
    this.activeModal = null;
    this.previouslyFocused = null;
    
    console.log('✅ UIManager destruido');
  }
  
  // ========== HEALTH CHECK ==========
  
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
      modules: {
        sliders: UISlider.sliders ? UISlider.sliders.size : 0,
        notifications: UINotifications.getCount ? UINotifications.getCount() : 0
      },
      breakpoint: UICore.getBreakpoint ? UICore.getBreakpoint() : 'unknown',
      preferences: UICore.getUserPreferences ? UICore.getUserPreferences() : {}
    };
  }
  
  // ========== DEBUG METHODS ==========
  
  static debug() {
    console.group('🔍 UIManager Debug Info');
    console.log('Initialized:', this.initialized);
    console.log('Active Modal:', this.activeModal);
    console.log('Event Listeners:', this.eventListeners.size);
    console.log('Health Check:', this.healthCheck());
    console.groupEnd();
    
    return this.healthCheck();
  }
  
  static testAll() {
    console.group('🧪 UIManager Tests');
    
    // Test notificaciones
    try {
      this.showSuccess('Test de notificación exitosa', 1000);
      console.log('✅ Notificaciones: OK');
    } catch (e) {
      console.error('❌ Notificaciones: FAILED', e);
    }
    
    // Test modales
    try {
      console.log('✅ Modales: Available (no opening for test)');
    } catch (e) {
      console.error('❌ Modales: FAILED', e);
    }
    
    // Test productosManager
    try {
      const hasPM = !!window.productosManager;
      console.log(`✅ productosManager: ${hasPM ? 'Available' : 'Not Available'}`);
    } catch (e) {
      console.error('❌ productosManager test: FAILED', e);
    }
    
    console.groupEnd();
  }
}

// Inicialización automática si se usa como script global
if (typeof window !== 'undefined' && !window.UIManager) {
  window.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(() => {
      // Inicializar con opciones por defecto
      UIManager.init({
        autoInitSlider: true
      }).then(success => {
        if (success) {
          console.log('🚀 UIManager inicializado automáticamente');
        }
      }).catch(error => {
        console.error('❌ Error inicializando UIManager automáticamente:', error);
      });
    }, 100);
  });
}

// Exportar clase
export default UIManager;
