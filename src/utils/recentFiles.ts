export interface RecentFile {
  path: string;
  title: string;
  lastAccessed: number; // timestamp
}

const STORAGE_KEY = 'lifemap_recent_files';
const MAX_RECENT_FILES = 10;

export const recentFiles = {
  get: (): RecentFile[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const files = JSON.parse(stored) as RecentFile[];
      // Filter out files that no longer exist (we'll check this when displaying)
      return files;
    } catch (error) {
      console.error('Failed to load recent files:', error);
      return [];
    }
  },

  add: (path: string, title: string): void => {
    try {
      const files = recentFiles.get();
      // Remove if already exists
      const filtered = files.filter(f => f.path !== path);
      // Add to front
      const updated = [
        { path, title, lastAccessed: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT_FILES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent file:', error);
    }
  },

  remove: (path: string): void => {
    try {
      const files = recentFiles.get();
      const filtered = files.filter(f => f.path !== path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove recent file:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  },
};

