const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const executableNames = process.platform === "win32"
  ? ["chrome.exe", "chrome"]
  : ["chrome", "chromium", "chromium-browser"];

function isExecutable(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findBrowser(rootPath, depth = 0) {
  if (!rootPath || depth > 5) return null;

  let entries;
  try {
    entries = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isFile() && executableNames.includes(entry.name.toLowerCase())) {
      return entryPath;
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const result = findBrowser(path.join(rootPath, entry.name), depth + 1);
    if (result) return result;
  }

  return null;
}

function resolveBrowserPath() {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH;

  if (configuredPath && isExecutable(configuredPath)) {
    return configuredPath;
  }

  try {
    const puppeteerPath = puppeteer.executablePath();
    if (isExecutable(puppeteerPath)) return puppeteerPath;
  } catch {
    // Continue with application-local and system locations.
  }

  const applicationRoot = path.resolve(__dirname, "../..");
  const candidates = [
    path.join(applicationRoot, "node_modules", ".cache", "puppeteer"),
    path.join(applicationRoot, "node_modules", "puppeteer", ".cache", "puppeteer"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "puppeteer"),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Google", "Chrome", "Application"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application"),
  ];

  for (const candidate of candidates) {
    const result = findBrowser(candidate);
    if (result) return result;
  }

  throw new Error(
    "Chrome/Chromium was not found. Set PUPPETEER_EXECUTABLE_PATH or install it with: " +
      "npx puppeteer browsers install chrome"
  );
}

function launchBrowser() {
  const executablePath = resolveBrowserPath();

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

module.exports = {
  launchBrowser,
  resolveBrowserPath,
};
