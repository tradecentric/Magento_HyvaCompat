import { loadPunchoutSection } from './punchout-session.js';

const elHint = () => document.querySelector('#p2g-debug-hint');

const isB64Std = (s) => typeof s === 'string' && /^[A-Za-z0-9+/=]+$/.test(s) && s.length % 4 === 0;
const isB64Url = (s) => typeof s === 'string' && /^[A-Za-z0-9\-_]+$/.test(s);
const toStdB64 = (s) => {
    if (typeof s !== 'string') return s;
    let t = s.replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    return t;
};
const tryAtob = (s) => { try { return atob(toStdB64(String(s))); } catch { return null; } };
const base64FromUtf8 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
};
const isJsonText = (t) => {
    if (typeof t !== 'string') return false;
    const x = t.trim();
    return (x.startsWith('{') && x.endsWith('}')) || (x.startsWith('[') && x.endsWith(']'));
};
const ensureObject = (val) => {
    if (val == null) return val;
    if (typeof val === 'string') {
        const s = val.trim();
        if (isJsonText(s)) { try { return JSON.parse(s); } catch {} }
    }
    return val;
};
const deepClone = (o) => JSON.parse(JSON.stringify(o ?? {}));

const wrapItemsUnderBody = (params) => {
    const src = deepClone(params || {});
    const bodyIn = (src.body && typeof src.body === 'object') ? src.body : {};
    const rootItems = Array.isArray(src.items) ? src.items : [];
    const bodyItems = Array.isArray(bodyIn.items) ? bodyIn.items : [];
    const body = { ...bodyIn, items: (bodyItems.length ? bodyItems : rootItems).map(ensureObject) };
    const out = { ...src, body };
    delete out.items;
    return out;
};

const peelParamsToObject = (p) => {
    if (p && typeof p === 'object') return p;
    if (typeof p === 'string') {
        let s = p.trim();
        for (let i = 0; i < 2; i++) {
            if (isB64Std(s) || isB64Url(s)) {
                const d = tryAtob(s);
                if (d != null) s = d; else break;
            }
        }
        if (s.startsWith('"') && s.endsWith('"')) {
            try { s = JSON.parse(s); } catch {}
        }
        if (isJsonText(s)) { try { return JSON.parse(s); } catch {} }
    }
    return null;
};

const stripCustomFieldsEnvelope = (payload) => {
    const p = deepClone(payload || {});
    p.body = p.body || {};
//    if ('custom_fields' in p.body) delete p.body.custom_fields;
    if (Array.isArray(p.items)) {
        p.body.items = p.body.items || [];
        if (!p.body.items.length) p.body.items = p.items;
        delete p.items;
    }
    if (Array.isArray(p.body.items)) {
        p.body.items = p.body.items.map(ensureObject).map(it => {
            if (it && typeof it === 'object' && 'custom_fields' in it) {
//               const copy = { ...it }; delete copy.custom_fields; return copy;
            }
            return it;
        });
    }
    return p;
};

const normalizeCart = (cart) => {
    if (!cart) return {};
    const c = { ...cart };
 //   if ('custom_fields' in c) delete c.custom_fields;
    if (Array.isArray(c.addresses)) {
        c.addresses = c.addresses.map(ensureObject).filter(a => a != null);
    }
    ['tax','total','grand_total','currency_rate','fixed_product_tax','edit_mode'].forEach(k => {
        if (c[k] !== undefined && typeof c[k] === 'string' && !isNaN(c[k])) c[k] = Number(c[k]);
    });
    return c;
};

const normalizeItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(ensureObject).map(it => {
        if (it && typeof it === 'object' && 'custom_fields' in it) {
 //           const copy = { ...it }; delete copy.custom_fields; return copy;
        }
        return it;
    });
};

const restBaseCandidates = () => {
    const list = [];
    const cfgCode = (window.P2G_HYVA && window.P2G_HYVA.restStoreCode) || '';
    if (cfgCode) list.push(`/rest/${cfgCode}/V1`);
    const storeCode = window.checkoutConfig && window.checkoutConfig.storeCode;
    if (storeCode) list.push(`/rest/${storeCode}/V1`);
    list.push('/rest/V1', '/rest/default/V1');
    return Array.from(new Set(list));
};

async function getJsonOrXml(url) {
    const resp = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json, text/xml;q=0.9, application/xml;q=0.9, */*;q=0.8' }
    });
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    const text = await resp.text();
    if (!resp.ok) throw new Error('Transfer HTTP ' + resp.status);
    if (ct.includes('json')) {
        try { const json = JSON.parse(text); return { json, xml: null, ct, raw: text, url }; } catch {}
    }
    if (ct.includes('xml') || text.trim().startsWith('<?xml')) {
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        return { json: null, xml, ct, raw: text, url };
    }
    try { const json = JSON.parse(text); return { json, xml: null, ct, raw: text, url }; } catch {}
    return { json: null, xml: null, ct, raw: text, url };
}

const extractReturnUrl = (payload) => {
    const { json, xml } = payload;
    if (json) {
        const paths = [
            ['punchout_return_url'],
            ['return_url'],
            ['data','cart','punchout_return_url'],
            ['cart','punchout_return_url'],
            ['cart_data','punchout_return_url']
        ];
        for (const p of paths) {
            let cur = json;
            for (const k of p) cur = cur && cur[k];
            if (typeof cur === 'string' && cur) return cur;
        }
    }
    if (xml) {
        const node = xml.querySelector('punchout_return_url, return_url');
        if (node && node.textContent) return node.textContent.trim();
    }
    return null;
};

const extractPostForm = (payload) => {
    const { json, xml } = payload;
    const sanitizeFieldsParams = (fields) => {
        if (!fields) return fields;
        const peeled = peelParamsToObject(fields.params);
        if (peeled && typeof peeled === 'object') {
            const reshaped = stripCustomFieldsEnvelope(wrapItemsUnderBody(peeled));
            fields.params = reshaped;
            fields.__p2g_params_needs_encoding = true;
        }
        return fields;
    };

    if (json) {
        const elements = json.elements || (json.data && json.data.elements);
        const pf = elements && (elements.postform || elements.postForm || elements.post_form);
        if (pf && pf.url && (pf.fields || pf.inputs || pf.data)) {
            const fields = sanitizeFieldsParams(pf.fields || pf.inputs || pf.data || {});
            return { url: pf.url, fields, source: 'json.elements.postform' };
        }
        const url = json.postform_url || json.post_url || (json.postform && json.postform.url);
        const fields = json.postform_fields || (json.postform && (json.postform.fields || json.postform.inputs));
        if (url && fields) return { url, fields: sanitizeFieldsParams(fields), source: 'json.flat' };
    }

    if (xml) {
        const pUrlNode = xml.querySelector('postform_url, post_url, form_url');
        const pNode = xml.querySelector('postform, post_form, form');
        let url = null; let fields = {};
        if (pUrlNode && pUrlNode.textContent) url = pUrlNode.textContent.trim();
        if (pNode) {
            const fieldNodes = Array.from(pNode.querySelectorAll('field, input'));
            fieldNodes.forEach(n => {
                const nameAttr = n.getAttribute && n.getAttribute('name');
                if (nameAttr) fields[nameAttr] = (n.textContent || '').trim();
                else {
                    const nameNode = n.querySelector('name'); const valueNode = n.querySelector('value');
                    if (nameNode && valueNode) fields[nameNode.textContent.trim()] = valueNode.textContent.trim();
                }
            });
        }
        if (url && Object.keys(fields).length) return { url, fields: sanitizeFieldsParams(fields), source: 'xml' };
    }
    return null;
};

const extractCartItemsFromJson = (json) => {
    const cart = json.cart_data || json.cart || (json.data && (json.data.cart_data || json.data.cart));
    const items = json.items_data || json.items || (json.data && (json.data.items_data || json.data.items)) || [];
    return { cart: normalizeCart(cart || {}), items: normalizeItems(items || []) };
};

const extractCartItemsFromXml = (xml) => {
    const cart = {}; const items = [];
    if (cart.addresses && Array.isArray(cart.addresses)) cart.addresses = cart.addresses.map(ensureObject);
    if (xml) {
        const cartNode = xml.querySelector('cart_data, cartData, cart-data');
        if (cartNode) {
            Array.from(cartNode.children).forEach(ch => {
                const key = ch.tagName ? ch.tagName.toLowerCase() : null;
                if (!key) return;
                if (key === 'custom_fields' || key === 'customfields') return;
                const t = (ch.textContent || '').trim();
                cart[key] = (!isNaN(t) && t !== '') ? Number(t) : t;
            });
        }
        const itemsNode = xml.querySelector('items_data, itemsData, items-data');
        if (itemsNode) {
            Array.from(itemsNode.querySelectorAll('item')).forEach(n => {
                const t = (n.textContent || '').trim();
                items.push(ensureObject(t));
            });
        }
    }
    return { cart: normalizeCart(cart), items: normalizeItems(items) };
};

const buildFormFromPayload = (payload) => {
    const pf = extractPostForm(payload);
    if (pf) return pf;
    let cart = null, items = [];
    if (payload.json) {
        const ci = extractCartItemsFromJson(payload.json);
        cart = ci.cart; items = ci.items;
    } else if (payload.xml) {
        const ci = extractCartItemsFromXml(payload.xml);
        cart = ci.cart; items = ci.items;
    }
    if (cart || (items && items.length)) {
        const merged = { body: { ...(cart || {}), items: (items || []) } };
        const sanitized = stripCustomFieldsEnvelope(merged);
        const fields = {
            apikey: (window.P2G_HYVA && window.P2G_HYVA.apiKey) || '',
            version: '1.0',
            params: sanitized,
            __p2g_params_needs_encoding: true
        };
        const url = extractReturnUrl(payload);
        if (url) return { url, fields, source: 'synthesized' };
    }
    return null;
};

function submitPostForm(url, fields) {
    if (Object.prototype.hasOwnProperty.call(fields, 'params')) {
        const p = fields.params;
        if (fields.__p2g_params_needs_encoding || (p && typeof p === 'object')) {
            fields.params = base64FromUtf8(JSON.stringify(p));
        } else if (typeof p === 'string') {
            if (isB64Std(p) || isB64Url(p)) {
            } else if (isJsonText(p)) {
                fields.params = base64FromUtf8(p);
            } else {
                fields.params = base64FromUtf8(p);
            }
        } else {
            fields.params = base64FromUtf8('{}');
        }
        delete fields.__p2g_params_needs_encoding;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.enctype = 'application/x-www-form-urlencoded';
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';

    Object.keys(fields || {}).forEach((k) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = k;
        const v = fields[k];
        input.value = (typeof v === 'string') ? v : JSON.stringify(v);
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

async function closeSessionPost() {
    const url = (window.P2G_HYVA && window.P2G_HYVA.closePostUrl) || '/punchout/session/closePost';
    const resp = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!resp.ok) {}
}

export async function transferCart() {
    try {
        let punchoutId = window.P2G_HYVA && window.P2G_HYVA.punchoutId;
        if (!punchoutId) {
            const sec = await loadPunchoutSection(true);
            punchoutId = sec && sec.punchoutId;
        }
        if (!punchoutId) {
            alert('PunchOut session is not active.');
            return;
        }
        let payload = null;
        const bases = restBaseCandidates();
        for (const base of bases) {
            const url = `${base}/punchout-quote/${encodeURIComponent(punchoutId)}/transfer`;
            try {
                payload = await getJsonOrXml(url);
                if (payload.json || payload.xml) break;
            } catch {}
        }
        if (!payload) {
            alert('Unable to fetch transfer payload.');
            return;
        }
        const returnUrl = extractReturnUrl(payload);
        const form = buildFormFromPayload(payload);
        if (!returnUrl) {
            alert('Transfer payload did not include a redirect/return URL.');
            return;
        }
        await closeSessionPost();
        if (form && form.url) {
            submitPostForm(form.url, form.fields || {});
            return;
        }
        window.location.href = returnUrl;
    } catch (err) {
        alert('Transfer failed: ' + (err && err.message ? err.message : 'unknown error'));
    }
}

window.transferCart = transferCart;
