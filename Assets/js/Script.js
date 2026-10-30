/* ==========================================================================
   ThemeBlog2026 — shared front-end library (window.TB)
   --------------------------------------------------------------------------
   Loaded once (deferred) by TopHeader.html. Views run their own code inside
   a DOMContentLoaded listener, by which point window.TB is ready.
   Configuration comes from window.TB_CONFIG, printed by TopHeader.html.
   ========================================================================== */
(function () {
    'use strict';

    /* ---------------------------------------------------------------------
       Config
       --------------------------------------------------------------------- */
    const stripSlash = (s) => String(s || '').replace(/\/+$/, '');
    const CFG = Object.assign({
        pkg: 'ThemeBlog2026',
        apiBase: '',
        siteUrl: '',
        siteHost: '',
        siteName: '',
        tokenName: '',
        routes: {}
    }, window.TB_CONFIG || {});
    CFG.apiBase = stripSlash(CFG.apiBase);
    CFG.siteUrl = stripSlash(CFG.siteUrl);
    CFG.siteHost = stripSlash(CFG.siteHost || CFG.siteUrl);

    /* ---------------------------------------------------------------------
       Small DOM + string helpers
       --------------------------------------------------------------------- */
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);

    // Turns API strings that may contain entities or stray tags into plain text.
    const parser = new DOMParser();
    function plain(v) {
        if (v == null) return '';
        const s = String(v);
        if (!/[&<]/.test(s)) return s.trim();
        return (parser.parseFromString(s, 'text/html').body.textContent || '').trim();
    }

    function hashHue(str) {
        let h = 0;
        const s = String(str || 'tb');
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h % 360;
    }

    function debounce(fn, wait) {
        let t;
        return function () {
            const args = arguments;
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    function storage(kind) {
        try { return window[kind]; } catch (e) { return null; }
    }
    const local = storage('localStorage');
    const session = storage('sessionStorage');
    function readStore(store, key) { try { return store ? store.getItem(key) : null; } catch (e) { return null; } }
    function writeStore(store, key, val) { try { if (store) store.setItem(key, val); } catch (e) { /* private mode */ } }
    function removeStore(store, key) { try { if (store) store.removeItem(key); } catch (e) { /* private mode */ } }

    /* ---------------------------------------------------------------------
       Icons (Lucide, ISC licence; X mark from Tabler, MIT)
       --------------------------------------------------------------------- */
    const ICONS = {
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        x: '<path d="M18 6 6 18M6 6l12 12"/>',
        arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
        arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
        chevronDown: '<path d="m6 9 6 6 6-6"/>',
        chevronRight: '<path d="m9 18 6-6-6-6"/>',
        clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
        flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
        mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        reply: '<path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
        mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
        book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
        image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
        file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 13h4M10 17h4"/>',
        music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        play: '<path d="m6 3 14 9-14 9V3z"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
        inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
        user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
        trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
        sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
        corner: '<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
        enter: '<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
        updown: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
        copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        brandX: '<path d="M4 4l11.733 16h4.267l-11.733-16z"/><path d="M4 20l6.768-6.768m2.46-2.46L20 4"/>',
        linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
        facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
        whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
        grid: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
        fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
        plus: '<path d="M5 12h14M12 5v14"/>',
        folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
        tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
        settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
        logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
        external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
        edit: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z"/>',
        trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
        upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
        menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
        refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        star: '<path d="M11.52 2.3a.53.53 0 0 1 .96 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .3-.9l5.16-.76a2.12 2.12 0 0 0 1.6-1.16z"/>'
    };
    function icon(name, extra) {
        return '<svg class="tb-i' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
    }

    /* ---------------------------------------------------------------------
       URLs
       --------------------------------------------------------------------- */
    const DEFAULT_ROUTES = {
        home: '/' + CFG.pkg + '/Home',
        blog: '/' + CFG.pkg + '/Blog',
        post: '/' + CFG.pkg + '/Post',
        topics: '/' + CFG.pkg + '/Topics',
        category: '/' + CFG.pkg + '/Category',
        author: '/' + CFG.pkg + '/Author',
        signIn: '/MdBlog/Sign-in',
        signUp: '/MdBlog/Sign-up',
        profile: '/MdBlog/User-profile'
    };
    const ROUTES = Object.assign({}, DEFAULT_ROUTES, CFG.routes || {});

    function buildQuery(params) {
        const qs = new URLSearchParams();
        Object.keys(params || {}).forEach((k) => {
            const v = params[k];
            if (v !== undefined && v !== null && v !== '' && v !== false) qs.append(k, v);
        });
        const s = qs.toString();
        return s ? '?' + s : '';
    }

    // A route may contain a {param} placeholder (e.g. /blog/{slug}) for pretty
    // URLs; otherwise the value is sent as a query-string parameter.
    function page(name, params) {
        let route = ROUTES[name] || ('/' + CFG.pkg + '/' + name);
        const rest = Object.assign({}, params || {});
        route = route.replace(/\{(\w+)\}/g, (m, key) => {
            const v = rest[key];
            delete rest[key];
            return v == null ? '' : encodeURIComponent(v);
        });
        if (/^https?:\/\//i.test(route)) return route + buildQuery(rest);
        return CFG.siteUrl + route + buildQuery(rest);
    }

    const url = {
        home: () => page('home'),
        blog: (params) => page('blog', params),
        post: (slug) => page('post', { slug: slug }),
        topics: () => page('topics'),
        category: (id) => page('category', { id: id }),
        author: (id) => page('author', { id: id }),
        signIn: () => page('signIn'),
        signUp: () => page('signUp'),
        profile: () => page('profile'),
        media(path) {
            if (!path) return '';
            const p = String(path);
            if (/^(https?:)?\/\//i.test(p) || p.startsWith('data:')) return p;
            return CFG.siteHost + '/' + p.replace(/^\/+/, '');
        },
        current: () => window.location.href.split('#')[0]
    };

    function isCurrent(href) {
        try {
            const a = new URL(href, window.location.href);
            const strip = (p) => p.replace(/\/+$/, '').toLowerCase();
            return strip(a.pathname) === strip(window.location.pathname);
        } catch (e) { return false; }
    }

    // Reads a page parameter: server-side route value first, then ?name=.
    function param(name, serverValue) {
        if (serverValue != null && String(serverValue).trim() !== '') return String(serverValue).trim();
        const v = new URLSearchParams(window.location.search).get(name);
        return v ? v.trim() : '';
    }

    /* ---------------------------------------------------------------------
       Auth (MdBlog session sign-in stores a token in localStorage)
       --------------------------------------------------------------------- */
    const auth = {
        token() { return CFG.tokenName ? readStore(local, CFG.tokenName) : null; },
        detailsKey() {
            if (!CFG.tokenName) return '';
            return CFG.tokenName.split('_').slice(1).join('_') + '_userDetails';
        },
        user() {
            if (!this.token()) return null;
            const raw = readStore(local, this.detailsKey());
            if (!raw) return { username: 'Reader' };
            try { return JSON.parse(raw) || { username: 'Reader' }; } catch (e) { return { username: 'Reader' }; }
        },
        isSignedIn() { return !!this.token(); },
        clear() {
            if (CFG.tokenName) removeStore(local, CFG.tokenName);
            const k = this.detailsKey();
            if (k) removeStore(local, k);
        }
    };

    /* ---------------------------------------------------------------------
       API client — every MdBlog response uses the LtResponse envelope
       --------------------------------------------------------------------- */
    class ApiError extends Error {
        constructor(message, code, payload) {
            super(message);
            this.name = 'ApiError';
            this.code = code;
            this.payload = payload;
        }
    }

    const EXPIRED_CODES = ['1102', '1103', '1105'];

    function friendlyMessage(code, raw) {
        if (code === '1204' || /not published to this Route/i.test(raw || '')) {
            return 'This content is not available to visitors yet. The site owner needs to publish the MdBlog routes to the Anonymous role.';
        }
        return raw || 'Something went wrong. Please try again.';
    }

    async function request(method, path, opts, retried) {
        opts = opts || {};
        let endpoint = CFG.apiBase + '/' + String(path).replace(/^\/+/, '');
        if (opts.params) endpoint += buildQuery(opts.params);

        const headers = { Accept: 'application/json' };
        const token = auth.token();
        if (token) headers.Authorization = 'Bearer ' + token;
        const init = { method: method, headers: headers, credentials: 'same-origin' };
        if (opts.form) {
            // multipart/form-data: the browser sets the boundary header itself
            init.body = opts.form;
        } else if (opts.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(opts.body);
        }

        let res;
        try {
            res = await fetch(endpoint, init);
        } catch (e) {
            throw new ApiError('We could not reach the server. Please check your connection.', 'network');
        }

        let body;
        try {
            body = await res.json();
        } catch (e) {
            throw new ApiError('The server returned an unexpected response (HTTP ' + res.status + ').', String(res.status));
        }

        const code = String(body && body.responseCode);
        if (!retried && token && EXPIRED_CODES.indexOf(code) !== -1) {
            auth.clear();
            return request(method, path, opts, true);
        }
        if (!body || Number(body.responseCategory) !== 200) {
            if (code === '1204') console.warn('[ThemeBlog2026] ' + (body && body.responseResult));
            throw new ApiError(friendlyMessage(code, body && body.responseResult), code, body);
        }
        return body.responseData;
    }

    const api = {
        get: (path, params) => request('GET', path, { params: params }),
        post: (path, body) => request('POST', path, { body: body || {} }),
        patch: (path, body) => request('PATCH', path, { body: body || {} }),
        del: (path) => request('DELETE', path, {}),
        form: (path, formData) => request('POST', path, { form: formData })
    };

    /* ---------------------------------------------------------------------
       Normalisers — keep views independent of API field naming
       --------------------------------------------------------------------- */
    function wordCount(html) {
        return plain(String(html || '').replace(/<[^>]+>/g, ' ')).split(/\s+/).filter(Boolean).length;
    }

    function normalizePost(p) {
        if (!p || typeof p !== 'object') return null;
        const media = Array.isArray(p.media) ? p.media : [];
        const images = media.filter((m) => String(m.mimeType || '').indexOf('image/') === 0);
        const cover = images.find((m) => /cover|feature|thumb|banner/i.test(m.mediaCategory || '')) || images[0] || null;
        const content = p.content || '';
        const reading = Number(p.readingTime != null ? p.readingTime : p.reading_time) || (content ? Math.max(1, Math.round(wordCount(content) / 225)) : 0);
        return {
            id: String(p.ltId != null ? p.ltId : (p.lt_id != null ? p.lt_id : '')),
            title: plain(p.title) || 'Untitled story',
            slug: p.slug || '',
            excerpt: plain(p.excerpt),
            content: content,
            readingTime: reading || null,
            categoryId: p.categoryId != null ? String(p.categoryId) : (p.category_id != null ? String(p.category_id) : ''),
            category: plain(p.category != null ? p.category : (p.categoryName || '')),
            date: p.date || p.publishedAt || p.published_at || p.createdAt || p.created_at || '',
            likes: Number(p.likes != null ? p.likes : (p.likeCount || 0)) || 0,
            views: Number(p.views != null ? p.views : (p.viewCount || 0)) || 0,
            commentCount: Number(p.commentCount || p.comment_count || 0) || 0,
            authorId: p.authorId != null ? String(p.authorId) : (p.author_id != null ? String(p.author_id) : ''),
            author: plain(p.author || p.authorName || ''),
            avatar: url.media(p.avatar || p.authorAvatar || ''),
            bio: plain(p.bio || ''),
            linkedin: p.linkedin || '',
            twitter: p.twitter || '',
            facebook: p.facebook || '',
            isFeatured: Number(p.isFeatured != null ? p.isFeatured : p.is_featured) === 1,
            status: p.status || 'published',
            userReaction: p.userReaction || null,
            comments: Array.isArray(p.comments) ? p.comments : [],
            media: media,
            images: images,
            cover: cover ? url.media(cover.storagePath) : '',
            coverAlt: cover ? plain(cover.altText || '') : '',
            coverId: cover ? String(cover.mediaId || '') : ''
        };
    }

    function normalizeCategory(c) {
        return {
            id: String(c.ltId != null ? c.ltId : (c.id || '')),
            name: plain(c.categoryName || c.title || c.name || ''),
            description: plain(c.categoryDescription || c.description || ''),
            showOnMenu: Number(c.showOnMenu) === 1,
            status: c.status || 'isActive'
        };
    }

    /* ---------------------------------------------------------------------
       Data access (memoised where it is safe to do so)
       --------------------------------------------------------------------- */
    const memo = new Map();
    function once(key, fn) {
        if (!memo.has(key)) {
            memo.set(key, fn().catch((e) => { memo.delete(key); throw e; }));
        }
        return memo.get(key);
    }

    const data = {
        categories() {
            return once('categories', async () => {
                let list;
                try {
                    list = await api.get('blogs/categories', { status: 'isActive' });
                } catch (e) {
                    list = await api.get('blogs/filter/categories', { status: 'isActive' });
                }
                return (Array.isArray(list) ? list : [])
                    .map(normalizeCategory)
                    .filter((c) => c.id && c.name && c.status !== 'isNotActive');
            });
        },
        async category(id) {
            const list = await this.categories();
            return list.find((c) => c.id === String(id)) || null;
        },
        async posts(params) {
            const res = await api.get('blogs/filter/posts', params);
            const items = (res && Array.isArray(res.data) ? res.data : []).map(normalizePost).filter(Boolean);
            const p = (res && res.pagination) || {};
            return {
                items: items,
                total: Number(p.totalItems) || items.length,
                pages: Number(p.totalPages) || (items.length ? 1 : 0),
                page: Number(p.currentPage) || 1,
                perPage: Number(p.itemsPerPage) || items.length,
                hasMore: !!p.hasMore
            };
        },
        async widget(type, opts) {
            const res = await api.get('blogs/posts/widget', Object.assign({ type: type, limit: 5 }, opts || {}));
            return (Array.isArray(res) ? res : []).map(normalizePost).filter(Boolean);
        },
        async post(slug) {
            const res = await api.get('blogs/posts/' + encodeURIComponent(slug) + '/slug');
            return normalizePost(res);
        },
        author(id) {
            return api.get('blogs/user/' + encodeURIComponent(id) + '/record');
        },
        siteMenus() {
            return once('siteMenus', () => api.get('menus/is-navigation'));
        }
    };

    /* ---------------------------------------------------------------------
       Formatting
       --------------------------------------------------------------------- */
    function toDate(v) {
        if (!v) return null;
        const d = new Date(String(v).replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
    }
    const fmtDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const fmtLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const fmt = {
        date(v) { const d = toDate(v); return d ? fmtDate.format(d) : ''; },
        longDate(v) { const d = v ? toDate(v) : new Date(); return d ? fmtLong.format(d) : ''; },
        iso(v) { const d = toDate(v); return d ? d.toISOString() : ''; },
        count(n) {
            n = Number(n) || 0;
            if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
            if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
            return String(n);
        },
        plural(n, word) { return fmt.count(n) + ' ' + word + (Number(n) === 1 ? '' : 's'); },
        ago(v) {
            const d = toDate(v);
            if (!d) return '';
            const s = Math.round((Date.now() - d.getTime()) / 1000);
            if (s < 45) return 'just now';
            const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
            for (let i = 0; i < units.length; i++) {
                const n = Math.floor(s / units[i][1]);
                if (n >= 1) return n + ' ' + units[i][0] + (n > 1 ? 's' : '') + ' ago';
            }
            return 'just now';
        },
        readTime(n) { return n ? n + ' min read' : ''; }
    };

    /* ---------------------------------------------------------------------
       Render helpers (return HTML strings — every value is escaped)
       --------------------------------------------------------------------- */
    function initials(name) {
        const parts = plain(name).split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    }

    function avatar(name, src, size) {
        const style = '--h:' + hashHue(name) + (size ? ';--s:' + size + 'px' : '');
        const img = src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '';
        return '<span class="tb-avatar" style="' + style + '" aria-hidden="true">' + (img || esc(initials(name))) + '</span>';
    }

    function placeholder(post) {
        const seed = post.category || post.title;
        const letter = (plain(seed).charAt(0) || '·').toUpperCase();
        return '<span class="tb-ph" style="--h:' + hashHue(seed) + '" aria-hidden="true"><span>' + esc(letter) + '</span></span>';
    }

    function mediaBox(post, opts) {
        opts = opts || {};
        const img = post.cover
            ? '<img src="' + esc(post.cover) + '" alt="' + esc(post.coverAlt || post.title) + '" loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async"' + (opts.eager ? ' fetchpriority="high"' : '') + '>'
            : '';
        return '<span class="tb-media' + (opts.small ? ' tb-media--sm' : '') + '">' + placeholder(post) + img + '</span>';
    }

    function kicker(post) {
        if (!post.category) return '';
        if (post.categoryId) return '<a class="tb-kicker" href="' + esc(url.category(post.categoryId)) + '">' + esc(post.category) + '</a>';
        return '<span class="tb-kicker">' + esc(post.category) + '</span>';
    }

    function meta(post, parts) {
        parts = parts || ['author', 'date', 'read'];
        const out = [];
        parts.forEach((part) => {
            if (part === 'author' && post.author) {
                out.push(post.authorId
                    ? '<a class="tb-meta__author" href="' + esc(url.author(post.authorId)) + '">' + esc(post.author) + '</a>'
                    : '<span class="tb-meta__author">' + esc(post.author) + '</span>');
            } else if (part === 'date' && post.date) {
                out.push('<time datetime="' + esc(fmt.iso(post.date)) + '">' + esc(fmt.date(post.date)) + '</time>');
            } else if (part === 'read' && post.readingTime) {
                out.push('<span class="tb-meta__item">' + icon('clock') + esc(fmt.readTime(post.readingTime)) + '</span>');
            } else if (part === 'views') {
                out.push('<span class="tb-meta__item">' + icon('eye') + esc(fmt.count(post.views)) + '</span>');
            } else if (part === 'likes') {
                out.push('<span class="tb-meta__item">' + icon('heart') + esc(fmt.count(post.likes)) + '</span>');
            }
        });
        return out.length ? '<div class="tb-meta">' + out.join('') + '</div>' : '';
    }

    const card = {
        // Standard vertical card
        standard(post, opts) {
            opts = opts || {};
            const href = esc(url.post(post.slug));
            return '<article class="tb-card tb-reveal" style="--i:' + (opts.index || 0) + '">' +
                '<a href="' + href + '" tabindex="-1" aria-hidden="true">' + mediaBox(post, { eager: opts.eager }) + '</a>' +
                (post.isFeatured && opts.badge !== false ? '<span class="tb-card__badge">Featured</span>' : '') +
                '<div class="tb-card__body">' +
                kicker(post) +
                '<h3 class="tb-card__title"><a href="' + href + '"><span class="tb-link-underline">' + esc(post.title) + '</span></a></h3>' +
                (opts.excerpt === false || !post.excerpt ? '' : '<p class="tb-card__excerpt">' + esc(post.excerpt) + '</p>') +
                meta(post, opts.meta) +
                '</div></article>';
        },
        // Image on the side
        row(post, opts) {
            opts = opts || {};
            const href = esc(url.post(post.slug));
            return '<article class="tb-card tb-card--row tb-reveal" style="--i:' + (opts.index || 0) + '">' +
                '<a href="' + href + '" tabindex="-1" aria-hidden="true">' + mediaBox(post, { small: true }) + '</a>' +
                '<div class="tb-card__body">' + kicker(post) +
                '<h3 class="tb-card__title"><a href="' + href + '"><span class="tb-link-underline">' + esc(post.title) + '</span></a></h3>' +
                (opts.excerpt && post.excerpt ? '<p class="tb-card__excerpt">' + esc(post.excerpt) + '</p>' : '') +
                meta(post, opts.meta || ['date', 'read']) +
                '</div></article>';
        },
        // Small thumbnail + title (sidebars, search)
        compact(post, opts) {
            opts = opts || {};
            const href = esc(url.post(post.slug));
            return '<article class="tb-card tb-card--compact">' +
                '<a href="' + href + '" tabindex="-1" aria-hidden="true">' + mediaBox(post, { small: true }) + '</a>' +
                '<div class="tb-card__body">' +
                (opts.kicker === false ? '' : kicker(post)) +
                '<h4 class="tb-card__title"><a href="' + href + '">' + esc(post.title) + '</a></h4>' +
                meta(post, opts.meta || ['date']) +
                '</div></article>';
        },
        // Numbered list item (trending)
        ranked(post) {
            const href = esc(url.post(post.slug));
            return '<li class="tb-rank__item tb-card">' +
                '<div class="tb-card__body">' + kicker(post) +
                '<h3 class="tb-card__title"><a href="' + href + '"><span class="tb-link-underline">' + esc(post.title) + '</span></a></h3>' +
                meta(post, ['author', 'read']) +
                '</div></li>';
        }
    };

    function skeletonCards(n, variant) {
        let out = '';
        for (let i = 0; i < n; i++) {
            if (variant === 'row') {
                out += '<div class="tb-skel-card" style="grid-template-columns:120px 1fr;display:grid;gap:16px"><div class="tb-skel" style="aspect-ratio:4/3"></div><div style="display:grid;gap:10px;align-content:start"><div class="tb-skel tb-skel--line" style="width:30%"></div><div class="tb-skel tb-skel--title"></div><div class="tb-skel tb-skel--line" style="width:50%"></div></div></div>';
            } else {
                out += '<div class="tb-skel-card"><div class="tb-skel tb-skel--media"></div><div class="tb-skel tb-skel--line" style="width:28%"></div><div class="tb-skel tb-skel--title"></div><div class="tb-skel tb-skel--title" style="width:70%"></div><div class="tb-skel tb-skel--line" style="width:45%"></div></div>';
            }
        }
        return out;
    }

    function state(kind, title, text, action) {
        const ic = kind === 'error' ? 'alert' : (kind === 'search' ? 'search' : 'inbox');
        return '<div class="tb-state' + (kind === 'error' ? ' tb-state--error' : '') + '" role="' + (kind === 'error' ? 'alert' : 'status') + '">' +
            '<span class="tb-state__icon">' + icon(ic) + '</span>' +
            '<h3 class="tb-state__title">' + esc(title) + '</h3>' +
            (text ? '<p class="tb-state__text">' + esc(text) + '</p>' : '') +
            (action ? '<a class="tb-btn tb-btn--ghost tb-btn--sm" href="' + esc(action.href) + '">' + esc(action.label) + '</a>' : '') +
            '</div>';
    }

    function errorState(err, action) {
        return state('error', 'Unable to load stories', (err && err.message) || 'Please try again in a moment.', action);
    }

    function pager(current, total) {
        if (!total || total < 2) return '';
        const pages = [];
        const add = (p) => { if (pages.indexOf(p) === -1 && p >= 1 && p <= total) pages.push(p); };
        add(1); add(total);
        for (let p = current - 1; p <= current + 1; p++) add(p);
        pages.sort((a, b) => a - b);
        let html = '<button class="tb-pager__btn tb-pager__btn--nav" type="button" data-page="' + (current - 1) + '"' + (current <= 1 ? ' disabled' : '') + '>' + icon('arrowLeft') + '<span>Prev</span></button>';
        let last = 0;
        pages.forEach((p) => {
            if (p - last > 1) html += '<span class="tb-pager__gap" aria-hidden="true">&hellip;</span>';
            html += '<button class="tb-pager__btn" type="button" data-page="' + p + '"' + (p === current ? ' aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>';
            last = p;
        });
        html += '<button class="tb-pager__btn tb-pager__btn--nav" type="button" data-page="' + (current + 1) + '"' + (current >= total ? ' disabled' : '') + '><span>Next</span>' + icon('arrowRight') + '</button>';
        return html;
    }

    /* ---------------------------------------------------------------------
       Article content: markdown image markers, code fences, sanitising
       --------------------------------------------------------------------- */
    const DROP_TAGS = 'script,style,link,meta,base,object,embed,applet,form,input,button,select,textarea,frame,frameset,noscript,template,svg,math';
    const EMBED_HOSTS = /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i;

    function decodeOnce(s) {
        const ta = document.createElement('textarea');
        ta.innerHTML = s;
        return ta.value;
    }

    function fenceToCode(inner) {
        const text = decodeOnce(String(inner)
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|li|h\d)>/gi, '\n')
            .replace(/<[^>]+>/g, ''))
            .replace(/^\n+|\n+$/g, '');
        return '<pre><code>' + esc(text) + '</code></pre>';
    }

    function renderContent(html, postId) {
        let src = String(html || '');
        if (!src.trim()) return { html: '', headings: [] };

        // Some editors store HTML entity-encoded; decode once when no real tags exist.
        if (src.indexOf('<') === -1 && /&lt;\w/.test(src)) src = decodeOnce(src);

        // ```code``` or '''code''' fences
        src = src.replace(/```(?:[a-z0-9+-]*)?([\s\S]*?)```|'''([\s\S]*?)'''/gi, (m, a, b) => fenceToCode(a != null ? a : b));

        // MdBlog stores inline images as ![alt](filename) beside the post's folder.
        src = src.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, file) => {
            const clean = file.replace(/["'<>]/g, '');
            let full;
            if (/^(https?:)?\/\//i.test(clean)) full = clean;
            else if (clean.indexOf('/') !== -1) full = url.media(clean);
            else full = url.media('storage/uploads/blogs/post_' + postId + '/' + clean);
            const caption = alt && !/^image$/i.test(alt.trim()) ? '<figcaption>' + esc(alt) + '</figcaption>' : '';
            return '<figure><img src="' + esc(full) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' + caption + '</figure>';
        });

        const doc = parser.parseFromString('<div id="tb-root">' + src + '</div>', 'text/html');
        const root = doc.getElementById('tb-root');

        root.querySelectorAll(DROP_TAGS).forEach((el) => el.remove());
        root.querySelectorAll('iframe').forEach((el) => {
            const s = el.getAttribute('src') || '';
            if (!EMBED_HOSTS.test(s)) { el.remove(); return; }
            el.setAttribute('loading', 'lazy');
            el.setAttribute('allowfullscreen', '');
            el.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        });
        root.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                const val = String(attr.value || '').trim();
                if (name.indexOf('on') === 0 || name === 'srcdoc' || name === 'formaction') { el.removeAttribute(attr.name); return; }
                if ((name === 'href' || name === 'src' || name === 'xlink:href' || name === 'action' || name === 'poster') &&
                    /^(javascript|vbscript|data):/i.test(val.replace(/[\s\u0000-\u001f]/g, '')) &&
                    !(name === 'src' && el.tagName === 'IMG' && /^data:image\//i.test(val))) {
                    el.removeAttribute(attr.name);
                    return;
                }
                if (name === 'style' && /url\s*\(|expression|@import|position\s*:\s*fixed/i.test(val)) el.removeAttribute(attr.name);
            });
        });

        root.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href');
            if (/^https?:\/\//i.test(href) && href.indexOf(window.location.host) === -1) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer nofollow');
            }
        });
        root.querySelectorAll('img').forEach((img) => {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            if (!img.hasAttribute('alt')) img.setAttribute('alt', '');
        });
        root.querySelectorAll('table').forEach((t) => {
            if (t.parentElement && t.parentElement.classList.contains('tb-table-wrap')) return;
            const wrap = doc.createElement('div');
            wrap.className = 'tb-table-wrap';
            t.parentNode.insertBefore(wrap, t);
            wrap.appendChild(t);
        });
        // Remove empty paragraphs editors leave behind
        root.querySelectorAll('p').forEach((p) => {
            if (!p.textContent.trim() && !p.querySelector('img,iframe,video,br + br')) p.remove();
        });

        const headings = [];
        const used = {};
        root.querySelectorAll('h2, h3').forEach((h, i) => {
            const text = h.textContent.trim();
            if (!text) return;
            let id = h.id || ('tb-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section-' + i);
            while (used[id]) id += '-' + i;
            used[id] = true;
            h.id = id;
            headings.push({ id: id, text: text, level: h.tagName === 'H3' ? 3 : 2 });
        });

        return { html: root.innerHTML, headings: headings };
    }

    /* ---------------------------------------------------------------------
       UI primitives: toast, modal, lightbox
       --------------------------------------------------------------------- */
    function toast(message, kind) {
        let wrap = $('.tb-toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'tb-toast-wrap';
            wrap.setAttribute('role', 'status');
            wrap.setAttribute('aria-live', 'polite');
            document.body.appendChild(wrap);
        }
        const el = document.createElement('div');
        el.className = 'tb-toast' + (kind ? ' tb-toast--' + kind : '');
        el.innerHTML = icon(kind === 'error' ? 'alert' : 'check') + '<span></span>';
        el.querySelector('span').textContent = message;
        wrap.appendChild(el);
        setTimeout(() => {
            el.classList.add('is-leaving');
            setTimeout(() => el.remove(), 300);
        }, kind === 'error' ? 4200 : 2600);
    }

    let lastFocus = null;
    function openModal(el) {
        if (!el) return;
        lastFocus = document.activeElement;
        el.hidden = false;
        document.body.classList.add('tb-lock');
        const f = el.querySelector('[autofocus], input, textarea, select, button:not(.tb-modal__close)');
        if (f) setTimeout(() => f.focus(), 30);
    }
    function closeModal(el) {
        if (!el || el.hidden) return;
        el.hidden = true;
        if (!$('.tb-modal:not([hidden]), .tb-search:not([hidden]), .tb-lightbox')) document.body.classList.remove('tb-lock');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', (e) => {
        const closer = e.target.closest('[data-tb-close]');
        if (closer) closeModal(closer.closest('.tb-modal'));
    });

    // Shown when a guest tries to react, like or reply.
    function promptSignIn(action) {
        let modal = $('#tb-signin-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'tb-modal';
            modal.id = 'tb-signin-modal';
            modal.hidden = true;
            modal.innerHTML =
                '<div class="tb-modal__backdrop" data-tb-close></div>' +
                '<div class="tb-modal__panel" role="dialog" aria-modal="true" aria-labelledby="tb-signin-title" style="text-align:center">' +
                '<button class="tb-icon-btn tb-icon-btn--plain tb-modal__close" type="button" data-tb-close aria-label="Close">' + icon('x') + '</button>' +
                '<span class="tb-state__icon" style="margin:0 auto 14px">' + icon('user') + '</span>' +
                '<h2 class="tb-modal__title" id="tb-signin-title" style="padding:0">Join the conversation</h2>' +
                '<p class="tb-modal__text" data-tb-signin-text></p>' +
                '<div class="tb-modal__actions" style="justify-content:center;margin-top:22px">' +
                '<a class="tb-btn tb-btn--ghost" href="' + esc(url.signUp()) + '">Create account</a>' +
                '<a class="tb-btn tb-btn--accent" href="' + esc(url.signIn()) + '">Sign in</a></div></div>';
            document.body.appendChild(modal);
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(modal); });
        }
        modal.querySelector('[data-tb-signin-text]').textContent = 'Sign in or create a free account to ' + (action || 'take part') + '.';
        openModal(modal);
    }

    const lightbox = {
        el: null,
        items: [],
        index: 0,
        open(items, index) {
            this.items = items || [];
            if (!this.items.length) return;
            this.index = index || 0;
            if (!this.el) {
                this.el = document.createElement('div');
                this.el.className = 'tb-lightbox';
                this.el.setAttribute('role', 'dialog');
                this.el.setAttribute('aria-modal', 'true');
                this.el.setAttribute('aria-label', 'Media viewer');
                this.el.innerHTML =
                    '<span class="tb-lightbox__count"></span>' +
                    '<div class="tb-lightbox__stage"></div>' +
                    '<p class="tb-lightbox__caption"></p>' +
                    '<button class="tb-lightbox__btn tb-lightbox__close" type="button" aria-label="Close">' + icon('x') + '</button>' +
                    '<button class="tb-lightbox__btn tb-lightbox__prev" type="button" aria-label="Previous">' + icon('arrowLeft') + '</button>' +
                    '<button class="tb-lightbox__btn tb-lightbox__next" type="button" aria-label="Next">' + icon('arrowRight') + '</button>';
                this.el.addEventListener('click', (e) => {
                    if (e.target.closest('.tb-lightbox__close') || e.target === this.el || e.target.classList.contains('tb-lightbox__stage')) this.close();
                    else if (e.target.closest('.tb-lightbox__prev')) this.go(-1);
                    else if (e.target.closest('.tb-lightbox__next')) this.go(1);
                });
                this.onKey = (e) => {
                    if (e.key === 'Escape') this.close();
                    else if (e.key === 'ArrowLeft') this.go(-1);
                    else if (e.key === 'ArrowRight') this.go(1);
                };
            }
            document.body.appendChild(this.el);
            document.body.classList.add('tb-lock');
            document.addEventListener('keydown', this.onKey);
            this.render();
            this.el.querySelector('.tb-lightbox__close').focus();
        },
        go(step) {
            this.index = (this.index + step + this.items.length) % this.items.length;
            this.render();
        },
        render() {
            const item = this.items[this.index];
            const stage = this.el.querySelector('.tb-lightbox__stage');
            stage.innerHTML = item.type === 'video'
                ? '<video src="' + esc(item.src) + '" controls autoplay playsinline></video>'
                : '<img src="' + esc(item.src) + '" alt="' + esc(item.alt || '') + '">';
            this.el.querySelector('.tb-lightbox__caption').textContent = item.alt || '';
            const multi = this.items.length > 1;
            this.el.querySelector('.tb-lightbox__count').textContent = multi ? (this.index + 1) + ' / ' + this.items.length : '';
            this.el.querySelector('.tb-lightbox__prev').hidden = !multi;
            this.el.querySelector('.tb-lightbox__next').hidden = !multi;
        },
        close() {
            if (!this.el) return;
            this.el.querySelector('.tb-lightbox__stage').innerHTML = '';
            this.el.remove();
            document.removeEventListener('keydown', this.onKey);
            if (!$('.tb-modal:not([hidden]), .tb-search:not([hidden])')) document.body.classList.remove('tb-lock');
        }
    };

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
            return ok;
        }
    }

    /* ---------------------------------------------------------------------
       Global chrome: theme toggle, header, drawer, search, footer, to-top
       --------------------------------------------------------------------- */
    function initTheme() {
        $$('[data-tb-theme-toggle]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                writeStore(local, 'tb-theme', next);
                btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
            });
        });
    }

    function initDropdowns(root) {
        $$('.tb-dd', root).forEach((dd) => {
            if (dd.dataset.tbReady) return;
            dd.dataset.tbReady = '1';
            const btn = dd.querySelector('.tb-nav__link');
            let timer;
            const open = () => { clearTimeout(timer); $$('.tb-dd.is-open').forEach((o) => o !== dd && o.classList.remove('is-open')); dd.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
            const close = () => { dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
            btn.addEventListener('click', (e) => { e.preventDefault(); dd.classList.contains('is-open') ? close() : open(); });
            dd.addEventListener('mouseenter', () => { if (window.matchMedia('(hover: hover)').matches) open(); });
            dd.addEventListener('mouseleave', () => { if (window.matchMedia('(hover: hover)').matches) timer = setTimeout(close, 140); });
            dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
        });
    }
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tb-dd')) $$('.tb-dd.is-open').forEach((d) => { d.classList.remove('is-open'); const b = d.querySelector('.tb-nav__link'); if (b) b.setAttribute('aria-expanded', 'false'); });
    });

    function menuHref(item) {
        const route = item.routePath || '#';
        if (Number(item.isExternal) === 1 || /^https?:\/\//i.test(route)) return route;
        if (route.charAt(0) === '#') return route;
        return CFG.siteUrl + (route.charAt(0) === '/' ? route : '/' + route);
    }

    async function initHeader() {
        const header = $('.tb-header');
        if (!header) return;

        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        $$('[data-tb-nav]').forEach((a) => { if (isCurrent(a.href)) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); } });

        // Drawer
        const drawer = $('.tb-drawer');
        const menuBtn = $('.tb-menu-btn');
        if (drawer && menuBtn) {
            const setOpen = (open) => {
                const searchOpen = !!$('.tb-search:not([hidden])');
                drawer.classList.toggle('is-open', open);
                drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
                menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                document.body.classList.toggle('tb-lock', open || searchOpen);
                if (open) { const f = drawer.querySelector('button, a'); if (f) f.focus(); } else if (!searchOpen) menuBtn.focus();
            };
            menuBtn.addEventListener('click', () => setOpen(true));
            drawer.addEventListener('click', (e) => { if (e.target.closest('[data-tb-drawer-close]')) setOpen(false); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false); });
        }

        // Signed-in reader chip
        const authSlot = $('[data-tb-auth]');
        if (authSlot && auth.isSignedIn()) {
            const u = auth.user();
            const name = u.fullname || u.username || 'Reader';
            authSlot.innerHTML = '<a class="tb-user-chip" href="' + esc(url.profile()) + '" title="Your profile">' + avatar(name, '', 30) + '<span>' + esc(String(name).split(' ')[0]) + '</span></a>';
            $$('[data-tb-signin-link]').forEach((a) => { a.href = url.profile(); a.textContent = 'Your profile'; });
        }

        // Topics dropdown + drawer topics
        try {
            const cats = await data.categories();
            const ddMenu = $('[data-tb-topics-menu]');
            if (ddMenu) {
                if (cats.length) {
                    ddMenu.innerHTML = '<div class="tb-dd__heading">Browse by topic</div>' +
                        cats.slice(0, 10).map((c) => '<a class="tb-dd__item" href="' + esc(url.category(c.id)) + '">' + esc(c.name) + (c.description ? '<small>' + esc(c.description.length > 70 ? c.description.slice(0, 68) + '…' : c.description) + '</small>' : '') + '</a>').join('') +
                        '<div class="tb-dd__footer"><a class="tb-dd__item" href="' + esc(url.topics()) + '">All topics &rarr;</a></div>';
                } else {
                    ddMenu.innerHTML = '<div class="tb-dd__heading">No topics yet</div>';
                }
            }
            const drawerTopics = $('[data-tb-drawer-topics]');
            if (drawerTopics) drawerTopics.innerHTML = cats.slice(0, 12).map((c) => '<a class="tb-pill" href="' + esc(url.category(c.id)) + '">' + esc(c.name) + '</a>').join('');
        } catch (e) {
            const ddMenu = $('[data-tb-topics-menu]');
            if (ddMenu) ddMenu.innerHTML = '<a class="tb-dd__item" href="' + esc(url.topics()) + '">All topics &rarr;</a>';
        }

        // Site menus published to the visitor's role(s) (Pages → Menus in the backend)
        try {
            const menus = await data.siteMenus();
            const items = Array.isArray(menus) ? menus : [];
            if (!items.length) return;
            const links = [];
            items.forEach((m) => {
                const kids = Array.isArray(m.children) ? m.children : [];
                if (kids.length) {
                    links.push({ heading: plain(m.menuName) });
                    kids.forEach((k) => links.push({ name: plain(k.menuName), href: menuHref(k), target: k.target }));
                } else if (m.routePath && m.routePath !== '#') {
                    links.push({ name: plain(m.menuName), href: menuHref(m), target: m.target });
                }
            });
            const real = links.filter((l) => l.name);
            if (!real.length) return;
            const tgt = (l) => (l.target === '_blank' ? ' target="_blank" rel="noopener"' : '');
            const more = $('[data-tb-more]');
            if (more) {
                more.hidden = false;
                more.querySelector('.tb-dd__menu').innerHTML = links.map((l) => l.heading
                    ? '<div class="tb-dd__heading">' + esc(l.heading) + '</div>'
                    : '<a class="tb-dd__item" href="' + esc(l.href) + '"' + tgt(l) + '>' + esc(l.name) + '</a>').join('');
                initDropdowns(more.parentElement);
            }
            const drawerLinks = $('[data-tb-drawer-links]');
            if (drawerLinks) {
                drawerLinks.parentElement.hidden = false;
                drawerLinks.innerHTML = real.map((l) => '<a href="' + esc(l.href) + '"' + tgt(l) + '>' + esc(l.name) + '</a>').join('');
            }
        } catch (e) { /* menus are optional */ }
    }

    function highlight(text, q) {
        const safe = esc(text);
        if (!q) return safe;
        const words = q.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (!words.length) return safe;
        return safe.replace(new RegExp('(' + words.join('|') + ')', 'gi'), '<mark>$1</mark>');
    }

    function initSearch() {
        const box = $('.tb-search');
        if (!box) return;
        const input = $('.tb-search__input', box);
        const body = $('.tb-search__body', box);
        let active = -1;
        let seq = 0;

        const items = () => $$('.tb-search__result, .tb-search__all', body);
        const setActive = (i) => {
            const list = items();
            if (!list.length) return;
            active = (i + list.length) % list.length;
            list.forEach((el, idx) => el.classList.toggle('is-active', idx === active));
            list[active].scrollIntoView({ block: 'nearest' });
        };

        async function renderIdle() {
            body.innerHTML = '<p class="tb-search__hint">Browse topics</p><div class="tb-search__topics"><span class="tb-skel" style="width:90px;height:32px;border-radius:999px"></span><span class="tb-skel" style="width:120px;height:32px;border-radius:999px"></span><span class="tb-skel" style="width:80px;height:32px;border-radius:999px"></span></div>';
            try {
                const cats = await data.categories();
                const topics = $('.tb-search__topics', body);
                if (topics) topics.innerHTML = cats.length
                    ? cats.slice(0, 14).map((c) => '<a class="tb-pill" href="' + esc(url.category(c.id)) + '">' + esc(c.name) + '</a>').join('')
                    : '<span class="tb-meta">Start typing to search every story.</span>';
            } catch (e) {
                const topics = $('.tb-search__topics', body);
                if (topics) topics.innerHTML = '<span class="tb-meta">Start typing to search every story.</span>';
            }
        }

        const run = debounce(async () => {
            const q = input.value.trim();
            active = -1;
            if (q.length < 2) { renderIdle(); return; }
            const mine = ++seq;
            body.innerHTML = '<div style="display:grid;gap:12px;padding:10px">' + skeletonCards(3, 'row') + '</div>';
            try {
                const res = await data.posts({ q: q, limit: 6, page: 1 });
                if (mine !== seq) return;
                if (!res.items.length) {
                    body.innerHTML = state('search', 'No matches for “' + q + '”', 'Try a different keyword or browse the topics.');
                    return;
                }
                body.innerHTML = '<p class="tb-search__hint">' + esc(fmt.plural(res.total, 'result')) + '</p>' +
                    res.items.map((p) => '<a class="tb-search__result" href="' + esc(url.post(p.slug)) + '">' + mediaBox(p, { small: true }) +
                        '<span><span class="tb-search__result-title">' + highlight(p.title, q) + '</span>' + meta(p, ['date', 'read']) + '</span></a>').join('') +
                    '<a class="tb-search__all" href="' + esc(url.blog({ q: q })) + '">See all results for “' + esc(q) + '” ' + icon('arrowRight') + '</a>';
            } catch (err) {
                if (mine !== seq) return;
                body.innerHTML = state('error', 'Search is unavailable', err.message);
            }
        }, 260);

        const open = () => {
            box.hidden = false;
            document.body.classList.add('tb-lock');
            if (!input.value) renderIdle();
            setTimeout(() => input.focus(), 20);
        };
        const close = () => {
            box.hidden = true;
            if (!$('.tb-modal:not([hidden])') && !$('.tb-drawer.is-open')) document.body.classList.remove('tb-lock');
        };

        $$('[data-tb-search-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
        box.addEventListener('click', (e) => { if (e.target.closest('[data-tb-search-close]')) close(); });
        input.addEventListener('input', run);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
            else if (e.key === 'Enter') {
                const list = items();
                if (active >= 0 && list[active]) { e.preventDefault(); window.location.href = list[active].href; }
                else if (input.value.trim()) { e.preventDefault(); window.location.href = url.blog({ q: input.value.trim() }); }
            }
        });
        document.addEventListener('keydown', (e) => {
            const typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); box.hidden ? open() : close(); }
            else if (e.key === 'Escape' && !box.hidden) close();
        });
    }

    async function initFooter() {
        const list = $('[data-tb-footer-topics]');
        if (!list) return;
        try {
            const cats = await data.categories();
            list.innerHTML = cats.length
                ? cats.slice(0, 6).map((c) => '<li><a href="' + esc(url.category(c.id)) + '">' + esc(c.name) + '</a></li>').join('') + '<li><a href="' + esc(url.topics()) + '">All topics &rarr;</a></li>'
                : '<li class="tb-footer__muted">Topics will appear here.</li>';
        } catch (e) {
            list.innerHTML = '<li><a href="' + esc(url.topics()) + '">Browse topics</a></li>';
        }
    }

    function initToTop() {
        const btn = $('.tb-to-top');
        if (!btn) return;
        const onScroll = () => btn.classList.toggle('is-visible', window.scrollY > 700);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Hide images that fail to load so the generated placeholder shows through.
    document.addEventListener('error', (e) => {
        const t = e.target;
        if (t && t.tagName === 'IMG') {
            const box = t.closest('.tb-media');
            if (box) box.classList.add('is-broken');
            else if (t.closest('.tb-avatar')) t.remove();
        }
    }, true);

    function boot() {
        initTheme();
        initDropdowns();
        initHeader();
        initSearch();
        initFooter();
        initToTop();
        $$('[data-tb-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
        $$('[data-tb-today]').forEach((el) => { el.textContent = fmt.longDate(); });
    }

    /* ---------------------------------------------------------------------
       Public API
       --------------------------------------------------------------------- */
    window.TB = {
        config: CFG,
        $, $$, esc, plain, debounce, icon, hashHue,
        url, param, page, auth, api, data, fmt,
        ApiError, normalizePost, normalizeCategory, renderContent,
        card, avatar, mediaBox, meta, kicker, skeletonCards, state, errorState, pager,
        toast, openModal, closeModal, promptSignIn, lightbox, copyText,
        store: {
            get: (k) => readStore(local, k),
            set: (k, v) => writeStore(local, k, v),
            sessionGet: (k) => readStore(session, k),
            sessionSet: (k, v) => writeStore(session, k, v)
        }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
