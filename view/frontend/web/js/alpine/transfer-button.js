import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
    Alpine.data('p2gTransferButton', (config = {}) => ({
        loading: false,
        debug: !!config.debug,
        hint: config.debug ? 'Debug mode enabled' : '',

        handleClick() {
            console.log('Transfer clicked');
        }
    }));
});