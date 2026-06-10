import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

const readFile = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, "utf8");
};

const normalizeRoute = (value) => {
  if (!value) return "/";
  if (value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const extractIds = (content) => {
  const ids = new Set();

  const jsxIdRegex = /\bid\s*=\s*["']([^"']+)["']/g;
  for (const match of content.matchAll(jsxIdRegex)) {
    ids.add(match[1]);
  }

  const bodyIdRegex = /\bid\s*:\s*["']([^"']+)["']/g;
  for (const match of content.matchAll(bodyIdRegex)) {
    ids.add(match[1]);
  }

  return ids;
};

const lineFromIndex = (content, index) => {
  const before = content.slice(0, index);
  return before.split(/\r\n|\n/).length;
};

const extractMenuTargets = (content) => {
  const targets = [];

  const linkRegex = /<Link\b[^>]*\bto=["']([^"']+)["'][^>]*>/g;
  for (const match of content.matchAll(linkRegex)) {
    targets.push({ type: "Link", value: match[1], index: match.index ?? 0 });
  }

  const anchorRegex = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/g;
  for (const match of content.matchAll(anchorRegex)) {
    targets.push({ type: "a", value: match[1], index: match.index ?? 0 });
  }

  return targets;
};

const resolveTarget = (rawValue, sourceRoute) => {
  const value = rawValue.trim();

  if (!value || value === "#") return null;
  if (/^(mailto:|tel:|https?:|\/\/)/i.test(value)) return null;

  if (value.startsWith("#")) {
    return {
      route: sourceRoute,
      hash: decodeURIComponent(value.slice(1)).trim(),
    };
  }

  if (!value.startsWith("/")) return null;

  const [routeWithQuery, hashPart = ""] = value.split("#");
  const routePath = routeWithQuery.split("?")[0] || "/";

  return {
    route: normalizeRoute(routePath),
    hash: decodeURIComponent(hashPart).trim(),
  };
};

const routeContexts = {
  "/": [
    "apps/web/src/pages/Home.tsx",
    "apps/web/src/components/pages/HomeContent.tsx",
    "apps/web/src/modules/public-site/sections/HomeHeroSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeServicesSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeMembershipSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeAboutSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeProductsSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeTestimonialsSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeCtaSection.tsx",
    "apps/web/src/modules/footer/components/PublicSiteFooter.tsx",
    "apps/web/src/modules/menu/components/PublicMenu.tsx",
  ],
  "/assinaturas": [
    "apps/web/src/pages/Assinaturas.tsx",
    "apps/web/src/components/pages/AssinaturasContent.tsx",
    "apps/web/src/modules/public-site/sections/AssinaturasHeroSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeMembershipSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeAboutSection.tsx",
    "apps/web/src/modules/public-site/sections/HomeTestimonialsSection.tsx",
    "apps/web/src/modules/footer/components/PublicSiteFooter.tsx",
    "apps/web/src/modules/menu/components/PublicMenu.tsx",
  ],
  "/franquias": [
    "apps/web/src/pages/Franquias.tsx",
    "apps/web/src/components/pages/FranquiasContent.tsx",
    "apps/web/src/modules/public-site/sections/FranquiasHeroSection.tsx",
    "apps/web/src/modules/public-site/sections/FranquiasVisionSection.tsx",
    "apps/web/src/modules/public-site/sections/FranquiasModelsSection.tsx",
    "apps/web/src/modules/public-site/sections/FranquiasContactSection.tsx",
    "apps/web/src/modules/footer/components/PublicSiteFooter.tsx",
    "apps/web/src/modules/menu/components/FranquiasMenu.tsx",
  ],
  "/admin": ["apps/web/src/components/pages/AdminContent.tsx"],
  "/db-console": ["apps/web/src/pages/DbConsole.tsx"],
};

const routeAnchors = new Map();
for (const [route, files] of Object.entries(routeContexts)) {
  const ids = new Set();
  for (const relativePath of files) {
    const content = readFile(relativePath);
    for (const id of extractIds(content)) {
      ids.add(id);
    }
  }
  routeAnchors.set(route, ids);
}

const menuSources = [
  { file: "apps/web/src/modules/menu/components/PublicMenu.tsx", sourceRoute: "/" },
  { file: "apps/web/src/modules/menu/components/FranquiasMenu.tsx", sourceRoute: "/franquias" },
];

const results = [];
let failures = 0;

for (const source of menuSources) {
  const content = readFile(source.file);
  const targets = extractMenuTargets(content);

  for (const target of targets) {
    const resolved = resolveTarget(target.value, source.sourceRoute);
    if (!resolved) continue;

    const line = lineFromIndex(content, target.index);
    const knownRoute = routeAnchors.has(resolved.route);

    if (!knownRoute) {
      failures += 1;
      results.push({
        status: "FAIL",
        file: source.file,
        line,
        source: target.value,
        detail: `Rota alvo nao mapeada: ${resolved.route}`,
      });
      continue;
    }

    if (!resolved.hash) {
      results.push({
        status: "PASS",
        file: source.file,
        line,
        source: target.value,
        detail: `Rota valida: ${resolved.route}`,
      });
      continue;
    }

    const ids = routeAnchors.get(resolved.route) ?? new Set();
    if (ids.has(resolved.hash)) {
      results.push({
        status: "PASS",
        file: source.file,
        line,
        source: target.value,
        detail: `Ancora encontrada em ${resolved.route}: #${resolved.hash}`,
      });
    } else {
      failures += 1;
      results.push({
        status: "FAIL",
        file: source.file,
        line,
        source: target.value,
        detail: `Ancora nao encontrada em ${resolved.route}: #${resolved.hash}`,
      });
    }
  }
}

const counts = results.reduce(
  (acc, item) => {
    acc[item.status] += 1;
    return acc;
  },
  { PASS: 0, FAIL: 0 }
);

console.log("MENU_TARGETS_CHECK");
console.log(`PASS=${counts.PASS} FAIL=${counts.FAIL}`);
for (const result of results) {
  console.log(
    `[${result.status}] ${result.file}:${result.line} :: ${result.source} -> ${result.detail}`
  );
}

if (failures > 0) {
  process.exitCode = 1;
}
