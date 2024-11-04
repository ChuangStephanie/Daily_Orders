const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  // win.loadURL('http://localhost:5173'); 
   win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, url) => {
    event.preventDefault();
    mainWindow.loadURL(url);
  });
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
