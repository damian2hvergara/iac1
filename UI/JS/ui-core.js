// UI CORE - Funciones básicas de UI y Sistema de Notificaciones
export class UICore {
  // Mostrar/ocultar loading
  static showLoading(containerId = 'vehiclesContainer', message = 'Cargando...') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>${message}</p>
        </div>
      `;
      container.classList.add('loading-active');
    }
  }
  
  static hideLoading(containerId = 'vehiclesContainer') {
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.remove('loading-active');
      // Se puede implementar lógica para restaurar contenido anterior
    }
  }
  
  // Mostrar/ocultar modal
  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Enfocar el modal para accesibilidad
      modal.setAttribute('aria-hidden', 'false');
      modal.focus();
    }
  }
  
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      modal.setAttribute('aria-hidden', 'true');
    }
  }
  
  // Actualizar contadores con animación
  static updateCounter(elementId, count, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    if (element) {
      const currentCount = parseInt(element.textContent) || 0;
      element.textContent = `${prefix}${count}${suffix}`;
      
      // Animación
      element.classList.add('counter-updated');
      setTimeout(() => element.classList.remove('counter-updated'), 300);
      
      // Contador animado si la diferencia es grande
      if (Math.abs(count - currentCount) > 10) {
        this.animateCounter(element, currentCount, count, 500);
      }
    }
  }
  
  static animateCounter(element, start, end, duration) {
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      element.textContent = current;
      
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  }
  
  // Actualizar filtros
  static updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-button').forEach(btn => {
      const isActive = btn.dataset.filter === activeFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
  }
  
  // Configurar eventos básicos
  static setupEventListeners() {
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
    
    // Cerrar modales al hacer click fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });
    
    // Botones de cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
      button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) {
          UICore.closeModal(modal.id);
        }
      });
    });
    
    // Menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('active'));
      });
      
      // Cerrar menú al hacer clic en un enlace
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });
    
    // Back to top button
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTop.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(backToTop);
    
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
  }
  
  // Cerrar todos los modales
  static closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  
  // Scroll suave a elemento
  static smoothScrollTo(elementId, offset = 80) {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Enfocar el elemento para accesibilidad
      element.setAttribute('tabindex', '-1');
      element.focus();
      setTimeout(() => element.removeAttribute('tabindex'), 1000);
    }
  }
  
  // Detectar si es dispositivo móvil
  static isMobile() {
    return window.innerWidth <= 768;
  }
  
  // Detectar si es tablet
  static isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }
  
  // Detectar si es desktop
  static isDesktop() {
    return window.innerWidth > 1024;
  }
  
  // Obtener breakpoint actual
  static getBreakpoint() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }
  
  // Formatear precio
  static formatPrice(price) {
    if (!price && price !== 0) return 'Consultar';
    const num = parseInt(price);
    if (isNaN(num) || num === 0) return 'Consultar';
    return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  // Formatear número con separadores
  static formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  // Copiar al portapapeles
  static copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(() => {
      return true;
    }).catch(() => {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch (err) {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }
  
  // Validar email
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  // Validar teléfono
  static isValidPhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)\.]/g, ''));
  }
  
  // Debound function para eventos
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Throttle function para eventos
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // Detectar conexión
  static isOnline() {
    return navigator.onLine;
  }
  
  // Mostrar/ocultar elemento
  static toggleElement(elementId, show = true) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
      element.setAttribute('aria-hidden', !show);
    }
  }
  
  // Añadir/remover clase
  static toggleClass(elementId, className, add = true) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.toggle(className, add);
    }
  }
  
  // Establecer atributo
  static setAttribute(elementId, attribute, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute(attribute, value);
    }
  }
  
  // Obtener atributo
  static getAttribute(elementId, attribute) {
    const element = document.getElementById(elementId);
    return element ? element.getAttribute(attribute) : null;
  }
  
  // Crear elemento
  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'style') {
        Object.assign(element.style, attributes[key]);
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else {
        element.appendChild(content);
      }
    }
    
    return element;
  }
  
  // Eliminar elemento
  static removeElement(elementId) {
    const element = document.getElementById(elementId);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  
  // Vaciar elemento
  static emptyElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
    }
  }
  
  // Insertar después de
  static insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }
  
  // Prepend elemento
  static prependElement(parentId, element) {
    const parent = document.getElementById(parentId);
    if (parent) {
      parent.insertBefore(element, parent.firstChild);
    }
  }
  
  // Append elemento
  static appendElement(parentId, element) {
    const parent = document.getElementById(parentId);
    if (parent) {
      parent.appendChild(element);
    }
  }
  
  // Obtener parámetros URL
  static getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
    
    return params;
  }
  
  // Establecer parámetros URL
  static setUrlParams(params) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  }
  
  // Obtener cookie
  static getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  // Establecer cookie
  static setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }
  
  // Eliminar cookie
  static deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  
  // Almacenamiento local
  static getLocalStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return localStorage.getItem(key);
    }
  }
  
  static setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      localStorage.setItem(key, value);
    }
  }
  
  static removeLocalStorage(key) {
    localStorage.removeItem(key);
  }
  
  // Almacenamiento de sesión
  static getSessionStorage(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch {
      return sessionStorage.getItem(key);
    }
  }
  
  static setSessionStorage(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      sessionStorage.setItem(key, value);
    }
  }
  
  static removeSessionStorage(key) {
    sessionStorage.removeItem(key);
  }
  
  // Detectar preferencias del usuario
  static getUserPreferences() {
    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      prefersReducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      touchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  }
  
  // Aplicar preferencias del usuario
  static applyUserPreferences() {
    const prefs = this.getUserPreferences();
    
    if (prefs.prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
    
    if (prefs.prefersDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
    
    if (prefs.prefersHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    
    if (prefs.touchDevice) {
      document.documentElement.classList.add('touch-device');
    }
  }
}

// UI NOTIFICATIONS - Sistema de notificaciones mejorado
export class UINotifications {
  static show(message, type = 'info', duration = 5000, title = null) {
    const container = this.getContainer();
    const notification = this.createNotification(message, type, title);
    
    // Asignar ID único
    const notificationId = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    notification.id = notificationId;
    
    container.appendChild(notification);
    
    // Auto-eliminar después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notificationId);
      }, duration);
    }
    
    // Permitir cerrar manualmente
    notification.addEventListener('click', (e) => {
      if (!e.target.closest('.close-notification')) {
        // Si no es el botón de cerrar, ignorar
        return;
      }
      this.removeNotification(notificationId);
    });
    
    // Evento para teclado
    notification.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        this.removeNotification(notificationId);
      }
    });
    
    // Enfocar la notificación para accesibilidad
    notification.setAttribute('tabindex', '-1');
    notification.focus();
    
    return notificationId;
  }
  
  static createNotification(message, type, title = null) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    const icon = this.getIcon(type);
    const color = this.getColor(type);
    
    notification.innerHTML = `
      <div class="notification-icon" style="color: ${color};">
        <i class="fas ${icon}"></i>
      </div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        <div class="notification-message">${message}</div>
      </div>
      <button class="close-notification" aria-label="Cerrar notificación">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    return notification;
  }
  
  static removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }
  
  static getContainer() {
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }
  
  static getColor(type) {
    const colors = {
      success: 'var(--success)',
      error: 'var(--error)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };
    return colors[type] || colors.info;
  }
  
  static getIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }
  
  // Métodos de conveniencia
  static success(message, duration = 5000, title = 'Éxito') {
    return this.show(message, 'success', duration, title);
  }
  
  static error(message, duration = 5000, title = 'Error') {
    return this.show(message, 'error', duration, title);
  }
  
  static warning(message, duration = 5000, title = 'Advertencia') {
    return this.show(message, 'warning', duration, title);
  }
  
  static info(message, duration = 5000, title = 'Información') {
    return this.show(message, 'info', duration, title);
  }
  
  // Limpiar todas las notificaciones
  static clearAll() {
    const container = document.getElementById('notificationContainer');
    if (container) {
      container.innerHTML = '';
    }
  }
  
  // Obtener cantidad de notificaciones activas
  static getCount() {
    const container = document.getElementById('notificationContainer');
    return container ? container.children.length : 0;
  }
  
  // Pausar auto-eliminación
  static pauseAutoRemove(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      notification.dataset.autoRemove = 'false';
    }
  }
  
  // Reanudar auto-eliminación
  static resumeAutoRemove(notificationId, duration = 5000) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      notification.dataset.autoRemove = 'true';
      setTimeout(() => {
        if (notification.dataset.autoRemove === 'true') {
          this.removeNotification(notificationId);
        }
      }, duration);
    }
  }
  
  // Actualizar notificación existente
  static update(notificationId, message, type = null, title = null) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      if (message) {
        const messageEl = notification.querySelector('.notification-message');
        if (messageEl) messageEl.textContent = message;
      }
      
      if (type) {
        notification.className = `notification ${type}`;
        const iconEl = notification.querySelector('.notification-icon i');
        if (iconEl) {
          iconEl.className = `fas ${this.getIcon(type)}`;
          iconEl.style.color = this.getColor(type);
        }
      }
      
      if (title) {
        let titleEl = notification.querySelector('.notification-title');
        if (titleEl) {
          titleEl.textContent = title;
        } else {
          titleEl = document.createElement('div');
          titleEl.className = 'notification-title';
          titleEl.textContent = title;
          const contentEl = notification.querySelector('.notification-content');
          if (contentEl) {
            contentEl.insertBefore(titleEl, contentEl.firstChild);
          }
        }
      }
      
      // Enfocar de nuevo para accesibilidad
      notification.focus();
    }
  }
}
