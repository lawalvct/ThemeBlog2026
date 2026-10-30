# ThemeBlog2026 — Editorial blog theme for LifeTech OCMS

**Version:** `v1.0.0` · **Package:** `ThemeBlog2026` · **Type:** Theme · **Requires:** [MdBlog](https://github.com/adedayoAdetunji/MdBlog) `2.0.0+` · **Core:** LifeTech OCMS `2.7.4+`

ThemeBlog2026 is an editorial, magazine-style theme that turns the MdBlog module's API into a polished reading experience. MdBlog supplies the posts, categories, authors, comments and reactions; this theme controls how visitors browse and read them.

## Highlights

- **Home** — dated masthead, featured lead story with *Editor's picks*, topic strip, latest stories grid, *Trending now* and *Most read* lists, a row per topic and an explore call-to-action.
- **Stories (archive)** — live search, topic chips, seven sort orders, numbered pagination; filters live in the URL so results can be shared and the Back button works.
- **Post** — long-form layout with drop cap, reading progress bar, sticky table of contents, share rail, cover and gallery with a keyboard-friendly lightbox, code blocks with copy buttons, eight reactions, threaded comments with replies and likes, author card, report dialog and related stories.
- **Topics** and **Category** — every category with story counts and latest titles, plus a filtered, sortable listing per topic.
- **Author** — profile with bio, location, socials, reading stats and all published stories.
- **Site-wide** — sticky header with topics mega-menu, role-aware site menus (from *Menus*), instant search overlay (`/` or `Ctrl+K`), light/dark mode that remembers the reader's choice, mobile drawer, back-to-top, skeleton loaders and friendly empty/error states.
- **Studio (editor admin)** — a separate workspace for editors: dashboard with stats and a publishing chart, post list and a full editor (Quill, cover/gallery uploads, SEO preview, scheduling, featured/menu/comments switches), categories, tags, comment moderation, post reports, blog settings and the editor's own profile and password. See [Studio](#studio).
- **Built to be safe and fast** — no build step and no CSS framework: one stylesheet and one script. Every API value is escaped before rendering and article HTML is sanitised (scripts, event handlers and unsafe URLs are removed). All classes are prefixed `tb-` so the theme never clashes with AppCore or module styles.

## Package structure

```text
ThemeBlog2026/
├── Assets/
│   ├── css/Style.css        Design tokens, layout and components (light + dark)
│   ├── css/Studio.css       Studio dashboard styles (loaded only by Studio layouts)
│   ├── js/Script.js         Shared library: API client, renderers, header, search, lightbox
│   └── js/Studio.js         Studio helpers: guard, sign-out, confirm dialog, badges, shell
├── Components/
│   ├── TopHeader.html       <head>, fonts, styles, runtime config (window.TB_CONFIG)
│   ├── Header.html          Masthead, navigation, mobile drawer, search overlay
│   ├── Footer.html          Footer from Site Settings, closes the document
│   ├── StudioSidebar.html   Studio navigation
│   └── StudioTopbar.html    Studio top bar (menu, theme switch, signed-in editor)
├── Layouts/
│   ├── Default.html         Selected automatically; imports the three public components
│   ├── StudioLayout.html    Sidebar + top bar workspace for the Studio views
│   └── StudioAuthLayout.html Full-screen wrapper for the Studio sign-in view
├── Views/
│   ├── Home.html            /ThemeBlog2026/Home
│   ├── Blog.html            /ThemeBlog2026/Blog?q=&category=&sort=&page=
│   ├── Post.html            /ThemeBlog2026/Post?slug={slug}
│   ├── Topics.html          /ThemeBlog2026/Topics
│   ├── Category.html        /ThemeBlog2026/Category?id={categoryId}
│   ├── Author.html          /ThemeBlog2026/Author?id={userId}
│   └── Studio*.html         Login, Dashboard, Posts, Editor, Categories, Tags,
│                            Comments, Reports, Settings, Profile
├── Storage/Layouts/PendingLayouts.json   Assigns the Studio views to the Studio layouts
├── Export/  ddm/            System-managed records
├── LICENSE
├── README.md
└── package.json
```

`Layouts/Default.html` already calls `dddm::loadDynamicContent()`, so the theme deliberately has **no** `ContentLoadBody` component.

**As the default theme.** When ThemeBlog2026 is set as the site's default theme, AppCore attaches every component marked *Is Theme Default* to pages that have no layout of their own (the site index page, other modules' pages) as loose "regions", in registration order. The theme handles this itself: layouts define `TB_LAYOUT`, and when a page has no layout, `TopHeader.html` renders the whole page (head, header, the page's content in a readable container, footer) while `Header.html`, `Footer.html` and the Studio components skip their own region output. The region order and flags therefore do not matter. To show the blog's home page at the site root, publish `Home.html` to the index page in the backend (Life Page → index page → publish to content).

## Installation

1. Install LifeTech OCMS and the **MdBlog** module (Marketplace → Browse Online, or upload the package).
2. Install ThemeBlog2026 (Packages → Themes Development → Install Theme), or copy this folder to `packages/themes/ThemeBlog2026` and click **Sync Files** in the theme's content area.
3. Check the registered content: `Default.html` as **Layout**; `TopHeader.html`, `Header.html`, `Footer.html` as **Component** with *Is Theme Default* = **No**; the six views as **View**; `Style.css` (`/css`) and `Script.js` (`/js`) as **Asset**.
4. **Publish the public MdBlog routes to the Anonymous role** (see below). Without this every visitor sees *"This content is not available to visitors yet"*.
5. Make sure each view's page and content are published, then preview `/ThemeBlog2026/Home`.

### API routes the theme calls

| Purpose | Method & route | Who needs access |
| --- | --- | --- |
| Post lists, search, pagination | `GET /blogs/filter/posts` | Anonymous + signed-in roles |
| Trending / popular / related | `GET /blogs/posts/widget` | Anonymous + signed-in roles |
| Single post with comments | `GET /blogs/posts/{slug}/slug` | Anonymous + signed-in roles |
| Topics | `GET /blogs/categories` (falls back to `GET /blogs/filter/categories`) | Anonymous + signed-in roles |
| Author profile | `GET /blogs/user/{userId}/record` | Anonymous + signed-in roles |
| View counter | `POST /blogs/posts/view-update` | Anonymous + signed-in roles |
| Report a post | `POST /blogs/reports/create` | Anonymous + signed-in roles |
| React to a post | `POST /blogs/posts/react` | Signed-in roles |
| Comment / reply | `POST /blogs/comments/create` | Signed-in roles |
| Like a comment | `POST /blogs/comments/like` | Signed-in roles |
| Site navigation menus | `GET /menus/is-navigation` | Already public in AppCore |

Readers sign in through MdBlog's own pages (`/MdBlog/Sign-in`, `/MdBlog/Sign-up`). Guests who try to react, reply or like see a sign-in prompt instead.

## Studio

The Studio is the editor side of the theme. It lives at **`/ThemeBlog2026/StudioDashboard`** (there is also a discreet *Studio* link in the public footer).

| View | Route | What it does |
| --- | --- | --- |
| StudioLogin | `/ThemeBlog2026/StudioLogin?next=…` | Signs in with `POST /blogs/auth/signin` (falling back to the core `POST /users/login` for accounts without a blog profile), stores the token, returns to the page that was requested |
| StudioDashboard | `/ThemeBlog2026/StudioDashboard` | Stats, publishing activity chart, top categories, recent posts and comments |
| StudioPosts | `/ThemeBlog2026/StudioPosts` | All posts with status tabs, search, category filter, sort, pagination, delete |
| StudioEditor | `/ThemeBlog2026/StudioEditor` (new) · `?id={postId}` (edit) | Quill editor, slug, excerpt, status and publish date, featured / menu / comments switches, category, reading time, cover & gallery uploads, SEO title/description with a search preview; `Ctrl+S` saves |
| StudioCategories | `/ThemeBlog2026/StudioCategories` | Create, edit, show-in-menus, activate/deactivate, delete |
| StudioTags | `/ThemeBlog2026/StudioTags` | Create, edit (name, slug, colour), activate/deactivate, delete |
| StudioComments | `/ThemeBlog2026/StudioComments` | Approve, unapprove, mark spam, delete (replies included) |
| StudioReports | `/ThemeBlog2026/StudioReports` | Mark reviewed / action taken / dismissed, open the story, delete |
| StudioSettings | `/ThemeBlog2026/StudioSettings` | MdBlog key/value settings: edit values, add, activate/deactivate, delete |
| StudioProfile | `/ThemeBlog2026/StudioProfile` | Name, location, bio, socials, avatar upload, password change |

**Layouts.** `Storage/Layouts/PendingLayouts.json` maps every Studio view to `StudioLayout.html` and the sign-in view to `StudioAuthLayout.html`, so the platform assigns them during **Sync Files** (applied mappings move to `AppliedLayouts.json`). Keep `AppliedLayouts.json` as valid JSON (`[]` when empty): AppCore's sync parses it strictly and skips every mapping if the file is empty. If Studio pages show the public header and look unstyled, the layouts were not applied — run Sync Files again or assign the layouts manually in the theme's layout controls. Studio pages carry `noindex`.

**Access.** Studio pages redirect visitors without a session to the sign-in view before rendering, but real protection comes from **route permissions**: publish the admin routes below only to your editor/admin roles. Keep the Studio view pages themselves public (or at least the sign-in page), otherwise signed-out editors cannot reach the sign-in form.

| Studio feature | Routes to publish to editor roles |
| --- | --- |
| Sign in | `POST /blogs/auth/signin` (must also be open to Anonymous) |
| Dashboard | `GET /blogs/admin/dashboard-metrics` |
| Posts | `GET /blogs/posts`, `POST /blogs/posts`, `PATCH /blogs/posts/{ltId}` (sent as `POST` with `_method=PATCH`), `DELETE /blogs/posts/{ltId}` |
| Categories | `GET/POST /blogs/categories`, `PATCH/DELETE /blogs/categories/{ltId}`, `PATCH /blogs/categories/{ltId}/toggle-active` |
| Tags | `GET/POST /blogs/tags`, `PATCH/DELETE /blogs/tags/{ltId}`, `PATCH /blogs/tags/{ltId}/toggle-active` |
| Comments | `GET /blogs/comments`, `POST /blogs/comments/update-status`, `DELETE /blogs/comments/{ltId}` |
| Reports | `GET /blogs/reports`, `POST /blogs/reports/update-status`, `DELETE /blogs/reports/{ltId}` |
| Settings | `GET/POST /blogs/settings`, `PATCH/DELETE /blogs/settings/{ltId}`, `PATCH /blogs/settings/{ltId}/toggle-active` |
| Profile | `GET /blogs/user/{userId}/record`, `POST /blogs/user/update`, `POST /blogs/user/change-password` |
| Sign out | `POST /users/logout` (optional; the token is cleared locally either way) |

**Editor notes.** The Studio uses **Quill 1.3.7** (the same version as MdBlog's own admin), loaded from cdn.jsdelivr.net, so posts remain editable in either tool. Images pasted or inserted into the body are downscaled to 1600px and sent inline; MdBlog's `processContentBeforeSave()` turns them into files. Uploaded gallery files are sent as `additionalMedia[]`; the first image becomes the story's cover on the public site. Field names match MdBlog's own `Manage-post` form, plus `isFeatured`, `showOnMenu` (documented in the API), `publishedAt` (so published stories get a date — see known issues) and, when creating a post, `author` set to the signed-in editor's account id. `store()` uses `author` before falling back to the PHP session, so `author_id` (a required column) is filled even when the session has no user. Updates never send `author`, so editing someone else's post keeps its original author.

## Customisation

- **Brand colour** — edit `--tb-accent` (and `--tb-accent-hover`, `--tb-accent-soft`) at the top of `Assets/css/Style.css`, and the matching values under `[data-theme="dark"]`.
- **Fonts** — Fraunces (headlines), Source Serif 4 (article body) and Inter (interface) load from Google Fonts in `TopHeader.html`; change the `--tb-font-*` tokens to swap them.
- **Routes** — if you rename a view or give it a prettier route, update `window.TB_CONFIG.routes` in `TopHeader.html`. A route may contain a placeholder, e.g. `post: '/blog/{slug}'`; Post, Category and Author also read `$_GET['slug']` / `$_GET['id']`, so route parameters work.
- **Site details** — logo, name, subtitle, contact details, copyright and social links come from **Site Settings** through the AppCore helpers (`ltSiteName()`, `ltSiteTitle()`, `ltSiteLogoUrl()`, `ltSiteEmail()`, `ltSiteLinkedln()` …). Empty or `#` social links are hidden automatically.

## Testing checklist

- [ ] Home, Stories, Topics, a Category, a Post and an Author page render with real MdBlog data.
- [ ] Search overlay (`/`), archive filters, sort and pagination update the URL and the Back button.
- [ ] A post with several images shows the cover, gallery and lightbox; inline editor images display.
- [ ] Guests see the sign-in prompt; signed-in readers can react, comment, reply and like.
- [ ] Light and dark mode, plus 375px, 768px and desktop widths (no horizontal scrolling).
- [ ] Installation under a subfolder (e.g. `http://localhost/ocms-blog`).
- [ ] Studio: signed-out visits redirect to sign-in and return afterwards; each Studio view uses the Studio layout.
- [ ] Studio: create, edit (including gallery removal) and delete a post; category, tag, comment, report and settings actions; profile and password.

## Known MdBlog 2.0.0 issues (outside this theme)

- **Creating posts fails on MySQL strict mode.** MdBlog's schema gives `tb_blog_post` three columns — `fileSize`, `originalName`, `filename` — that are `NOT NULL` with no default, and `store()` never fills them, so inserts fail with *"Field 'fileSize' doesn't have a default value"*. The Studio shows this error with an explanation. Fix: give the columns defaults (or drop them) in the module.
- `TbBlogPostService::store()` never sets `published_at`, which the public lists sort and date by. The Studio sends `publishedAt`; if the model ignores it, published posts appear undated and last in "latest" order.
- `PATCH /blogs/posts/{ltId}/toggle-active` writes `isActive`/`isNotActive` into the post `status` enum (`draft`, `published`, …). The Studio does not use it; change status in the editor instead.
- `GET /blogs/posts` returns all posts unpaginated and answers "no posts" with `responseCategory: 100`; the Studio treats that as an empty list.
- `TbBlogSettingService::store()` reads `settingName`, but the column is `setting_key`, so adding settings may fail server-side. Editing existing values works.
- `TbBlogCommentService::create()` contains `return $this->userId;` before the insert, so new comments are not saved until that line is removed. The theme shows the server's error message when this happens.
- `TbBlogUserService::userRecord()` loads comments for a hard-coded user ID, so the Author page shows only stories, not comments.
- `comment_count` on posts is never updated, so the "Most discussed" sort has no effect.
- `GET /blogs/admin/dashboard-metrics` fails under MySQL's default `ONLY_FULL_GROUP_BY` mode (its trend query groups by `DATE(published_at)` but selects `published_at`). The Studio dashboard falls back to computing the same figures from the post, comment, report and category lists.
- The post model writes the `allowComments` form value straight into the integer `allow_comments` column, so a checkbox's `'on'` is rejected in strict mode (MdBlog's own Manage-post form sends `'on'`). The Studio sends `1`/`0`.
- `POST /blogs/auth/signin` only accepts accounts that already have a `tb_blog_user` profile. The Studio sign-in falls back to the core `POST /users/login` for other OCMS accounts.
- MdBlog creates a missing blog profile in `userRecord()`, but the insert omits `fullname`, which is `NOT NULL` without a default, so it fails with *"Failed to update user"*. Until fixed, posts by such accounts show no author name (the theme shows "Editorial team").
- AppCore's `POST /users/login` response includes the account's password hash and salt. The Studio never stores them, but the core should not return them.

## Packaging notes

- The backend export copies `package.json` as-is, and a fresh OCMS stores it in `tb_package`: keep `description` at **300 characters or fewer** and `readme` at **160 or fewer**, or installation fails with *"Data too long for column 'description'"*.
- Install **MdBlog** on the target site before this theme (it is listed in `dependsOn`).
- Layout assignments travel with the package (`themeLayout` in `Export/page.json`); role permissions do not, so grant the routes and pages listed under [Studio](#studio) on each new site.
- When the theme is the default theme on the exporting site, the export also contains region rows for other packages' pages (`Export/pageContent.json`). They refer to page IDs that do not exist on other sites and are ignored there.

## Changelog

- **v1.0.0** — First release.

## License

MIT — see [LICENSE](LICENSE).
