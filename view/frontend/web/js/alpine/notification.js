export function p2gNotifications() {
    return {
        notices: [],
        counter: 0,

        notify({ type = 'info', message = '', timeout = 5000 }) {
            const id = ++this.counter;
            this.notices.push({ id, type, message });

            setTimeout(() => {
                this.notices = this.notices.filter(n => n.id !== id);
            }, timeout);
        }
    };
}