import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readLifemapFile: (filePath: string) => ipcRenderer.invoke('read-lifemap-file', filePath),
  writeLifemapFile: (filePath: string, data: any) => ipcRenderer.invoke('write-lifemap-file', filePath, data),
  createNewLifemap: () => ipcRenderer.invoke('create-new-lifemap'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultName: string) => ipcRenderer.invoke('save-file-dialog', defaultName),
  printPage: () => ipcRenderer.invoke('print-page'),
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-file', () => callback('new-file'));
    ipcRenderer.on('menu-open-file', () => callback('open-file'));
    ipcRenderer.on('menu-save-file', () => callback('save-file'));
    ipcRenderer.on('menu-save-as-file', () => callback('save-as-file'));
    ipcRenderer.on('menu-close-file', () => callback('close-file'));
    ipcRenderer.on('menu-print', () => callback('print'));
  },
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-file');
    ipcRenderer.removeAllListeners('menu-open-file');
    ipcRenderer.removeAllListeners('menu-save-file');
    ipcRenderer.removeAllListeners('menu-save-as-file');
    ipcRenderer.removeAllListeners('menu-close-file');
    ipcRenderer.removeAllListeners('menu-print');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      readLifemapFile: (filePath: string) => Promise<any>;
      writeLifemapFile: (filePath: string, data: any) => Promise<{ success: boolean }>;
      createNewLifemap: () => Promise<any>;
      openFileDialog: () => Promise<string | null>;
      saveFileDialog: (defaultName: string) => Promise<string | null>;
      printPage: () => Promise<void>;
      onMenuAction: (callback: (action: string) => void) => void;
      removeMenuListeners: () => void;
    };
  }
}

