import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
    Alpine.data('p2gDebugModal', () => ({
        show: false,
        content: '',

        init() {
            document.addEventListener('p2g-debug-open', (event) => {
                this.content = event.detail?.content || '';
                this.show = true;
            });
        },

        close() {
            this.show = false;
        }
    }));
});
