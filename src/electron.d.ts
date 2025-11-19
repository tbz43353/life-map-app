// Type definitions for Electron API exposed via preload script
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

export {};

