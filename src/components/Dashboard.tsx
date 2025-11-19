import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileAPI, setCurrentFilePath } from '../api';
import { recentFiles, RecentFile } from '../utils/recentFiles';

export default function Dashboard() {
  console.log('Dashboard component rendering');
  console.log('Dashboard: window.electronAPI:', window.electronAPI);
  const navigate = useNavigate();
  const [recentFilesList, setRecentFilesList] = useState<RecentFile[]>([]);

  const handleOpenFile = async () => {
    try {
      const { lifeMap, filePath } = await fileAPI.openFile();
      setCurrentFilePath(filePath);
      // Store life map data temporarily - we'll pass it via state
      navigate('/life-map', { state: { lifeMap, filePath } });
      // Refresh recent files list
      setRecentFilesList(recentFiles.get());
    } catch (error) {
      console.error('Failed to open file:', error);
      alert('Failed to open file: ' + (error as Error).message);
    }
  };

  const handleOpenRecentFile = async (filePath: string) => {
    try {
      const { lifeMap, filePath: openedPath } = await fileAPI.openFileByPath(filePath);
      setCurrentFilePath(openedPath);
      navigate('/life-map', { state: { lifeMap, filePath: openedPath } });
      // Refresh recent files list
      setRecentFilesList(recentFiles.get());
    } catch (error) {
      console.error('Failed to open recent file:', error);
      alert('Failed to open file: ' + (error as Error).message);
      // Remove from recent files if it no longer exists
      recentFiles.remove(filePath);
      setRecentFilesList(recentFiles.get());
    }
  };

  const handleRemoveRecentFile = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    recentFiles.remove(filePath);
    setRecentFilesList(recentFiles.get());
  };

  const handleNewFile = async () => {
    try {
      const lifeMap = await fileAPI.createNew();
      setCurrentFilePath(null);
      navigate('/life-map', { state: { lifeMap, showSettings: true } });
    } catch (error) {
      console.error('Failed to create new file:', error);
      alert('Failed to create new file: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    // Load recent files
    setRecentFilesList(recentFiles.get());

    // Set up menu event listeners
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'new-file':
            handleNewFile();
            break;
          case 'open-file':
            handleOpenFile();
            break;
        }
      });
    }

    return () => {
      if (window.electronAPI?.removeMenuListeners) {
        window.electronAPI.removeMenuListeners();
      }
    };
  }, []);

  console.log('Dashboard: About to render JSX');
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8" style={{ minHeight: '100vh' }}>
      <div className="max-w-2xl w-full bg-white rounded-lg border border-gray-200 shadow-lg p-8" style={{ backgroundColor: 'white', padding: '2rem' }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Life Map</h1>
          <p className="text-sm text-gray-500">Create and visualize your life timeline</p>
        </div>
        <div className="space-y-3 mb-6">
          <button
            onClick={handleNewFile}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
            title="Create New Life Map (⌘N)"
          >
            <span>📄</span>
            <span>Create New Life Map</span>
          </button>
          <button
            onClick={handleOpenFile}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
            title="Open Existing File (⌘O)"
          >
            <span>📂</span>
            <span>Open Existing File</span>
          </button>
        </div>

        {recentFilesList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Files</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentFilesList.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleOpenRecentFile(file.path)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {file.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate" title={file.path}>
                        {file.path.split('/').pop()}
                      </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveRecentFile(e, file.path)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from recent files"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Use the menu bar or keyboard shortcuts to access features
          </p>
        </div>
      </div>
    </div>
  );
}
