// UI CORE - Funciones básicas de UI y Sistema de Notificaciones
export class UICore {
  // Mostrar/ocultar loading
  static showLoading(containerId = 'vehiclesContainer') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Cargando...</p>
        </div>
      `;
    }
  }
  
  static hideLoading(containerId = 'vehiclesContainer') {
    // Se puede implementar lógica para restaurar contenido anterior
  }
  
  // Mostrar/ocultar modal
  static showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }
  
  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }
  
  // Actualizar contadores
  static updateCounter(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = count;
      element.classList.add('updated');
      setTimeout(() => element.classList.remove('updated'), 300);
    }
  }
  
  // Actualizar filtros
  static updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-button').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.filter === activeFilter) {
        btn.classList.add('active');
      }
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
  }
  
  // Cerrar todos los modales
  static closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  
  // Scroll suave a elemento
  static smoothScrollTo(elementId, offset = 60) {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// UI NOTIFICATIONS - Sistema de notificaciones
export class UINotifications {
  static show(message, type = 'info', duration = 5000) {
    const container = this.getContainer();
    const notification = this.createNotification(message, type);
    
    container.appendChild(notification);
    
    // Auto-eliminar después de la duración especificada
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode === container) {
          container.removeChild(notification);
        }
      }, 300);
    }, duration);
    
    // Permitir cerrar manualmente
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode === container) {
          container.removeChild(notification);
        }
      }, 300);
    });
  }
  
  static createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = this.getIcon(type);
    const color = this.getColor(type);
    
    notification.innerHTML = `
      <i class="fas ${icon}" style="color: ${color};"></i>
      <span>${message}</span>
      <button class="close-notification" style="margin-left: auto; background: none; border: none; color: #86868b; cursor: pointer;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Evento para el botón de cerrar
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
    
    return notification;
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
      `;
      document.body.appendChild(container);
    }
    return container;
  }
  
  static getColor(type) {
    const colors = {
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
      info: '#0066cc'
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
  static success(message, duration = 5000) {
    this.show(message, 'success', duration);
  }
  
  static error(message, duration = 5000) {
    this.show(message, 'error', duration);
  }
  
  static warning(message, duration = 5000) {
    this.show(message, 'warning', duration);
  }
  
  static info(message, duration = 5000) {
    this.show(message, 'info', duration);
  }
  
  // Limpiar todas las notificaciones
  static clearAll() {
    const container = document.getElementById('notificationContainer');
    if (container) {
      container.innerHTML = '';
    }
  }
}
