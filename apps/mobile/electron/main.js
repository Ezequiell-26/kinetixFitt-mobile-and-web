/**
 * Electron shell — KINETIXFITT desktop (Windows/Mac/Linux).
 *
 * Loads the configured HTTPS deployment and keeps external destinations in
 * the system browser. Node integration remains disabled and renderer
 * navigation is restricted to the configured application origin.
 */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const APP_URL =
  process.env.KINETIXFITT_APP_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://app.kinetixfitt.com");

let APP_ORIGIN;
try {
  const parsed = new URL(APP_URL);
  if (!(parsed.protocol === "https:" || (parsed.protocol === "http:" && parsed.hostname === "localhost"))) {
    throw new Error("KINETIXFITT_APP_URL must be HTTPS outside localhost");
  }
  APP_ORIGIN = parsed.origin;
} catch (error) {
  throw new Error(`Invalid KINETIXFITT_APP_URL: ${error instanceof Error ? error.message : "unknown error"}`);
}

function isAllowedUrl(rawUrl) {
  try {
    return new URL(rawUrl).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 640,
    backgroundColor: "#080808",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../public/icons/icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => undefined);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedUrl(url)) {
      shell.openExternal(url).catch(() => undefined);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  win.loadURL(APP_URL);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error("[Electron] startup failed", error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
