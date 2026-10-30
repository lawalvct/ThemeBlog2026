/* ==========================================================================
   ThemeBlog2026 Studio — editor-side helpers (window.TB.studio)
   --------------------------------------------------------------------------
   Loaded after Script.js on pages that use StudioLayout / StudioAuthLayout.
   Every request goes through TB.api, which sends the signed-in editor's
   Bearer token. Route permissions in the backend decide what each role can do.
   ========================================================================== */
(function () {
    'use strict';
    const TB = window.TB;
    if (!TB) return;
    const { $, $$, esc, icon, api, auth, url, plain } = TB;

    /* ---------- URLs ---------- */
    const studioUrl = (view, params) => TB.page('Studio' + view, params);
    function loginUrl(next) {
        return studioUrl('Login', next ? { next: next } : null);
    }
    function currentPath() {
        return window.location.pathname + window.location.search;
    }

    /* ---------- auth ---------- */
    function requireAuth() {
        if (!auth.token()) {
            window.location.replace(loginUrl(currentPath()));
            return false;
        }
        return true;
    }

    async function signOut() {
        const token = auth.token();
        try { if (token) await api.post('users/logout', { token: token }); } catch (e) { /* best effort */ }
        auth.clear();
        window.location.href = loginUrl();
    }

    // Normalises permission/session failures into one friendly message.
    function explain(err) {
        if (!err) return 'Something went wrong.';
        if (err.code === '1204') {
            if (!auth.token()) {
                window.location.replace(loginUrl(currentPath()));
                return 'Please sign in again.';
            }
            return 'Your role is not allowed to use this feature. Publish the matching MdBlog route to your role in the backend.';
        }
        return err.message || 'Something went wrong.';
    }

    // MdBlog answers "nothing found" with responseCategory 100 — treat that as an empty list.
    async function list(path, params) {
        try {
            const res = await api.get(path, params);
            return Array.isArray(res) ? res : [];
        } catch (err) {
            if (err.code === '101' || /no .*found/i.test(err.message || '')) return [];
            throw err;
        }
    }

    function categories() {
        return list('blogs/categories').then((rows) => rows.map((c) => Object.assign(TB.normalizeCategory(c), { raw: c })));
    }

    function flattenComments(rows, out) {
        (rows || []).forEach((c) => { out.push(c); flattenComments(c.replies, out); });
        return out;
    }

    // Same shape as /blogs/admin/dashboard-metrics, built from the list endpoints.
    // MdBlog's metrics SQL fails under MySQL's default ONLY_FULL_GROUP_BY mode.
    async function computeMetrics() {
        const res = await Promise.all([
            list('blogs/posts'),
            list('blogs/comments').catch(() => []),
            list('blogs/reports').catch(() => []),
            categories().catch(() => [])
        ]);
        const posts = res[0];
        const comments = flattenComments(res[1], []);
        const reports = res[2];
        const cats = res[3];
        const views = (p) => Number(p.viewCount != null ? p.viewCount : p.views) || 0;
        const published = posts.filter((p) => p.status === 'published');

        const topCategories = cats.map((c) => {
            const own = posts.filter((p) => String(p.categoryId) === c.id);
            return { name: c.name, postCount: own.length, viewCount: own.reduce((n, p) => n + views(p), 0) };
        }).sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

        const since = Date.now() - 120 * 86400000;
        const fmtDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });
        const byDay = {};
        published.forEach((p) => {
            const d = p.publishedAt ? new Date(String(p.publishedAt).replace(' ', 'T')) : null;
            if (!d || isNaN(d.getTime()) || d.getTime() < since) return;
            const key = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
            if (!byDay[key]) byDay[key] = { label: fmtDay.format(d), postCount: 0, views: 0 };
            byDay[key].postCount += 1;
            byDay[key].views += views(p);
        });
        const trend = Object.keys(byDay).sort().map((k) => byDay[k]);

        return {
            cards: {
                totalViews: published.reduce((n, p) => n + views(p), 0),
                totalArticles: posts.length,
                totalComments: comments.length,
                totalTaxonomies: cats.length,
                pendingComments: comments.filter((c) => c.status === 'pending').length,
                pendingReports: reports.filter((r) => r.status === 'pending').length
            },
            topCategories: topCategories,
            trend: trend,
            computed: true
        };
    }

    let metricsPromise = null;
    function metrics() {
        if (!metricsPromise) {
            metricsPromise = api.get('blogs/admin/dashboard-metrics').catch((err) => {
                if (err.code === '1204') throw err;   // permission problem: report it
                return computeMetrics();
            });
            metricsPromise.catch(() => { metricsPromise = null; });
        }
        return metricsPromise;
    }

    /* ---------- formatting ---------- */
    const STATUS_LABELS = {
        published: 'Published', draft: 'Draft', pending: 'Pending', scheduled: 'Scheduled',
        private: 'Private', archived: 'Archived', approved: 'Approved', spam: 'Spam',
        deleted: 'Deleted', reviewed: 'Reviewed', dismissed: 'Dismissed', action_taken: 'Action taken',
        isActive: 'Active', isNotActive: 'Inactive'
    };
    const STATUS_TONE = {
        published: 'good', approved: 'good', action_taken: 'good', isActive: 'good',
        pending: 'warn', scheduled: 'info', reviewed: 'info', private: 'info',
        spam: 'bad', deleted: 'bad',
        draft: 'muted', archived: 'muted', dismissed: 'muted', isNotActive: 'muted'
    };
    function badge(status) {
        const s = String(status || 'draft');
        return '<span class="st-badge st-badge--' + (STATUS_TONE[s] || 'muted') + '">' + esc(STATUS_LABELS[s] || s.replace(/_/g, ' ')) + '</span>';
    }

    function slugify(text) {
        return plain(text).toLowerCase()
            .normalize('NFKD').replace(/[̀-ͯ]/g, '')
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 120);
    }

    function bytes(n) {
        n = Number(n) || 0;
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
        return (n / 1048576).toFixed(1) + ' MB';
    }

    const pad = (n) => String(n).padStart(2, '0');
    // "2026-10-22 14:05:00" <-> "2026-10-22T14:05" (datetime-local input)
    function toLocalInput(v) {
        const d = v ? new Date(String(v).replace(' ', 'T')) : new Date();
        if (isNaN(d.getTime())) return '';
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function fromLocalInput(v) {
        return v ? v.replace('T', ' ') + ':00' : '';
    }
    function nowSql() {
        return fromLocalInput(toLocalInput());
    }

    // Article bodies may be stored entity-encoded and with ![alt](file) image markers.
    function contentForEditor(html, postId) {
        let src = String(html || '');
        if (src.indexOf('<') === -1 && /&lt;\w/.test(src)) {
            const ta = document.createElement('textarea');
            ta.innerHTML = src;
            src = ta.value;
        }
        return src.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, file) => {
            const clean = file.replace(/["'<>]/g, '');
            const full = /^(https?:)?\/\//i.test(clean) ? clean
                : url.media(clean.indexOf('/') !== -1 ? clean : 'storage/uploads/blogs/post_' + postId + '/' + clean);
            return '<img src="' + esc(full) + '" alt="' + esc(alt) + '">';
        });
    }

    /* ---------- dialogs ---------- */
    function confirmDialog(opts) {
        opts = opts || {};
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'tb-modal';
            modal.innerHTML =
                '<div class="tb-modal__backdrop" data-st-cancel></div>' +
                '<div class="tb-modal__panel st-confirm" role="alertdialog" aria-modal="true" aria-labelledby="st-confirm-title">' +
                '<span class="st-confirm__icon' + (opts.danger ? ' is-danger' : '') + '">' + icon(opts.danger ? 'trash' : 'alert') + '</span>' +
                '<h2 class="tb-modal__title" id="st-confirm-title" style="padding:0">' + esc(opts.title || 'Are you sure?') + '</h2>' +
                (opts.text ? '<p class="tb-modal__text">' + esc(opts.text) + '</p>' : '') +
                '<div class="tb-modal__actions" style="margin-top:22px">' +
                '<button class="tb-btn tb-btn--ghost" type="button" data-st-cancel>' + esc(opts.cancelLabel || 'Cancel') + '</button>' +
                '<button class="tb-btn ' + (opts.danger ? 'st-btn--danger' : 'tb-btn--accent') + '" type="button" data-st-ok>' + esc(opts.confirmLabel || 'Confirm') + '</button>' +
                '</div></div>';
            document.body.appendChild(modal);
            document.body.classList.add('tb-lock');
            const done = (value) => {
                document.removeEventListener('keydown', onKey);
                modal.remove();
                if (!$('.tb-modal:not([hidden])')) document.body.classList.remove('tb-lock');
                resolve(value);
            };
            const onKey = (e) => { if (e.key === 'Escape') done(false); };
            document.addEventListener('keydown', onKey);
            modal.addEventListener('click', (e) => {
                if (e.target.closest('[data-st-ok]')) done(true);
                else if (e.target.closest('[data-st-cancel]')) done(false);
            });
            modal.querySelector('[data-st-ok]').focus();
        });
    }

    // Disables a button and shows progress text while an async task runs.
    async function busy(btn, label, task) {
        const original = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="st-spinner" aria-hidden="true"></span>' + esc(label || 'Saving…'); }
        try { return await task(); } finally { if (btn) { btn.disabled = false; btn.innerHTML = original; } }
    }

    function emptyRow(cols, title, text) {
        return '<tr class="st-table__empty"><td colspan="' + cols + '">' + TB.state('empty', title, text) + '</td></tr>';
    }

    function skeletonRows(cols, n) {
        let out = '';
        for (let i = 0; i < (n || 5); i++) {
            out += '<tr>' + Array.from({ length: cols }, (_, c) => '<td><div class="tb-skel tb-skel--line" style="width:' + (c === 0 ? 70 : 40 + ((i * 13 + c * 7) % 40)) + '%"></div></td>').join('') + '</tr>';
        }
        return out;
    }

    /* ---------- shell ---------- */
    async function initShell() {
        const app = $('[data-st-app]');
        if (!app) return;

        $$('[data-st-nav]').forEach((a) => {
            const view = a.getAttribute('data-st-nav');
            const here = window.location.pathname.toLowerCase();
            const isEditor = here.endsWith('/studioeditor');
            const match = here.endsWith('/studio' + view.toLowerCase()) || (isEditor && view === 'Posts' && new URLSearchParams(window.location.search).get('id'));
            if (match) { a.classList.add('is-active'); a.setAttribute('aria-current', 'page'); }
        });

        const toggle = $('[data-st-sidebar-toggle]');
        const setOpen = (open) => {
            app.classList.toggle('is-nav-open', open);
            if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.classList.toggle('tb-lock', open);
        };
        if (toggle) toggle.addEventListener('click', () => setOpen(!app.classList.contains('is-nav-open')));
        app.addEventListener('click', (e) => { if (e.target.closest('[data-st-sidebar-close]')) setOpen(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && app.classList.contains('is-nav-open')) setOpen(false); });

        $$('[data-st-signout]').forEach((b) => b.addEventListener('click', async (e) => {
            e.preventDefault();
            const ok = await confirmDialog({ title: 'Sign out of the Studio?', confirmLabel: 'Sign out' });
            if (ok) signOut();
        }));

        // User chip: start with the stored username, then enrich with the blog profile.
        const user = auth.user() || {};
        const chip = $('[data-st-user]');
        const paint = (name, avatarSrc, sub) => {
            if (!chip) return;
            chip.querySelector('[data-st-user-avatar]').innerHTML = TB.avatar(name, avatarSrc, 34);
            chip.querySelector('[data-st-user-name]').textContent = name;
            chip.querySelector('[data-st-user-sub]').textContent = sub;
        };
        paint(user.fullname || user.username || 'Editor', '', user.username ? '@' + user.username : 'Signed in');
        if (user.ltId) {
            try {
                const rec = await TB.data.author(user.ltId);
                if (rec) paint(plain(rec.fullname) || plain(rec.username) || 'Editor', url.media(rec.avatar), rec.username ? '@' + plain(rec.username) : 'Signed in');
            } catch (e) { /* profile is optional */ }
        }

        // Pending counts in the sidebar
        try {
            const m = await metrics();
            const cards = (m && m.cards) || {};
            const setCount = (key, n) => {
                const el = $('[data-st-count="' + key + '"]');
                if (el && n > 0) { el.textContent = n > 99 ? '99+' : n; el.hidden = false; }
            };
            setCount('comments', Number(cards.pendingComments) || 0);
            setCount('reports', Number(cards.pendingReports) || 0);
        } catch (e) { /* counts are optional */ }
    }

    function setTitle(name) {
        const crumb = $('[data-st-crumb]');
        if (crumb) crumb.textContent = name;
        document.title = name + ' · Studio — ' + (TB.config.siteName || '');
    }

    // Only allow redirects back to a path on this site.
    function safeNext(next) {
        return next && next.charAt(0) === '/' && next.charAt(1) !== '/' && next.indexOf('\\') === -1 ? next : '';
    }

    TB.studio = {
        url: studioUrl, loginUrl, requireAuth, signOut, explain, list, categories, metrics, flattenComments, setTitle, safeNext,
        badge, slugify, bytes, toLocalInput, fromLocalInput, nowSql, contentForEditor,
        confirm: confirmDialog, busy, emptyRow, skeletonRows, statusLabel: (s) => STATUS_LABELS[s] || s
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShell);
    else initShell();
})();
