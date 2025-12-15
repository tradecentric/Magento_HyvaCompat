export function p2gTransferButton({ debug = false } = {}) {
    return {
        debug,
        loading: false,
        hint: debug ? 'Debug mode enabled' : '',

        async handleClick() {
            if (this.loading) {
                return;
            }

            // Debug mode → open modal
            if (this.debug) {
                this.$dispatch('p2g-open-debug');
                return;
            }

            // Normal transfer
            await this.runTransfer();
        },

        async runTransfer() {
            if (typeof window.transferCart !== 'function') {
                this.notify('error', 'Transfer function is not available.');
                return;
            }

            this.loading = true;
            this.hint = 'Transferring cart…';

            try {
                await window.transferCart();
            } catch (err) {
                this.notify(
                    'error',
                    err?.message || 'Transfer failed'
                );
            } finally {
                this.loading = false;
                this.hint = this.debug ? 'Debug mode enabled' : '';
            }
        },

        notify(type, message) {
            window.dispatchEvent(new CustomEvent('p2g-notify', {
                detail: { type, message }
            }));
        }
    };
}