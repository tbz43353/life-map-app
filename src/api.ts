import { LifeMap, Category } from './types';
import { recentFiles } from './utils/recentFiles';

// Electron API types matching main process
interface LifeMapDataItem {
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
  items: LifeMapDataItem[];
}

function fromElectronData(data: LifeMapData): LifeMap {
  return {
    title: data.title,
    date_of_birth: data.date_of_birth,
    age_range: data.age_range,
    zoom: data.zoom ?? 1.0,
    categories: data.categories.map(cat => ({
      ...cat,
      section: cat.section as 'top' | 'bottom',
      color: cat.color as 'blue' | 'red',
    })),
    items: data.items.map(item => ({
      id: item.id,
      category_id: item.category_id,
      title: item.title,
      description: item.description ?? undefined,
      start_age: item.start_age,
      end_age: item.end_age ?? undefined,
      use_max_age: item.use_max_age,
      input_mode: item.input_mode,
      start_date: item.start_date,
      end_date: item.end_date,
      color: item.color as 'blue' | 'red',
      category: data.categories.find(c => c.id === item.category_id),
    })),
  };
}

export const fileAPI = {
  openFile: async (): Promise<{ lifeMap: LifeMap; filePath: string }> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    const filePath = await window.electronAPI.openFileDialog();
    
    if (!filePath) {
      throw new Error('No file selected');
    }
    
    const data = await window.electronAPI.readLifemapFile(filePath);
    const lifeMap = fromElectronData(data);
    // Track in recent files
    recentFiles.add(filePath, lifeMap.title);
    return { lifeMap, filePath };
  },

  openFileByPath: async (filePath: string): Promise<{ lifeMap: LifeMap; filePath: string }> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    const data = await window.electronAPI.readLifemapFile(filePath);
    const lifeMap = fromElectronData(data);
    // Track in recent files
    recentFiles.add(filePath, lifeMap.title);
    return { lifeMap, filePath };
  },

  saveFile: async (lifeMap: LifeMap, filePath?: string): Promise<string> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    let path: string | null = filePath || null;
    
    if (!path) {
      const defaultName = `${lifeMap.title.replace(/[^a-z0-9]/gi, '_')}.lifemap`;
      const selectedPath = await window.electronAPI.saveFileDialog(defaultName);
      
      if (!selectedPath) {
        throw new Error('No file selected');
      }
      
      path = selectedPath;
    }
    
    if (!path) {
      throw new Error('No file path provided');
    }
    
    const data: LifeMapData = {
      title: lifeMap.title,
      date_of_birth: lifeMap.date_of_birth,
      age_range: lifeMap.age_range,
      zoom: lifeMap.zoom ?? 1.0,
      categories: lifeMap.categories,
      items: lifeMap.items.map(item => ({
        id: item.id,
        category_id: item.category_id,
        title: item.title,
        description: item.description ?? null,
        start_age: item.start_age,
        end_age: item.end_age ?? null,
        use_max_age: item.use_max_age,
        input_mode: item.input_mode,
        start_date: item.start_date,
        end_date: item.end_date,
        color: item.color,
      })),
    };
    
    await window.electronAPI.writeLifemapFile(path, data);
    // Track in recent files
    recentFiles.add(path, lifeMap.title);
    return path;
  },

  createNew: async (): Promise<LifeMap> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    const data = await window.electronAPI.createNewLifemap();
    return fromElectronData(data);
  },

  printPage: async (): Promise<void> => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    await window.electronAPI.printPage();
  },
};

// Helper functions for managing the current file path
let currentFilePath: string | null = null;

export const setCurrentFilePath = (path: string | null) => {
  currentFilePath = path;
};

export const getCurrentFilePath = () => currentFilePath;

