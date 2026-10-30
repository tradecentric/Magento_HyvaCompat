export async function loadPunchoutSection(force = false) {
    const url = '/customer/section/load/?sections=punchout-session' + (force ? '&update_section_id=true' : '');
    const resp = await fetch(url, { credentials: 'same-origin' });
    if (!resp.ok) throw new Error('Failed to load punchout-session section: ' + resp.status);
    const data = await resp.json();
    return data['punchout-session'] || null;
}

const prefetchPunchoutId = () => {
    window.P2G_HYVA = window.P2G_HYVA || {};
    loadPunchoutSection(false)
        .then((sec) => {
            if (sec && sec.punchoutId) window.P2G_HYVA.punchoutId = sec.punchoutId;
        })
        .catch(() => {});
};

// session.phtml imports this module from its own DOMContentLoaded handler, so the event has usually fired already
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefetchPunchoutId);
} else {
    prefetchPunchoutId();
}
