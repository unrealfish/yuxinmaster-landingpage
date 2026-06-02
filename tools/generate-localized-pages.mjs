import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const sourcePath = path.join(root, "index.html");
const source = fs.readFileSync(sourcePath, "utf8");

const i18nMatch = source.match(/const I18N = (\{[\s\S]*?\n    \});/);
if (!i18nMatch) {
  throw new Error("Could not find I18N dictionary in index.html");
}

const context = {};
vm.createContext(context);
vm.runInContext(`I18N = ${i18nMatch[1]};`, context);
const I18N = context.I18N;

const pages = {
  "zh-CN": {
    output: sourcePath,
    path: "/",
    ogLocale: "zh_CN",
    alternateOgLocales: ["zh_TW", "en_US"],
    twitterTitle: "玉心道长｜紫微摘星术"
  },
  en: {
    output: path.join(root, "en", "index.html"),
    path: "/en/",
    ogLocale: "en_US",
    alternateOgLocales: ["zh_CN", "zh_TW"],
    twitterTitle: "Yuxin Master | Zi Wei Star-Picking Art"
  },
  "zh-TW": {
    output: path.join(root, "zh-tw", "index.html"),
    path: "/zh-tw/",
    ogLocale: "zh_TW",
    alternateOgLocales: ["zh_CN", "en_US"],
    twitterTitle: "玉心道長｜紫微摘星術"
  }
};

const siteOrigin = "https://yuxinmaster.site";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceElementText(html, attr, key, value) {
  const pattern = new RegExp(`(<([a-z0-9-]+)(?=[^>]*\\s${attr}="${escapeRegExp(key)}")[^>]*>)([\\s\\S]*?)(<\\/\\2>)`, "gi");
  return html.replace(pattern, `$1${value}$4`);
}

function setMeta(html, selector, value) {
  const pattern = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${value}$2`);
}

function setLink(html, selector, value) {
  const pattern = new RegExp(`(<link\\s+${selector}\\s+href=")[^"]*(")`, "i");
  return html.replace(pattern, `$1${value}$2`);
}

function setJsonLdUrls(html, pageUrl) {
  return html.replace(/"url": "https:\/\/yuxinmaster\.site\/(?:en\/|zh-tw\/)?"/g, `"url": "${pageUrl}"`);
}

function setOgAlternates(html, locales) {
  const replacement = locales.map(locale => `  <meta property="og:locale:alternate" content="${locale}" />`).join("\n");
  return html.replace(/(?:  <meta property="og:locale:alternate" content="[^"]*" \/>\n?)+/, `${replacement}\n`);
}

function localize(lang, config) {
  const t = I18N[lang];
  if (!t) throw new Error(`Missing language dictionary: ${lang}`);

  let html = source;
  const pageUrl = siteOrigin + config.path;
  html = html.replace(/<html lang="[^"]*"(?: data-default-lang="[^"]*")?>/, `<html lang="${t.htmlLang || lang}" data-default-lang="${lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t.title}</title>`);
  html = setMeta(html, 'name="description"', t.description);
  html = setMeta(html, 'name="keywords"', t.keywords);
  html = setMeta(html, 'property="og:title"', t.ogTitle);
  html = setMeta(html, 'property="og:description"', t.ogDescription);
  html = setMeta(html, 'property="og:url"', pageUrl);
  html = setMeta(html, 'property="og:locale"', config.ogLocale);
  html = setOgAlternates(html, config.alternateOgLocales);
  html = setMeta(html, 'name="twitter:title"', config.twitterTitle);
  html = setMeta(html, 'name="twitter:description"', t.ogDescription);
  html = setLink(html, 'rel="canonical"', pageUrl);
  html = setJsonLdUrls(html, pageUrl);

  Object.entries(t).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    html = replaceElementText(html, "data-i18n", key, value);
    html = replaceElementText(html, "data-i18n-html", key, value);
    const altPattern = new RegExp(`(<[^>]+data-i18n-alt="${escapeRegExp(key)}"[^>]*\\salt=")[^"]*(")`, "gi");
    html = html.replace(altPattern, `$1${value}$2`);
  });

  html = html.replace(/<button class="lang-btn(?: active)?" type="button" data-lang="([^"]+)"/g, (_, buttonLang) => {
    const active = buttonLang === lang ? " active" : "";
    return `<button class="lang-btn${active}" type="button" data-lang="${buttonLang}"`;
  });

  fs.mkdirSync(path.dirname(config.output), { recursive: true });
  fs.writeFileSync(config.output, html);
}

Object.entries(pages).forEach(([lang, config]) => localize(lang, config));
