import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = "/Volumes/UnrealData/Code/yuxin_uni/pages/legal";
const siteOrigin = "https://yuxinmaster.site";

const languages = {
  "zh-CN": {
    source: "zh-Hans",
    dir: "",
    htmlLang: "zh-CN",
    home: "/",
    brand: "玉心道长",
    brandSub: "紫微摘星术",
    allDocs: "合规信息",
    backHome: "返回首页",
    updatedPrefix: "来源：玉心道长应用合规文档",
    footerBrand: "玉心道长版权所有",
    sentenceEnd: "。",
    nav: {
      legal: "法律信息",
      terms: "服务条款",
      privacy: "隐私政策",
      refund: "退款政策",
      copyright: "DMCA 与版权",
      disclaimer: "免责声明"
    }
  },
  "zh-TW": {
    source: "zh-Hant",
    dir: "zh-tw",
    htmlLang: "zh-TW",
    home: "/zh-tw/",
    brand: "玉心道長",
    brandSub: "紫微摘星術",
    allDocs: "合規資訊",
    backHome: "返回首頁",
    updatedPrefix: "來源：玉心道長應用合規文件",
    footerBrand: "玉心道長版權所有",
    sentenceEnd: "。",
    nav: {
      legal: "法律資訊",
      terms: "服務條款",
      privacy: "隱私政策",
      refund: "退款政策",
      copyright: "DMCA 與版權",
      disclaimer: "免責聲明"
    }
  },
  en: {
    source: "en",
    dir: "en",
    htmlLang: "en",
    home: "/en/",
    brand: "Yuxin Master",
    brandSub: "Zi Wei Star-Picking Art",
    allDocs: "Compliance",
    backHome: "Back home",
    updatedPrefix: "Source: Yuxin Master app compliance documents",
    footerBrand: "Yuxin Master. All rights reserved.",
    sentenceEnd: ".",
    nav: {
      legal: "Legal Information",
      terms: "Terms",
      privacy: "Privacy Policy",
      refund: "Refund Policy",
      copyright: "DMCA & Copyright",
      disclaimer: "Disclaimer"
    }
  }
};

const docs = [
  { key: "legal", source: "legal.vue", slug: "legal" },
  { key: "terms", source: "terms-of-service.vue", slug: "terms-of-service" },
  { key: "privacy", source: "privacy-statement.vue", slug: "privacy-statement" },
  { key: "refund", source: "refund-policy.vue", slug: "refund-policy" },
  { key: "copyright", source: "DMCA-and-Copyright-notice.vue", slug: "dmca-copyright-notice" },
  { key: "disclaimer", source: "disclaimer.vue", slug: "disclaimer" }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function route(lang, slug) {
  const prefix = languages[lang].dir ? `/${languages[lang].dir}` : "";
  return `${prefix}/legal/${slug}/`;
}

function extractActiveTemplate(source) {
  const matches = [...source.matchAll(/<template>([\s\S]*?)<\/template>/g)];
  if (!matches.length) throw new Error("No template block found");
  return matches[matches.length - 1][1];
}

function removeBlockByClass(markup, className) {
  const lines = markup.split("\n");
  const output = [];
  let skipping = false;
  let depth = 0;

  for (const line of lines) {
    if (!skipping && line.includes(`class="${className}`)) {
      skipping = true;
      depth = (line.match(/<view\b/g) || []).length - (line.match(/<\/view>/g) || []).length;
      if (depth <= 0) skipping = false;
      continue;
    }

    if (skipping) {
      depth += (line.match(/<view\b/g) || []).length;
      depth -= (line.match(/<\/view>/g) || []).length;
      if (depth <= 0) skipping = false;
      continue;
    }

    output.push(line);
  }

  return output.join("\n");
}

function convertTemplateToHtml(source) {
  let content = extractActiveTemplate(source);
  content = removeBlockByClass(content, "language-switch");
  content = removeBlockByClass(content, "language-picker-wrap");
  content = content
    .replace(/<view\b/g, "<div")
    .replace(/<\/view>/g, "</div>")
    .replace(/\s+@[a-zA-Z:-]+="[^"]*"/g, "")
    .replace(/\s+:[a-zA-Z:-]+="[^"]*"/g, "")
    .replace(/\s+style="font-weight:\s*bold"/g, ' class="content-paragraph emphasis"')
    .replace(/<div class="content-paragraph">\s*-\s*/g, '<div class="content-paragraph bullet">');

  return content.trim();
}

function getTitle(content, fallback) {
  const match = content.match(/<div class="(?:agreement-title|privacy-title)">([\s\S]*?)<\/div>/);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : fallback;
}

function page(lang, doc, content) {
  const locale = languages[lang];
  const title = getTitle(content, locale.nav[doc.key]);
  const url = `${siteOrigin}${route(lang, doc.slug)}`;
  const languageLinks = Object.keys(languages)
    .map((code) => `<a${code === lang ? ' aria-current="page"' : ""} href="${route(code, doc.slug)}">${code === "zh-CN" ? "简体中文" : code === "zh-TW" ? "繁體中文" : "English"}</a>`)
    .join("");
  const docLinks = docs
    .map((item) => `<a${item.key === doc.key ? ' aria-current="page"' : ""} href="${route(lang, item.slug)}">${locale.nav[item.key]}</a>`)
    .join("");

  return `<!doctype html>
<html lang="${locale.htmlLang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | ${escapeHtml(locale.brand)}</title>
  <meta name="description" content="${escapeHtml(title)} - ${escapeHtml(locale.updatedPrefix)}${locale.sentenceEnd}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="zh-CN" href="${siteOrigin}${route("zh-CN", doc.slug)}" />
  <link rel="alternate" hreflang="zh-TW" href="${siteOrigin}${route("zh-TW", doc.slug)}" />
  <link rel="alternate" hreflang="en" href="${siteOrigin}${route("en", doc.slug)}" />
  <link rel="alternate" hreflang="x-default" href="${siteOrigin}${route("zh-CN", doc.slug)}" />
  <meta property="og:title" content="${escapeHtml(title)} | ${escapeHtml(locale.brand)}" />
  <meta property="og:description" content="${escapeHtml(locale.updatedPrefix)}${locale.sentenceEnd}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="玉心道长 Yuxin Master" />
  <meta property="og:image" content="${siteOrigin}/logo.png" />
  <link rel="icon" href="/favicon/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
  <style>
    :root {
      --bg: #07030f;
      --panel: rgba(255, 255, 255, .075);
      --panel-strong: rgba(255, 247, 230, .94);
      --ink: #2b193f;
      --paper: #fff7e6;
      --muted: rgba(255, 247, 230, .68);
      --line: rgba(243, 211, 138, .22);
      --gold: #f3d38a;
      --max: 980px;
    }
    * { box-sizing: border-box; }
    html { background: var(--bg); scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--paper);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
      background:
        radial-gradient(circle at 60% -10%, rgba(86, 50, 156, .36), transparent 31%),
        linear-gradient(180deg, #07030f 0%, #0c0418 100%);
      line-height: 1.8;
    }
    a { color: inherit; text-decoration: none; }
    .container { width: min(100% - 40px, var(--max)); margin: 0 auto; }
    .legal-nav {
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid rgba(243, 211, 138, .14);
      background: rgba(14, 7, 28, .82);
      backdrop-filter: blur(18px);
    }
    .legal-nav-inner {
      width: min(100% - 40px, 1120px);
      margin: 0 auto;
      min-height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 42px; height: 42px; border-radius: 50%; object-fit: contain; box-shadow: 0 0 20px rgba(243,211,138,.24); }
    .brand strong { display: block; font-size: 16px; letter-spacing: .08em; }
    .brand span { display: block; color: rgba(255,247,230,.52); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
    .home-link { color: var(--gold); font-size: 14px; white-space: nowrap; }
    .hero { padding: 72px 0 24px; }
    .eyebrow { margin: 0 0 12px; color: var(--gold); font-size: 13px; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 6vw, 64px); line-height: 1.05; letter-spacing: 0; }
    .meta { margin: 18px 0 0; color: var(--muted); }
    .language-links, .doc-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }
    .language-links a, .doc-links a {
      border: 1px solid rgba(243, 211, 138, .22);
      border-radius: 999px;
      padding: 7px 12px;
      color: rgba(255,247,230,.72);
      background: rgba(255,255,255,.055);
      font-size: 13px;
    }
    .language-links a[aria-current="page"], .doc-links a[aria-current="page"] {
      color: #2b193f;
      border-color: rgba(243, 211, 138, .8);
      background: var(--gold);
    }
    .document {
      margin: 28px auto 70px;
      padding: clamp(24px, 5vw, 54px);
      border: 1px solid rgba(243, 211, 138, .18);
      border-radius: 8px;
      background: var(--panel-strong);
      color: var(--ink);
      box-shadow: 0 24px 80px rgba(0,0,0,.32);
    }
    .agreement-container, .privacy-container { max-width: none; }
    .agreement-title, .privacy-title { display: none; }
    .agreement-content, .privacy-content { display: grid; gap: 12px; }
    .content-paragraph { margin: 0; font-size: 16px; }
    .title-level-1 {
      margin-top: 24px;
      color: #4b2a5f;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.35;
    }
    .title-level-2 {
      margin-top: 12px;
      color: #5b3670;
      font-size: 18px;
      font-weight: 750;
    }
    .emphasis { font-weight: 800; }
    .bullet { padding-left: 1.2em; text-indent: -1.2em; }
    .site-footer {
      border-top: 1px solid rgba(243, 211, 138, .13);
      padding: 34px 0 42px;
      color: rgba(255,247,230,.55);
      font-size: 14px;
    }
    @media (max-width: 680px) {
      .legal-nav-inner { align-items: flex-start; flex-direction: column; padding: 14px 0; gap: 10px; }
      .hero { padding-top: 46px; }
      .document { margin-bottom: 46px; }
    }
  </style>
</head>
<body>
  <nav class="legal-nav">
    <div class="legal-nav-inner">
      <a class="brand" href="${locale.home}" aria-label="${escapeHtml(locale.backHome)}">
        <img src="/logo.png" alt="" />
        <span><strong>${escapeHtml(locale.brand)}</strong><span>${escapeHtml(locale.brandSub)}</span></span>
      </a>
      <a class="home-link" href="${locale.home}">${escapeHtml(locale.backHome)}</a>
    </div>
  </nav>
  <header class="hero">
    <div class="container">
      <p class="eyebrow">${escapeHtml(locale.allDocs)}</p>
      <h1>${title}</h1>
      <p class="meta">${escapeHtml(locale.updatedPrefix)}</p>
      <div class="language-links" aria-label="Language versions">${languageLinks}</div>
      <div class="doc-links" aria-label="Compliance documents">${docLinks}</div>
    </div>
  </header>
  <main class="container">
    <article class="document">
${content}
    </article>
  </main>
  <footer class="site-footer">
    <div class="container">© <span id="year"></span> ${escapeHtml(locale.footerBrand)}</div>
  </footer>
  <script>document.getElementById("year").textContent = new Date().getFullYear();</script>
</body>
</html>
`;
}

for (const [lang, locale] of Object.entries(languages)) {
  for (const doc of docs) {
    const sourcePath = path.join(sourceRoot, locale.source, doc.source);
    const source = fs.readFileSync(sourcePath, "utf8");
    const content = convertTemplateToHtml(source);
    const outputDir = path.join(root, locale.dir, "legal", doc.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, "index.html"), page(lang, doc, content));
  }
}
