import { CONFIG } from './config.js';

// Bottom Navigation para móviles - Sistema completo
export class MobileNavigation {
  constructor() {
    this.navElement = null;
    this.activeItem = 'home';
    this.isVisible = false;
    this.scrollThreshold = 100;
    this.lastScrollTop = 0;
    this.navHeight = 60;
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.isDragging = false;
    this.animationFrame = null;
  }
  
  // Inicializar navegación móvil
  init() {
    if (!this.shouldShowMobileNav()) {
      this.removeNavIfExists();
      return;
    }
    
    console.log('📱 Inicializando Mobile Navigation...');
    
    try {
      this.createNavElement();
      this.appendToDOM();
      this.setupEventListeners();
      this.updateActiveItem();
      this.setupTouchGestures();
      this.setupResizeHandler();
      this.setupKeyboardNavigation();
      
      // Inicializar estado basado en scroll
      this.handleScroll();
      
      console.log('✅ Mobile Navigation inicializada');
      
    } catch (error) {
      console.error('❌ Error inicializando Mobile Navigation:', error);
    }
  }
  
  // Verificar si debe mostrarse (solo en móviles)
  shouldShowMobileNav() {
    // Solo mostrar en dispositivos móviles
    const isMobile = window.innerWidth <= 768;
    
    // También verificar user agent para mayor precisión
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;
    
    return isMobile && isTouchDevice;
  }
  
  // Crear elemento de navegación con diseño premium
  createNavElement() {
    this.navElement = document.createElement('nav');
    this.navElement.className = 'mobile-bottom-nav';
    this.navElement.id = 'mobileBottomNav';
    this.navElement.setAttribute('aria-label', 'Navegación principal móvil');
    this.navElement.setAttribute('role', 'navigation');
    
    // Crear estructura interna
    const navContainer = document.createElement('div');
    navContainer.className = 'mobile-nav-container';
    
    // Generar items de navegación desde CONFIG
    navContainer.innerHTML = CONFIG.mobileNav.items.map((item, index) => {
      const isActive = item.section === this.activeItem;
      const ariaCurrent = isActive ? 'page' : 'false';
      
      return `
        <button class="mobile-nav-item ${isActive ? 'active' : ''}" 
                data-section="${item.section}"
                data-index="${index}"
                aria-label="${item.label}"
                aria-current="${ariaCurrent}"
                role="menuitem">
          <div class="nav-icon" aria-hidden="true">
            <i class="fas ${item.icon}"></i>
          </div>
          <div class="nav-label">${item.label}</div>
          ${isActive ? '<div class="active-indicator"></div>' : ''}
        </button>
      `;
    }).join('');
    
    // Agregar indicador visual de swipe
    const swipeIndicator = document.createElement('div');
    swipeIndicator.className = 'swipe-indicator';
    swipeIndicator.innerHTML = '<i class="fas fa-chevron-up"></i>';
    swipeIndicator.setAttribute('aria-hidden', 'true');
    
    this.navElement.appendChild(swipeIndicator);
    this.navElement.appendChild(navContainer);
  }
  
  // Agregar al DOM con optimizaciones
  appendToDOM() {
    // Remover navegación existente si hay
    this.removeNavIfExists();
    
    // Agregar al final del body
    document.body.appendChild(this.navElement);
    
    // Calcular altura exacta para padding
    this.navHeight = this.navElement.offsetHeight;
    
    // Aplicar padding al body para no cubrir contenido
    this.updateBodyPadding();
    
    // Agregar clase al body para estilos específicos
    document.body.classList.add('has-mobile-nav');
    
    // Forzar reflow para animación suave
    this.navElement.offsetHeight;
    
    // Mostrar con animación
    setTimeout(() => {
      this.navElement.classList.add('visible');
    }, 100);
  }
  
  // Remover navegación si existe
  removeNavIfExists() {
    const existingNav = document.getElementById('mobileBottomNav');
    if (existingNav) {
      existingNav.remove();
      document.body.classList.remove('has-mobile-nav');
      document.body.style.paddingBottom = '';
    }
  }
  
  // Actualizar padding del body
  updateBodyPadding() {
    const currentPadding = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
    const targetPadding = this.navHeight + currentPadding;
    
    // Usar requestAnimationFrame para animación suave
    const animatePadding = (start, end, duration = 300) => {
      const startTime = performance.now();
      
      const updatePadding = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para animación suave
        const easeProgress = this.easeOutCubic(progress);
        const currentPadding = start + (end - start) * easeProgress;
        
        document.body.style.paddingBottom = `${currentPadding}px`;
        
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(updatePadding);
        }
      };
      
      this.animationFrame = requestAnimationFrame(updatePadding);
    };
    
    animatePadding(currentPadding, targetPadding);
  }
  
  // Easing function para animaciones suaves
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  // Configurar event listeners completos
  setupEventListeners() {
    // Navegación por items
    this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavClick(e));
      item.addEventListener('keydown', (e) => this.handleNavKeydown(e));
      item.addEventListener('touchstart', (e) => this.handleNavTouchStart(e), { passive: true });
      item.addEventListener('touchend', (e) => this.handleNavTouchEnd(e), { passive: true });
    });
    
    // Scroll para mostrar/ocultar
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    
    // Resize para responsividad
    window.addEventListener('resize', () => this.handleResize());
    
    // Click fuera para cerrar efectos (si los hay)
    document.addEventListener('click', (e) => this.handleOutsideClick(e));
    
    // Gestos táctiles para navegación
    this.setupSwipeGestures();
    
    // Focus trap para accesibilidad
    this.setupFocusTrap();
  }
  
  // Configurar gestos de swipe
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;
    
    this.navElement.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    this.navElement.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX, swipeThreshold);
    }, { passive: true });
  }
  
  // Configurar gestos táctiles para items
  setupTouchGestures() {
    this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('touchstart', (e) => {
        item.classList.add('touch-active');
        this.provideHapticFeedback();
      }, { passive: true });
      
      item.addEventListener('touchend', () => {
        setTimeout(() => {
          item.classList.remove('touch-active');
        }, 150);
      }, { passive: true });
      
      item.addEventListener('touchcancel', () => {
        item.classList.remove('touch-active');
      }, { passive: true });
    });
  }
  
  // Configurar handler de resize
  setupResizeHandler() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }
  
  // Configurar navegación por teclado
  setupKeyboardNavigation() {
    this.navElement.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowRight':
          e.preventDefault();
          this.navigateNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.navigatePrev();
          break;
        case 'Home':
          e.preventDefault();
          this.navigateToIndex(0);
          break;
        case 'End':
          e.preventDefault();
          this.navigateToIndex(CONFIG.mobileNav.items.length - 1);
          break;
        case 'Enter':
        case ' ':
          // El click handler ya maneja esto
          break;
      }
    });
  }
  
  // Configurar focus trap para accesibilidad
  setupFocusTrap() {
    const navItems = this.navElement.querySelectorAll('.mobile-nav-item');
    const firstItem = navItems[0];
    const lastItem = navItems[navItems.length - 1];
    
    firstItem.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        lastItem.focus();
      }
    });
    
    lastItem.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        firstItem.focus();
      }
    });
  }
  
  // ===== HANDLERS PRINCIPALES =====
  
  // Manejar click en item de navegación
  handleNavClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const item = e.currentTarget;
    const section = item.dataset.section;
    const index = parseInt(item.dataset.index);
    
    // Feedback visual
    this.animateNavClick(item);
    
    // Navegar a sección
    this.navigateToSection(section);
    
    // Actualizar item activo
    this.setActiveItem(section, index);
    
    // Feedback háptico
    this.provideHapticFeedback();
    
    // Track event
    this.trackNavigation(section, 'click');
  }
  
  // Manejar keydown en item
  handleNavKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleNavClick(e);
    }
  }
  
  // Manejar touch start
  handleNavTouchStart(e) {
    const item = e.currentTarget;
    this.touchStartY = e.touches[0].clientY;
    item.classList.add('touch-active');
  }
  
  // Manejar touch end
  handleNavTouchEnd(e) {
    const item = e.currentTarget;
    this.touchEndY = e.changedTouches[0].clientY;
    
    // Si es un tap (no swipe), simular click
    if (Math.abs(this.touchEndY - this.touchStartY) < 10) {
      this.handleNavClick(e);
    }
    
    setTimeout(() => {
      item.classList.remove('touch-active');
    }, 150);
  }
  
  // Manejar swipe horizontal
  handleSwipe(startX, endX, threshold) {
    const diffX = endX - startX;
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe derecha → anterior
        this.navigatePrev();
      } else {
        // Swipe izquierda → siguiente
        this.navigateNext();
      }
      
      this.provideHapticFeedback();
      this.trackNavigation(this.activeItem, 'swipe');
    }
  }
  
  // Manejar scroll para mostrar/ocultar
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDelta = scrollTop - this.lastScrollTop;
    
    // Determinar dirección del scroll
    if (scrollTop > this.lastScrollTop && scrollTop > this.scrollThreshold) {
      // Scroll down - ocultar
      if (this.isVisible) {
        this.hideNav();
      }
    } else {
      // Scroll up - mostrar
      if (!this.isVisible && scrollTop > 50) {
        this.showNav();
      }
    }
    
    // Actualizar item activo basado en posición
    if (Math.abs(scrollDelta) > 5) {
      this.updateActiveItemOnScroll();
    }
    
    this.lastScrollTop = scrollTop;
  }
  
  // Manejar resize de ventana
  handleResize() {
    if (this.shouldShowMobileNav()) {
      if (!document.getElementById('mobileBottomNav')) {
        this.init();
      } else {
        // Actualizar altura y padding
        this.navHeight = this.navElement.offsetHeight;
        this.updateBodyPadding();
      }
    } else {
      this.destroy();
    }
  }
  
  // Manejar click fuera de la navegación
  handleOutsideClick(e) {
    if (!this.navElement.contains(e.target)) {
      // Cerrar cualquier submenú o efecto activo
      this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('touch-active', 'expanded');
      });
    }
  }
  
  // ===== FUNCIONES DE NAVEGACIÓN =====
  
  // Navegar a sección específica
  navigateToSection(section) {
    const targetElement = document.getElementById(section);
    if (!targetElement) {
      console.warn(`Sección ${section} no encontrada`);
      return;
    }
    
    // Smooth scroll con offset para la navegación móvil
    const offset = this.navHeight + 20;
    const targetPosition = targetElement.offsetTop - offset;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    // Cerrar menú móvil si está abierto
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    // Actualizar URL sin recargar
    history.pushState(null, '', `#${section}`);
  }
  
  // Navegar al siguiente item
  navigateNext() {
    const currentIndex = CONFIG.mobileNav.items.findIndex(item => item.section === this.activeItem);
    const nextIndex = (currentIndex + 1) % CONFIG.mobileNav.items.length;
    const nextSection = CONFIG.mobileNav.items[nextIndex].section;
    
    this.navigateToSection(nextSection);
    this.setActiveItem(nextSection, nextIndex);
  }
  
  // Navegar al item anterior
  navigatePrev() {
    const currentIndex = CONFIG.mobileNav.items.findIndex(item => item.section === this.activeItem);
    const prevIndex = currentIndex === 0 ? CONFIG.mobileNav.items.length - 1 : currentIndex - 1;
    const prevSection = CONFIG.mobileNav.items[prevIndex].section;
    
    this.navigateToSection(prevSection);
    this.setActiveItem(prevSection, prevIndex);
  }
  
  // Navegar a índice específico
  navigateToIndex(index) {
    if (index >= 0 && index < CONFIG.mobileNav.items.length) {
      const section = CONFIG.mobileNav.items[index].section;
      this.navigateToSection(section);
      this.setActiveItem(section, index);
    }
  }
  
  // ===== FUNCIONES DE ESTADO =====
  
  // Establecer item activo
  setActiveItem(section, index = null) {
    if (this.activeItem === section) return;
    
    // Remover active de todos los items
    this.navElement.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-current', 'false');
      item.querySelector('.active-indicator')?.remove();
    });
    
    // Encontrar y activar el item correcto
    let targetItem;
    if (index !== null) {
      targetItem = this.navElement.querySelector(`.mobile-nav-item[data-index="${index}"]`);
    } else {
      targetItem = this.navElement.querySelector(`.mobile-nav-item[data-section="${section}"]`);
    }
    
    if (targetItem) {
      targetItem.classList.add('active');
      targetItem.setAttribute('aria-current', 'page');
      
      // Agregar indicador visual
      const indicator = document.createElement('div');
      indicator.className = 'active-indicator';
      targetItem.appendChild(indicator);
      
      // Animar indicador
      setTimeout(() => {
        indicator.classList.add('visible');
      }, 10);
      
      this.activeItem = section;
      
      // Track event
      this.trackNavigation(section, 'programmatic');
    }
  }
  
  // Actualizar item activo basado en scroll
  updateActiveItemOnScroll() {
    if (!this.shouldShowMobileNav()) return;
    
    const sections = CONFIG.mobileNav.items.map(item => ({
      id: item.section,
      element: document.getElementById(item.section)
    })).filter(s => s.element);
    
    const scrollPosition = window.scrollY + this.navHeight + 100;
    
    // Encontrar sección activa
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const rect = section.element.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY;
      
      if (scrollPosition >= offsetTop) {
        if (this.activeItem !== section.id) {
          this.setActiveItem(section.id);
        }
        break;
      }
    }
  }
  
  // Forzar actualización de item activo
  updateActiveItem() {
    this.updateActiveItemOnScroll();
  }
  
  // ===== ANIMACIONES Y EFECTOS =====
  
  // Mostrar navegación con animación
  showNav() {
    if (this.navElement && !this.isVisible) {
      this.navElement.classList.remove('hidden');
      this.navElement.classList.add('visible');
      this.isVisible = true;
      
      // Animar entrada
      this.animateNavShow();
    }
  }
  
  // Ocultar navegación con animación
  hideNav() {
    if (this.navElement && this.isVisible) {
      this.navElement.classList.add('hidden');
      this.navElement.classList.remove('visible');
      this.isVisible = false;
    }
  }
  
  // Animar click en item
  animateNavClick(item) {
    item.classList.add('click-animation');
    
    // Crear efecto de ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = item.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = 0;
    const y = 0;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    item.appendChild(ripple);
    
    // Remover después de animación
    setTimeout(() => {
      ripple.remove();
      item.classList.remove('click-animation');
    }, 600);
  }
  
  // Animar entrada de navegación
  animateNavShow() {
    const items = this.navElement.querySelectorAll('.mobile-nav-item');
    
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }
  
  // Proporcionar feedback háptico
  provideHapticFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    } else if (window.HapticFeedback) {
      // Para algunos dispositivos Android
      window.HapticFeedback.vibrate(50);
    }
  }
  
  // ===== TRACKING Y ANALYTICS =====
  
  // Trackear navegación
  trackNavigation(section, method) {
    if (window.supabaseService && CONFIG.app.trackEvents) {
      window.supabaseService.trackEvent('mobile_nav_interaction', {
        section,
        method,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight
      });
    }
    
    // También para Google Analytics si está configurado
    if (window.gtag && CONFIG.app.ga4Id) {
      gtag('event', 'mobile_navigation', {
        'event_category': 'Navigation',
        'event_label': section,
        'interaction_type': method
      });
    }
  }
  
  // ===== DESTRUCCIÓN Y LIMPIEZA =====
  
  // Destruir navegación
  destroy() {
    // Cancelar animation frame si existe
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Remover event listeners
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remover elemento del DOM
    this.removeNavIfExists();
    
    // Limpiar variables
    this.navElement = null;
    this.activeItem = 'home';
    this.isVisible = false;
    
    console.log('🗑️ Mobile Navigation destruida');
  }
  
  // ===== FUNCIONES PÚBLICAS =====
  
  // Refrescar navegación (para cambios dinámicos)
  refresh() {
    this.destroy();
    setTimeout(() => this.init(), 100);
  }
  
  // Mostrar notificación en la navegación
  showNotification(badgeText, section = null) {
    let targetItem;
    
    if (section) {
      targetItem = this.navElement.querySelector(`.mobile-nav-item[data-section="${section}"]`);
    } else {
      // Encontrar item activo
      targetItem = this.navElement.querySelector('.mobile-nav-item.active');
    }
    
    if (targetItem) {
      // Remover badge existente
      const existingBadge = targetItem.querySelector('.nav-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      // Crear nuevo badge
      const badge = document.createElement('div');
      badge.className = 'nav-badge';
      badge.textContent = badgeText;
      badge.setAttribute('aria-label', `${badgeText} notificaciones`);
      
      targetItem.appendChild(badge);
      
      // Animar entrada
      setTimeout(() => {
        badge.classList.add('visible');
      }, 10);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        badge.classList.remove('visible');
        setTimeout(() => {
          if (badge.parentNode) {
            badge.remove();
          }
        }, 300);
      }, 5000);
    }
  }
  
  // Obtener estado actual
  getState() {
    return {
      activeItem: this.activeItem,
      isVisible: this.isVisible,
      navHeight: this.navHeight,
      itemCount: CONFIG.mobileNav.items.length
    };
  }
}

// Instancia global
export const mobileNavigation = new MobileNavigation();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurar que todo esté cargado
  setTimeout(() => {
    mobileNavigation.init();
  }, 300);
});

// Re-inicializar en resize con debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    mobileNavigation.init();
  }, 500);
});

// Re-inicializar cuando cambia la orientación
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    mobileNavigation.init();
  }, 300);
});

// Hacer accesible globalmente
window.mobileNavigation = mobileNavigation;

// Hotkey para desarrollo (Alt+M para toggle)
if (process.env.NODE_ENV === 'development') {
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      const nav = document.getElementById('mobileBottomNav');
      if (nav) {
        if (nav.classList.contains('hidden')) {
          mobileNavigation.showNav();
        } else {
          mobileNavigation.hideNav();
        }
      }
    }
    
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      mobileNavigation.showNotification('3', 'vehicles');
    }
  });
}