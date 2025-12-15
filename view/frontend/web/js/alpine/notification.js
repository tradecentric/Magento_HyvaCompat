import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
    Alpine.data('p2gNotifications', () => ({
        messages: [],

        add(message, type = 'info') {
            this.messages.push({ message, type });
        },

        remove(index) {
            this.messages.splice(index, 1);
        }
    }));
});