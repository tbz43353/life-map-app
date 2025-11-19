import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Life Map data types
interface Category {
  id: number;
  name: string;
  label: string;
  section: 'top' | 'bottom';
  display_order: number;
  color: 'blue' | 'red';
}

interface TimelineItem {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  // Age-based entry
  start_age?: number;
  end_age?: number | null;
  use_max_age?: boolean;
  // Date-based entry
  input_mode?: 'age' | 'date';
  start_date?: string;
  end_date?: string;
  color: 'blue' | 'red';
}

interface LifeMapData {
  title: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  age_range?: number;
  zoom?: number;
  categories: Category[];
  items: TimelineItem[];
}

// Track all open windows
const windows = new Set<BrowserWindow>();

function createWindow() {
  // Get icon path - use custom icon if available
  // In development, try to load from project root
  // In production, icon is handled by electron-builder
  let iconPath: string | undefined;
  if (!app.isPackaged) {
    const devIconPath = join(__dirname, '..', 'build', 'icons', 'icon.png');
    if (existsSync(devIconPath)) {
      iconPath = devIconPath;
    }
  }
  // In production, electron-builder sets the icon automatically

  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Life Map',
    ...(iconPath && { icon: iconPath }),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Add to windows set
  windows.add(window);

  // Load the app
  // Only open DevTools in development mode (not packaged)
  // Explicitly check if app is packaged - if so, never open DevTools
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    window.loadURL('http://localhost:5174');
    window.webContents.openDevTools();
  } else {
    // In production, files are packaged in app.asar
    // Use app.getAppPath() to get the correct path to the app bundle
    const appPath = app.getAppPath();

    // When packaged, files are in app.asar at the root of the app
    // dist-electron/main.js is at app.asar/dist-electron/main.js
    // dist/index.html is at app.asar/dist/index.html
    const indexPath = join(appPath, 'dist', 'index.html');

    // Explicitly ensure DevTools are closed in production
    window.webContents.once('did-finish-load', () => {
      if (app.isPackaged) {
        window.webContents.closeDevTools();
      }
    });

    window.loadFile(indexPath);
  }

  // Remove from set when closed
  window.on('closed', () => {
    windows.delete(window);
  });

  return window;
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Life Map',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Create a new window
            createWindow();
          },
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Create a new window and trigger open file dialog
            const window = createWindow();
            window.webContents.once('did-finish-load', () => {
              window.webContents.send('menu-open-file');
            });
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-save-file');
            }
          },
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-save-as-file');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-close-file');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-print');
            }
          },
        },
        { type: 'separator' },
        {
          role: 'quit',
          label: 'Quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          },
        },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: 'Services', submenu: [] },
        { type: 'separator' },
        { role: 'hide', label: 'Hide ' + app.getName() },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit ' + app.getName() },
      ],
    });

    // Window menu (index 4 after adding app menu)
    template.push({
      label: 'Window',
      submenu: [
        { role: 'close', label: 'Close' },
        { role: 'minimize', label: 'Minimize' },
        { role: 'zoom', label: 'Zoom' },
        { type: 'separator' },
        { role: 'front', label: 'Bring All to Front' },
      ],
    });

    // Help menu (macOS convention)
    template.push({
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
      ],
    });
  } else {
    // Windows/Linux: Add Help menu
    template.push({
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Set app name - must be called before app.whenReady() for macOS
app.setName('Life Map');

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('read-lifemap-file', async (_event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as LifeMapData;
    return data;
  } catch (error) {
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
});

ipcMain.handle('write-lifemap-file', async (_event, filePath: string, data: LifeMapData) => {
  try {
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to write file: ${(error as Error).message}`);
  }
});

ipcMain.handle('create-new-lifemap', async () => {
  const defaultCategories: Category[] = [
    { id: 1, name: 'projects', label: 'Projects, major hobbies', section: 'top', display_order: 1, color: 'blue' },
    { id: 2, name: 'relationships', label: 'Relationships', section: 'top', display_order: 2, color: 'red' },
    { id: 3, name: 'residences', label: 'Residences', section: 'top', display_order: 3, color: 'blue' },
    { id: 4, name: 'remuneration', label: 'Remuneration', section: 'top', display_order: 4, color: 'red' },
    { id: 5, name: 'inflection_points', label: 'Inflection points', section: 'bottom', display_order: 1, color: 'blue' },
    { id: 6, name: 'key_insights', label: 'Key insights achieved', section: 'bottom', display_order: 2, color: 'red' },
    { id: 7, name: 'specific_goals', label: 'Specific goals', section: 'bottom', display_order: 3, color: 'blue' },
  ];

  return {
    title: 'My Life Map',
    date_of_birth: undefined, // User will set this in project settings
    age_range: 80,
    zoom: 1.0,
    categories: defaultCategories,
    items: [],
  } as LifeMapData;
});

ipcMain.handle('open-file-dialog', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return null;

  const result = await dialog.showOpenDialog(window, {
    filters: [{ name: 'Life Map Files', extensions: ['lifemap'] }],
    title: 'Open Life Map File',
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultName: string) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return null;

  const result = await dialog.showSaveDialog(window, {
    filters: [{ name: 'Life Map Files', extensions: ['lifemap'] }],
    title: 'Save Life Map File',
    defaultPath: defaultName,
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  return result.filePath;
});

ipcMain.handle('print-page', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  // Generate PDF preview first
  const pdfData = await window.webContents.printToPDF({
    printBackground: true,
    landscape: true,
    margins: {
      marginType: 'custom',
      top: 0.25,
      bottom: 0.25,
      left: 0.25,
      right: 0.25,
    },
    pageSize: 'A4',
  });
  
  // Create a preview window to show the PDF with print controls
  const previewWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Print Preview - Life Map',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  
  // Convert PDF buffer to data URL
  const pdfBase64 = pdfData.toString('base64');
  const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;
  
  // Load PDF in preview window
  await previewWindow.loadURL(pdfDataUrl);
  
  // Wait for PDF to load, then inject print controls
  previewWindow.webContents.once('did-finish-load', () => {
    previewWindow.webContents.executeJavaScript(`
      (function() {
        const style = document.createElement('style');
        style.textContent = \`
          body { 
            margin: 0; 
            padding: 0; 
            background: #f0f0f0; 
            overflow: hidden;
          }
          embed {
            width: 100%;
            height: 100vh;
          }
          .print-controls {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            gap: 8px;
          }
          .print-btn, .close-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .print-btn {
            background: #007AFF;
            color: white;
          }
          .print-btn:hover { 
            background: #0056CC; 
            transform: translateY(-1px);
          }
          .close-btn {
            background: #666;
            color: white;
          }
          .close-btn:hover { 
            background: #444; 
            transform: translateY(-1px);
          }
        \`;
        document.head.appendChild(style);
        
        const controls = document.createElement('div');
        controls.className = 'print-controls';
        controls.innerHTML = \`
          <button class="print-btn" onclick="window.print()">Print</button>
          <button class="close-btn" onclick="window.close()">Close</button>
        \`;
        document.body.appendChild(controls);
      })();
    `);
  });
  
  // Focus the preview window
  previewWindow.focus();
});
