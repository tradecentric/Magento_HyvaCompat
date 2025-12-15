import Alpine from 'alpinejs';
import { transferCart } from '../punchout-transfer';

document.addEventListener('alpine:init', () => {
    Alpine.data('p2gTransferButton', (config = {}) => ({
        loading: false,
        debug: !!config.debug,
        hint: config.debug ? 'Debug mode enabled' : '',

        async handleClick() {
            if (this.loading) {
                return;
            }

            if (this.debug) {
                document.dispatchEvent(
                    new CustomEvent('p2g-debug-open', {
                        detail: {
                            content: '<pre>Debug transfer button clicked</pre>'
                        }
                    })
                );
                return;
            }

            this.loading = true;

            try {
                await transferCart();
            } catch (error) {
                console.error('[Punchout2Go] Transfer failed', error);
            } finally {
                this.loading = false;
            }
        }
    }));
});