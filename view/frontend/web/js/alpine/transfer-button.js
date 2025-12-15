import { transferCart } from '../punchout-transfer.js';
import { openDebugModal } from './debug-modal.js'; 

export function p2gTransferButton({ debug = false } = {}) {
    return {
        debug,
        loading: false,
        hint: debug ? 'Debug mode enabled' : '',

        async handleClick() {
            if (this.debug) {
                // open debug modal if in debug mode
                if (typeof openDebugModal === 'function') {
                    openDebugModal();
                } else {
                    console.warn('Debug modal function not defined');
                }
                return;
            }

            this.loading = true;

            try {
                await transferCart();
            } catch (err) {
                console.error('Transfer failed', err);
            } finally {
                this.loading = false;
            }
        }
	};
}