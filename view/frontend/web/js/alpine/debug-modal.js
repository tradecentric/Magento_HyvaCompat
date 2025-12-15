import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
    Alpine.data('p2gDebugModal', () => ({
        show: false,
        content: '',

        open(content = '') {
            this.content = content;
            this.show = true;
        },

        close() {
            this.show = false;
        }
    }));
});