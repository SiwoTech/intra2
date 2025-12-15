/**
 * Script para hacer las tablas completamente responsivas
 * Incluye funcionalidad para alternar entre vista de tabla y vista de tarjetas en móviles
 */

class ResponsiveTable {
    constructor(tableSelector) {
        this.table = document.querySelector(tableSelector);
        this.isMobile = window.innerWidth <= 768;
        this.isCardView = false;
        
        if (this.table) {
            this.init();
        }
    }
    
    init() {
        this.createToggleButton();
        this.addDataLabels();
        this.handleResize();
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    createToggleButton() {
        // Solo crear el botón en móviles
        if (window.innerWidth <= 768) {
            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'table-view-toggle';
            toggleContainer.innerHTML = `
                <button class="table-view-btn ${!this.isCardView ? 'active' : ''}" data-view="table">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                    </svg>
                    Tabla
                </button>
                <button class="table-view-btn ${this.isCardView ? 'active' : ''}" data-view="cards">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                    </svg>
                    Tarjetas
                </button>
            `;
            
            // Insertar antes de la tabla
            this.table.parentNode.insertBefore(toggleContainer, this.table);
            
            // Agregar event listeners
            toggleContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('table-view-btn') || e.target.closest('.table-view-btn')) {
                    const btn = e.target.closest('.table-view-btn');
                    const view = btn.dataset.view;
                    this.toggleView(view);
                }
            });
        }
    }
    
    addDataLabels() {
        // Agregar data-label a cada celda para la vista de tarjetas
        const headers = this.table.querySelectorAll('th');
        const headerTexts = Array.from(headers).map(th => th.textContent.trim());
        
        const rows = this.table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headerTexts[index]) {
                    cell.setAttribute('data-label', headerTexts[index]);
                }
            });
        });
    }
    
    toggleView(viewType) {
        const buttons = document.querySelectorAll('.table-view-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const activeButton = document.querySelector(`[data-view="${viewType}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        if (viewType === 'cards') {
            this.isCardView = true;
            this.table.classList.add('mobile-card-view');
        } else {
            this.isCardView = false;
            this.table.classList.remove('mobile-card-view');
        }
        
        // Guardar preferencia del usuario
        localStorage.setItem('tableViewPreference', viewType);
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // Si cambió de móvil a desktop o viceversa
        if (wasMobile !== this.isMobile) {
            const toggleContainer = document.querySelector('.table-view-toggle');
            
            if (this.isMobile && !toggleContainer) {
                this.createToggleButton();
                // Restaurar preferencia guardada
                const savedPreference = localStorage.getItem('tableViewPreference');
                if (savedPreference) {
                    this.toggleView(savedPreference);
                }
            } else if (!this.isMobile && toggleContainer) {
                toggleContainer.remove();
                this.table.classList.remove('mobile-card-view');
            }
        }
    }
    
    // Método para truncar texto largo en móviles
    static truncateText(text, maxLength = 30) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Método para formatear números para móviles
    static formatNumber(num) {
        if (typeof num !== 'number') return num;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(num);
    }
    
    // Método para formatear fechas para móviles
    static formatDate(dateString) {
        if (!dateString || dateString === '0000-00-00') return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }
}

// Funciones utilitarias adicionales para responsividad
class ResponsiveUtils {
    
    // Detectar si es dispositivo táctil
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    // Obtener el tamaño de ventana actual
    static getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    // Verificar si está en modo landscape en móvil
    static isMobileLandscape() {
        return window.innerWidth <= 1024 && 
               window.innerWidth > window.innerHeight;
    }
    
    // Ajustar automáticamente el font-size del root para mejor escalado
    static adjustRootFontSize() {
        const viewportWidth = window.innerWidth;
        let fontSize = 16; // Default
        
        if (viewportWidth < 375) {
            fontSize = 14;
        } else if (viewportWidth < 414) {
            fontSize = 15;
        } else if (viewportWidth > 1920) {
            fontSize = 18;
        }
        
        document.documentElement.style.fontSize = fontSize + 'px';
    }
    
    // Optimizar imágenes para dispositivos móviles
    static optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (window.innerWidth <= 768) {
                img.loading = 'lazy';
                // Agregar clase para optimización CSS
                img.classList.add('mobile-optimized');
            }
        });
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tabla responsiva
    const franchiseTable = new ResponsiveTable('.franchiseTable');
    
    // Aplicar utilidades responsivas
    ResponsiveUtils.adjustRootFontSize();
    ResponsiveUtils.optimizeImages();
    
    // Escuchar cambios de orientación
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            ResponsiveUtils.adjustRootFontSize();
        }, 100);
    });
    
    // Agregar clases utilitarias dinámicamente
    function addResponsiveClasses() {
        const viewport = ResponsiveUtils.getViewportSize();
        const body = document.body;
        
        // Limpiar clases anteriores
        body.classList.remove('mobile', 'tablet', 'desktop', 'touch-device');
        
        // Agregar clases según el tamaño
        if (viewport.width <= 768) {
            body.classList.add('mobile');
        } else if (viewport.width <= 1024) {
            body.classList.add('tablet');
        } else {
            body.classList.add('desktop');
        }
        
        // Agregar clase para dispositivos táctiles
        if (ResponsiveUtils.isTouchDevice()) {
            body.classList.add('touch-device');
        }
    }
    
    // Ejecutar al cargar y al cambiar tamaño
    addResponsiveClasses();
    window.addEventListener('resize', addResponsiveClasses);
});

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResponsiveTable, ResponsiveUtils };
}
