import Alpine from 'alpinejs';

import { p2gTransferButton } from './alpine/transfer-button.js';
import { p2gDebugModal } from './alpine/debug-modal.js';
import { p2gNotifications } from './alpine/notifications.js';

window.Alpine = Alpine;

Alpine.data('p2gTransferButton', p2gTransferButton);
Alpine.data('p2gDebugModal', p2gDebugModal);
Alpine.data('p2gNotifications', p2gNotifications);

Alpine.start();