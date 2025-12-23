// ui-manager.js - ORQUESTADOR PRINCIPAL DE UI
import { UICore, UINotifications } from './ui-core.js';
import { UIModals, UIKits, UISlider } from './ui-components.js';

export class UIManager {
  static init() {
    console.log('🎭 Inicializando UIManager...');
    
    try {
      // Configurar eventos básicos
      UICore.setupEventListeners();
      UIModals.setupModalEvents();
      
      // Hacer disponibles globalmente
      window.UIManager = this;
      window.UICore = UICore;
      window.UIModals = UIModals;
      window.UIKits = UIKits;
      window.UISlider = UISlider;
      window.UINotifications = UINotifications;
      
      console.log('✅ UIManager listo');
      return true;
      
    } catch (error) {
      console.error('❌ Error inicializando UIManager:', error);
      return false;
    }
  }
  
  // ========== MÉTODOS PÚBLICOS ==========
  
  // Para vehiculos-manager.js y productos.js
  static mostrarDetallesVehiculo(vehicleId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      this.showError('Vehículo no encontrado');
      return;
    }
    
    UIModals.showVehicleDetails(vehicleId);
  }
  
  // Notificaciones
  static showNotification(mensaje, tipo = 'info', duration = 5000) {
    UINotifications.show(mensaje, tipo, duration);
  }
  
  static showError(mensaje) {
    UINotifications.error(mensaje);
  }
  
  static showSuccess(mensaje) {
    UINotifications.success(mensaje);
  }
  
  static showWarning(mensaje) {
    UINotifications.warning(mensaje);
  }
  
  static showInfo(mensaje) {
    UINotifications.info(mensaje);
  }
  
  // Para productos.js (filtros)
  static updateFilterButtons(activeFilter) {
    UICore.updateFilterButtons(activeFilter);
  }
  
  static updateCounter(elementId, count) {
    UICore.updateCounter(elementId, count);
  }
  
  // Para botones en HTML
  static customizeVehicle(vehicleId) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      this.showError('Vehículo no encontrado');
      return;
    }
    
    UIKits.showKitsModal(vehicleId);
  }
  
  static contactVehicle(vehicleId, kitId = null) {
    const vehiculo = window.productosManager?.getVehiculoById(vehicleId);
    if (!vehiculo) {
      this.showError('Vehículo no encontrado');
      return;
    }
    
    const kits = window.productosManager?.getKitsForDisplay() || [];
    const kit = kitId ? kits.find(k => k.id === kitId) : null;
    
    if (window.productosManager?.getWhatsAppUrl) {
      const url = window.productosManager.getWhatsAppUrl(vehiculo, kit);
      window.open(url, '_blank');
    }
  }
  
  // Slider methods
  static initSlider(sliderId, images, vehicleName = '') {
    UISlider.init(sliderId, images, vehicleName);
  }
  
  static prevSlide() {
    UIModals.prevSlide();
  }
  
  static nextSlide() {
    UIModals.nextSlide();
  }
  
  static goToSlide(index) {
    UIModals.goToSlide(index);
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
  
  // UI Core methods
  static showLoading(containerId) {
    UICore.showLoading(containerId);
  }
  
  static hideLoading(containerId) {
    UICore.hideLoading(containerId);
  }
  
  static showModal(modalId) {
    UICore.showModal(modalId);
  }
  
  static closeModal(modalId) {
    UICore.closeModal(modalId);
  }
  
  static closeAllModals() {
    UICore.closeAllModals();
  }
  
  static smoothScrollTo(elementId, offset = 60) {
    UICore.smoothScrollTo(elementId, offset);
  }
  
  // Clear notifications
  static clearNotifications() {
    UINotifications.clearAll();
  }
}
