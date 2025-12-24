// ui-manager.js - VERSIÓN COMPLETA SIN PALABRAS RESERVADAS
import { UICore, UINotifications } from './ui-core.js';
import { UIModals, UIKits, UISlider } from './ui-components.js';

export class UIManager {
  static inicializado = false;
  static listenersEventos = new Map();
  static modalActivo = null;
  static elementoPrevioConFoco = null;
  
  static async init(opciones = {}) {
    if (this.inicializado) {
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
      this.configurarEventosGlobales();
      
      // Hacer disponibles globalmente
      this.exponerGlobalmente();
      
      // Inicializar componentes específicos
      if (opciones.autoInitSlider) {
        this.inicializarSlidersAutomaticos();
      }
      
      this.inicializado = true;
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
  
  static configurarEventosGlobales() {
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
    let ultimoTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const ahora = Date.now();
      if (ahora - ultimoTouchEnd <= 300) {
        e.preventDefault();
      }
      ultimoTouchEnd = ahora;
    }, false);
    
    // Mejorar rendimiento en scroll
    let timeoutScroll;
    window.addEventListener('scroll', () => {
      document.body.classList.add('scrolling');
      
      clearTimeout(timeoutScroll);
      timeoutScroll = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 100);
    });
    
    // Prevenir múltiples clicks rápidos
    let ultimoClickTime = 0;
    document.addEventListener('click', (e) => {
      const ahora = Date.now();
      if (ahora - ultimoClickTime < 300) {
        e.preventDefault();
        e.stopPropagation();
      }
      ultimoClickTime = ahora;
    }, true);
  }
  
  static exponerGlobalmente() {
    // Solo exponer si no existen ya
    if (!window.UIManager) {
      window.UIManager = this;
      window.UICore = UICore;
      window.UIModals = UIModals;
      window.UIKits = UIKits;
      window.UISlider = UISlider;
      window.UINotifications = UINotifications;
      
      // Métodos abreviados para uso rápido
      window.mostrarNotificacion = UINotifications.show;
      window.mostrarError = UINotifications.error;
      window.mostrarExito = UINotifications.success;
      window.mostrarAdvertencia = UINotifications.warning;
      window.mostrarInfo = UINotifications.info;
      
      window.cerrarTodosModales = this.cerrarTodosModales;
      window.mostrarModal = this.mostrarModal;
      window.cerrarModal = this.cerrarModal;
      window.personalizarVehiculo = this.personalizarVehiculo;
      window.contactarVehiculo = this.contactarVehiculo;
      window.mostrarDetallesVehiculo = this.mostrarDetallesVehiculo;
    }
  }
  
  static inicializarSlidersAutomaticos() {
    // Inicializar sliders automáticamente si tienen data attributes
    document.querySelectorAll('[data-slider]').forEach(slider => {
      const sliderId = slider.id || `slider-${Date.now()}`;
      const imagenes = JSON.parse(slider.dataset.images || '[]');
      const nombreVehiculo = slider.dataset.vehicleName || '';
      
      if (imagenes.length > 0) {
        UISlider.init(sliderId, imagenes, nombreVehiculo, {
          autoplay: slider.dataset.autoplay === 'true',
          autoplaySpeed: parseInt(slider.dataset.autoplaySpeed) || 5000,
          loop: slider.dataset.loop === 'true'
        });
      }
    });
  }
  
  // ========== MÉTODOS PÚBLICOS PRINCIPALES ==========
  
  static mostrarDetallesVehiculo(idVehiculo) {
    console.log(`🔍 Mostrando detalles del vehículo: ${idVehiculo}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.mostrarError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(idVehiculo);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${idVehiculo} no encontrado`);
        this.mostrarError('Vehículo no encontrado');
        return;
      }
      
      // Verificar que UIModals esté disponible
      if (!window.UIModals || typeof window.UIModals.showVehicleDetails !== 'function') {
        console.error('❌ UIModals no disponible');
        
        // Fallback: abrir WhatsApp directamente
        this.contactarVehiculo(idVehiculo);
        return;
      }
      
      window.UIModals.showVehicleDetails(idVehiculo);
      
      // Seguimiento de evento
      this.registrarEvento('view_vehicle_details', {
        vehicle_id: idVehiculo,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      this.mostrarError('Error al cargar los detalles del vehículo');
      
      // Fallback: contactar por WhatsApp
      this.contactarVehiculo(idVehiculo);
    }
  }
  
  static personalizarVehiculo(idVehiculo) {
    console.log(`🔧 Personalizando vehículo: ${idVehiculo}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.mostrarError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(idVehiculo);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${idVehiculo} no encontrado`);
        this.mostrarError('Vehículo no encontrado');
        return;
      }
      
      // Verificar que UIKits esté disponible
      if (!window.UIKits || typeof window.UIKits.showKitsModal !== 'function') {
        console.error('❌ UIKits no disponible');
        
        // Fallback: abrir WhatsApp directamente
        this.contactarVehiculo(idVehiculo);
        return;
      }
      
      // Verificar y crear modal si no existe
      if (!document.getElementById('customizationModal')) {
        console.log('🛠️ Creando modal de personalización...');
        window.UIKits.createCustomizationModal();
      }
      
      // Abrir personalizador
      window.UIKits.showKitsModal(idVehiculo);
      
      // Seguimiento de evento
      this.registrarEvento('start_customization', {
        vehicle_id: idVehiculo,
        vehicle_name: vehiculo.nombre
      });
      
    } catch (error) {
      console.error('❌ Error al personalizar vehículo:', error);
      this.mostrarError('Error al abrir el personalizador');
      
      // Fallback extremo: contactar por WhatsApp
      this.contactarVehiculo(idVehiculo);
    }
  }
  
  static contactarVehiculo(idVehiculo, idKit = null) {
    console.log(`📞 Contactando vehículo: ${idVehiculo}${idKit ? ` con kit: ${idKit}` : ''}`);
    
    try {
      if (!window.productosManager) {
        console.error('❌ productosManager no disponible');
        this.mostrarError('Sistema no disponible');
        return;
      }
      
      const vehiculo = window.productosManager.getVehiculoById(idVehiculo);
      if (!vehiculo) {
        console.error(`❌ Vehículo ${idVehiculo} no encontrado`);
        this.mostrarError('Vehículo no encontrado');
        return;
      }
      
      const kits = window.productosManager.getKitsForDisplay() || [];
      const kit = idKit ? kits.find(k => k.id === idKit) : null;
      
      // Generar URL de WhatsApp
      let urlWhatsApp;
      if (window.productosManager.getWhatsAppUrl) {
        urlWhatsApp = window.productosManager.getWhatsAppUrl(vehiculo, kit);
      } else {
        // Fallback manual
        const config = window.CONFIG || {};
        const urlBase = config.urls?.social?.whatsapp || 'https://wa.me/56938654827';
        
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
        urlWhatsApp = `${urlBase}?text=${encodeURIComponent(mensaje)}`;
      }
      
      // Confirmación antes de abrir
      const mensajeConfirmacion = kit 
        ? `¿Deseas contactar por WhatsApp para cotizar el ${vehiculo.nombre} con Kit ${kit.nombre}?`
        : `¿Deseas contactar por WhatsApp para consultar sobre el ${vehiculo.nombre}?`;
      
      if (window.confirm(mensajeConfirmacion)) {
        window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
        
        // Seguimiento de evento
        this.registrarEvento('whatsapp_contact', {
          vehicle_id: idVehiculo,
          kit_id: idKit,
          vehicle_name: vehiculo.nombre,
          kit_name: kit?.nombre
        });
      }
      
    } catch (error) {
      console.error('❌ Error al contactar:', error);
      this.mostrarError('Error al generar el enlace de contacto');
      
      // Fallback extremo: URL básica de WhatsApp
      const urlBase = 'https://wa.me/56938654827';
      const vehiculo = window.productosManager?.getVehiculoById(idVehiculo);
      const nombre = vehiculo?.nombre || 'Vehículo';
      const urlFallback = `${urlBase}?text=${encodeURIComponent(`Hola, estoy interesado en: ${nombre}`)}`;
      
      window.open(urlFallback, '_blank', 'noopener,noreferrer');
    }
  }
  
  // ========== SISTEMA DE NOTIFICACIONES ==========
  
  static mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000, titulo = null) {
    return UINotifications.show(mensaje, tipo, duracion, titulo);
  }
  
  static mostrarError(mensaje, duracion = 5000) {
    return UINotifications.error(mensaje, duracion);
  }
  
  static mostrarExito(mensaje, duracion = 5000) {
    return UINotifications.success(mensaje, duracion);
  }
  
  static mostrarAdvertencia(mensaje, duracion = 5000) {
    return UINotifications.warning(mensaje, duracion);
  }
  
  static mostrarInfo(mensaje, duracion = 5000) {
    return UINotifications.info(mensaje, duracion);
  }
  
  // ========== MÉTODOS PARA FILTROS Y CONTADORES ==========
  
  static actualizarBotonesFiltro(filtroActivo) {
    UICore.updateFilterButtons(filtroActivo);
  }
  
  static actualizarContador(idElemento, contador, prefijo = '', sufijo = '') {
    UICore.updateCounter(idElemento, contador, prefijo, sufijo);
  }
  
  static filtrarVehiculos(filtro) {
    console.log(`🎯 Filtro solicitado: ${filtro}`);
    
    if (window.productosManager && typeof window.productosManager.filtrarVehiculos === 'function') {
      window.productosManager.filtrarVehiculos(filtro);
    } else {
      console.error('❌ productosManager o método filtrarVehiculos no disponible');
    }
  }
  
  // ========== MÉTODOS DE SLIDER ==========
  
  static inicializarSlider(idSlider, imagenes, nombreVehiculo = '', opciones = {}) {
    return UISlider.init(idSlider, imagenes, nombreVehiculo, opciones);
  }
  
  static slideAnterior(idSlider = 'vehicleSlider') {
    UISlider.prevSlide(idSlider);
  }
  
  static slideSiguiente(idSlider = 'vehicleSlider') {
    UISlider.nextSlide(idSlider);
  }
  
  static irASlide(idSlider = 'vehicleSlider', indice) {
    UISlider.goToSlide(idSlider, indice);
  }
  
  static obtenerSlider(idSlider = 'vehicleSlider') {
    return UISlider.getSlider(idSlider);
  }
  
  static actualizarSlider(idSlider, imagenes, nombreVehiculo = '') {
    return UISlider.update(idSlider, imagenes, nombreVehiculo);
  }
  
  // ========== MÉTODOS DE KITS ==========
  
  static seleccionarKit(idKit, idVehiculo) {
    if (window.UIKits && typeof window.UIKits.selectKit === 'function') {
      window.UIKits.selectKit(idKit, idVehiculo);
    }
  }
  
  static contactarConKit(idVehiculo, idKit) {
    if (window.UIKits && typeof window.UIKits.contactWithKit === 'function') {
      window.UIKits.contactWithKit(idVehiculo, idKit);
    }
  }
  
  static contactarConKitSeleccionado(idVehiculo) {
    if (window.UIKits && typeof window.UIKits.contactWithSelectedKit === 'function') {
      window.UIKits.contactWithSelectedKit(idVehiculo);
    }
  }
  
  static obtenerKitSeleccionado() {
    if (window.UIKits && typeof window.UIKits.getSelectedKit === 'function') {
      return window.UIKits.getSelectedKit();
    }
    return null;
  }
  
  // ========== MÉTODOS DE UI CORE ==========
  
  static mostrarCargando(idContenedor, mensaje = 'Cargando...') {
    UICore.showLoading(idContenedor, mensaje);
  }
  
  static ocultarCargando(idContenedor) {
    UICore.hideLoading(idContenedor);
  }
  
  static mostrarModal(idModal) {
    this.modalActivo = idModal;
    UIModals.showModal(idModal);
  }
  
  static cerrarModal(idModal) {
    if (this.modalActivo === idModal) {
      this.modalActivo = null;
    }
    UIModals.closeModal(idModal);
  }
  
  static cerrarTodosModales() {
    this.modalActivo = null;
    UIModals.closeAllModals();
  }
  
  static scrollSuaveA(idElemento, offset = 80) {
    UICore.smoothScrollTo(idElemento, offset);
  }
  
  static limpiarNotificaciones() {
    UINotifications.clearAll();
  }
  
  // ========== MANEJO DE EVENTOS ==========
  
  static agregarListenerEvento(evento, callback, elemento = document) {
    if (!this.listenersEventos.has(evento)) {
      this.listenersEventos.set(evento, []);
    }
    
    elemento.addEventListener(evento, callback);
    this.listenersEventos.get(evento).push({ elemento, callback });
  }
  
  static removerListenerEvento(evento, callback) {
    const listeners = this.listenersEventos.get(evento);
    if (listeners) {
      listeners.forEach(listener => {
        if (listener.callback === callback) {
          listener.elemento.removeEventListener(evento, callback);
        }
      });
      
      this.listenersEventos.set(evento, listeners.filter(l => l.callback !== callback));
    }
  }
  
  static removerTodosListeners() {
    this.listenersEventos.forEach((listeners, evento) => {
      listeners.forEach(listener => {
        listener.elemento.removeEventListener(evento, listener.callback);
      });
    });
    
    this.listenersEventos.clear();
  }
  
  // ========== MÉTODOS DE UTILIDAD ==========
  
  static formatearPrecio(precio) {
    return UICore.formatPrice(precio);
  }
  
  static formatearNumero(numero) {
    return UICore.formatNumber(numero);
  }
  
  static copiarPortapapeles(texto) {
    return UICore.copyToClipboard(texto).then(exito => {
      if (exito) {
        this.mostrarExito('Copiado al portapapeles');
      } else {
        this.mostrarError('Error al copiar');
      }
      return exito;
    });
  }
  
  static emailValido(email) {
    return UICore.isValidEmail(email);
  }
  
  static telefonoValido(telefono) {
    return UICore.isValidPhone(telefono);
  }
  
  // ========== MÉTODOS DE ALMACENAMIENTO ==========
  
  static obtenerAlmacenamiento(clave) {
    return UICore.getLocalStorage(clave);
  }
  
  static establecerAlmacenamiento(clave, valor) {
    UICore.setLocalStorage(clave, valor);
  }
  
  static removerAlmacenamiento(clave) {
    UICore.removeLocalStorage(clave);
  }
  
  static obtenerSesion(clave) {
    return UICore.getSessionStorage(clave);
  }
  
  static establecerSesion(clave, valor) {
    UICore.setSessionStorage(clave, valor);
  }
  
  static removerSesion(clave) {
    UICore.removeSessionStorage(clave);
  }
  
  static obtenerCookie(nombre) {
    return UICore.getCookie(nombre);
  }
  
  static establecerCookie(nombre, valor, dias = 7) {
    UICore.setCookie(nombre, valor, dias);
  }
  
  static eliminarCookie(nombre) {
    UICore.deleteCookie(nombre);
  }
  
  // ========== MÉTODOS DE URL ==========
  
  static obtenerParametrosURL() {
    return UICore.getUrlParams();
  }
  
  static establecerParametrosURL(parametros) {
    UICore.setUrlParams(parametros);
  }
  
  // ========== ANALYTICS Y SEGUIMIENTO ==========
  
  static registrarEvento(nombreEvento, datosEvento = {}) {
    try {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', nombreEvento, datosEvento);
      }
      
      // Facebook Pixel
      if (typeof fbq !== 'undefined') {
        fbq('trackCustom', nombreEvento, datosEvento);
      }
      
      // Console para desarrollo
      console.log(`📊 Evento: ${nombreEvento}`, datosEvento);
      
      // Evento personalizado
      const evento = new CustomEvent(`ui:${nombreEvento}`, { detail: datosEvento });
      document.dispatchEvent(evento);
      
      // Guardar en localStorage para análisis posterior
      const claveAnalytics = 'ui_analytics_events';
      const eventos = this.obtenerAlmacenamiento(claveAnalytics) || [];
      eventos.push({
        event: nombreEvento,
        data: datosEvento,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Mantener solo los últimos 100 eventos
      if (eventos.length > 100) {
        eventos.splice(0, eventos.length - 100);
      }
      
      this.establecerAlmacenamiento(claveAnalytics, eventos);
      
    } catch (error) {
      console.warn('⚠️ Error en registrarEvento:', error);
    }
  }
  
  static registrarVistaPagina(nombrePagina) {
    this.registrarEvento('page_view', { page_name: nombrePagina });
  }
  
  static obtenerEventosAnalytics() {
    return this.obtenerAlmacenamiento('ui_analytics_events') || [];
  }
  
  static limpiarAnalytics() {
    this.removerAlmacenamiento('ui_analytics_events');
  }
  
  // ========== PERFORMANCE ==========
  
  static medirPerformance(nombreMetrica, callback) {
    const tiempoInicio = performance.now();
    const resultado = callback();
    const tiempoFin = performance.now();
    const duracion = tiempoFin - tiempoInicio;
    
    if (duracion > 100) {
      console.warn(`⚠️ Métrica lenta: ${nombreMetrica} tomó ${duracion.toFixed(2)}ms`);
    }
    
    this.registrarEvento('performance_metric', {
      metric_name: nombreMetrica,
      duration_ms: Math.round(duracion)
    });
    
    return resultado;
  }
  
  // ========== MANEJO DE ERRORES ==========
  
  static manejarError(error, contexto = 'unknown') {
    console.error(`❌ Error en ${contexto}:`, error);
    
    // Notificación al usuario
    const mensajeUsuario = error.userMessage || 'Ocurrió un error. Por favor, intenta nuevamente.';
    this.mostrarError(mensajeUsuario);
    
    // Seguimiento de error
    this.registrarEvento('error', {
      contexto,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Lanzar evento global de error
    const eventoError = new CustomEvent('ui:error', { 
      detail: { error, contexto } 
    });
    document.dispatchEvent(eventoError);
  }
  
  // ========== HEALTH CHECK ==========
  
  static verificarSalud() {
    return {
      inicializado: this.inicializado,
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
  
  static depurar() {
    console.group('🔍 UIManager Debug Info');
    console.log('Inicializado:', this.inicializado);
    console.log('Modal Activo:', this.modalActivo);
    console.log('Event Listeners:', this.listenersEventos.size);
    console.log('Health Check:', this.verificarSalud());
    console.groupEnd();
    
    return this.verificarSalud();
  }
  
  static probarTodo() {
    console.group('🧪 UIManager Tests');
    
    // Test notificaciones
    try {
      this.mostrarExito('Test de notificación exitosa', 1000);
      console.log('✅ Notificaciones: OK');
    } catch (e) {
      console.error('❌ Notificaciones: FAILED', e);
    }
    
    // Test productosManager
    try {
      const tienePM = !!window.productosManager;
      console.log(`✅ productosManager: ${tienePM ? 'Available' : 'Not Available'}`);
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
      }).then(exito => {
        if (exito) {
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
