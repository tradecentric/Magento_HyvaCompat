import Alpine from 'alpinejs';

export function p2gDebugModal() {
    return {
        show: false,
        content: '',
        callback: null,

        open(callback) {
            this.callback = callback || null;
            this.content = '<div id="logwindow" class="punchout-debug-window"></div>';
            this.show = true;
        },

        close() {
            this.show = false;
            if (typeof this.callback === 'function') {
                this.callback();
            }
            this.callback = null;
        },

        transfer() {
            if (typeof this.callback === 'function') {
                this.callback();
            }
            this.close();
        }
    };
}

// Helper function to open modal from non-Alpine code
export function openDebugModal(callback) {
    const el = document.querySelector('[x-data="p2gDebugModal()"]');
    if (!el || !el.__x) {
        console.warn('Debug modal Alpine component not initialized');
        return;
    }
    el.__x.$data.open(callback);
}
