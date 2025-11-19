import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fileAPI, getCurrentFilePath, setCurrentFilePath } from '../api';
import { LifeMap, TimelineItem, Category } from '../types';
import Timeline from './Timeline';
import ItemForm from './ItemForm';
import CategoryManager from './CategoryManager';
import { calculateAge, formatDateForInput, calculateAgeAtDate, calculateMonthsDiff } from '../utils/ageCalculator';

// Helper to derive ages from item (handles both age and date modes)
const deriveItemAges = (item: TimelineItem, dateOfBirth: string, ageRange: number): { start_age: number; end_age?: number } => {
  if (item.input_mode === 'date' && item.start_date) {
    // Date mode - calculate ages from dates
    const startAge = calculateAgeAtDate(item.start_date, dateOfBirth) ?? 0;

    // Check if use_max_age is set (extends to max age)
    if (item.use_max_age) {
      return { start_age: startAge, end_age: ageRange };
    }

    if (!item.end_date) {
      // No end date - milestone
      return { start_age: startAge };
    }

    // Calculate duration in months
    const months = calculateMonthsDiff(item.start_date, item.end_date);

    if (months === null || months < 3) {
      // Less than 3 months - treat as milestone
      return { start_age: startAge };
    } else if (months <= 12) {
      // 3-12 months - treat as 1 year
      return { start_age: startAge, end_age: startAge + 1 };
    } else {
      // More than 12 months - calculate actual end age
      const endAge = calculateAgeAtDate(item.end_date, dateOfBirth) ?? startAge + 1;
      return { start_age: startAge, end_age: endAge };
    }
  } else {
    // Age mode - use stored ages directly
    return {
      start_age: item.start_age ?? 0,
      end_age: item.use_max_age ? ageRange : item.end_age
    };
  }
};

export default function LifeMapView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lifeMap, setLifeMap] = useState<LifeMap | null>(null);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [currentAge, setCurrentAge] = useState(0);
  const [ageRange, setAgeRange] = useState(80);
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'past' | 'future'>('all');
  const [nextItemId, setNextItemId] = useState(1);
  const [nextCategoryId, setNextCategoryId] = useState(100);
  // Temporary form state for project settings modal
  const [tempTitle, setTempTitle] = useState('');
  const [tempDateOfBirth, setTempDateOfBirth] = useState('');
  const [tempAgeRange, setTempAgeRange] = useState('');
  const [settingsErrors, setSettingsErrors] = useState<{ dateOfBirth?: string; ageRange?: string }>({});
  const [showSettingsOnNewFile, setShowSettingsOnNewFile] = useState(false);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(1200);
  const [zoom, setZoom] = useState(1.0);
  const initializedRef = useRef(false);
  const settingsShownRef = useRef(false); // Track if settings form has been shown for this navigation
  const lastSavedStateRef = useRef<{ items: TimelineItem[]; categories: Category[]; title: string; date_of_birth: string; age_range: number; zoom: number } | null>(null);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  const handlePrint = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      // Use Electron's print API with landscape orientation
      await fileAPI.printPage();
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to open print dialog: ' + (error as Error).message);
    }
  };

  const saveLifeMap = useCallback(async (showAlert: boolean = true) => {
    if (!lifeMap) return;
    
    try {
      const currentPath = getCurrentFilePath();
      const updatedMap: LifeMap = {
        ...lifeMap,
        title: tempTitle || lifeMap.title || 'My Life Map',
        date_of_birth: dateOfBirth,
        age_range: ageRange,
        zoom: zoom,
        categories,
        items,
      };
      
      const savedPath = await fileAPI.saveFile(updatedMap, currentPath || undefined);
      setLifeMap(updatedMap);
      setCurrentFilePath(savedPath);
      
        // Update last saved state
        lastSavedStateRef.current = {
          items: [...items],
          categories: [...categories],
          title: tempTitle || lifeMap.title || 'My Life Map',
          date_of_birth: dateOfBirth,
          age_range: ageRange,
          zoom: zoom,
        };
      
      if (showAlert) {
        alert('File saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file: ' + (error as Error).message);
    }
  }, [lifeMap, tempTitle, dateOfBirth, currentAge, ageRange, zoom, categories, items]);

  // Check for showSettings flag in location state and set it immediately (only once per navigation)
  useEffect(() => {
    const state = location.state as { lifeMap?: LifeMap; filePath?: string; showSettings?: boolean } | null;
    if (state?.showSettings === true && !settingsShownRef.current) {
      setShowProjectSettings(true);
      setShowSettingsOnNewFile(true);
      settingsShownRef.current = true; // Mark that we've shown the settings for this navigation
    } else if (!state?.showSettings) {
      // Reset the flag when navigating away or when showSettings is not present
      settingsShownRef.current = false;
    }
  }, [location.state]);

  // Initialize life map on mount or when location state changes
  useEffect(() => {
    const state = location.state as { lifeMap?: LifeMap; filePath?: string; showSettings?: boolean } | null;
    
    if (state?.lifeMap) {
      // Reset initialization flag when we have new state
      initializedRef.current = false;
      // Don't pass showSettings to initializeLifeMap here - it's handled by the separate useEffect above
      initializeLifeMap(state.lifeMap, false); // Settings form is handled separately
      if (state.filePath) {
        setCurrentFilePath(state.filePath);
      }
      initializedRef.current = true;
    } else if (!lifeMap && !initializedRef.current) {
      // Create new if no state and no existing lifeMap (only once)
      initializedRef.current = true;
      fileAPI.createNew().then(map => {
        initializeLifeMap(map, true); // Show settings form for new files
      }).catch(err => {
        console.error('Failed to create new life map:', err);
        setLoading(false);
        initializedRef.current = false;
      });
    }
  }, [location.key]); // Use location.key to detect navigation changes

  // Set up menu event listeners (separate effect)
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'new-file':
            navigate('/', { state: {} });
            fileAPI.createNew().then(map => {
              navigate('/life-map', { state: { lifeMap: map, showSettings: true } });
            });
            break;
          case 'open-file':
            fileAPI.openFile().then(({ lifeMap, filePath }) => {
              setCurrentFilePath(filePath);
              navigate('/life-map', { state: { lifeMap, filePath } });
            }).catch(() => {});
            break;
          case 'save-file':
            saveLifeMap();
            break;
          case 'save-as-file':
            if (lifeMap) {
              const updatedMap: LifeMap = {
                ...lifeMap,
                title: tempTitle || lifeMap.title,
                age_range: ageRange,
                categories,
                items,
              };
              fileAPI.saveFile(updatedMap).then(path => {
                setCurrentFilePath(path);
                setLifeMap(updatedMap);
              }).catch(() => {});
            }
            break;
          case 'print':
            handlePrint();
            break;
          case 'close-file':
            handleCloseFile();
            break;
        }
      });
    }

    return () => {
      if (window.electronAPI?.removeMenuListeners) {
        window.electronAPI.removeMenuListeners();
      }
    };
  }, [lifeMap, categories, items, currentAge, ageRange, tempTitle, saveLifeMap, navigate]);

  // Update timeline width based on zoom
  useEffect(() => {
    // Use a fixed base width (1200px) and apply zoom
    // This allows the timeline to expand beyond the container when zoomed
    const baseWidth = 1200;
    setTimelineWidth(baseWidth * zoom);
  }, [zoom]);

  const initializeLifeMap = (map: LifeMap, showSettings: boolean = false) => {
    // Show settings form FIRST if this is a new file, before setting loading to false
    // This ensures the form appears even if there are other state updates
    if (showSettings) {
      setShowProjectSettings(true);
      setShowSettingsOnNewFile(true);
    }

    setLifeMap(map);
    setItems(map.items || []);
    setCategories(map.categories || []);
    
    // Handle date of birth - calculate age if DOB is present
    const dob = map.date_of_birth || '';
    setDateOfBirth(dob);
    if (dob) {
      const calculatedAge = calculateAge(dob);
      if (calculatedAge !== null) {
        setCurrentAge(calculatedAge);
      } else {
        setCurrentAge(0);
      }
    } else {
      setCurrentAge(0);
    }
    
    setAgeRange(map.age_range ?? 80);
    // Clamp zoom to valid range (0.8 to 1.4)
    const loadedZoom = map.zoom ?? 1.0;
    setZoom(Math.max(0.8, Math.min(1.4, loadedZoom)));
    setTempTitle(map.title || 'My Life Map');
    setTempDateOfBirth(formatDateForInput(dob));
    setTempAgeRange((map.age_range ?? 80).toString());
    
    // Save the initial state as the last saved state
    lastSavedStateRef.current = {
      items: map.items || [],
      categories: map.categories || [],
      title: map.title || 'My Life Map',
      date_of_birth: dob || '',
      age_range: map.age_range ?? 80,
      zoom: map.zoom ?? 1.0,
    };
    
    // Calculate next IDs
    const maxItemId = Math.max(0, ...(map.items || []).map(i => i.id));
    const maxCategoryId = Math.max(0, ...(map.categories || []).map(c => c.id));
    setNextItemId(maxItemId + 1);
    setNextCategoryId(maxCategoryId + 1);
    
    setLoading(false);
  };

  const handleUpdateProjectSettings = async () => {
    if (!lifeMap) return;
    
    // Validate inputs
    const errors: { dateOfBirth?: string; ageRange?: string } = {};
    
    if (!tempDateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(tempDateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Please enter a valid date';
      } else {
        const age = calculateAge(dob);
        if (age === null || age < 0 || age > 200) {
          errors.dateOfBirth = 'Please enter a valid date of birth';
        }
      }
    }
    
    if (!tempAgeRange.trim()) {
      errors.ageRange = 'Age range is required';
    } else {
      const ageRangeNum = Number(tempAgeRange);
      if (isNaN(ageRangeNum) || ageRangeNum < 10 || ageRangeNum > 200) {
        errors.ageRange = 'Please enter a valid age range (10-200)';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      return;
    }
    
    setSettingsErrors({});
    
    const ageRangeNum = Number(tempAgeRange);
    const calculatedAge = calculateAge(tempDateOfBirth);
    const finalAge = calculatedAge !== null ? calculatedAge : 0;
    
    setLifeMap({
      ...lifeMap,
      title: tempTitle || 'My Life Map',
      date_of_birth: tempDateOfBirth,
      age_range: ageRangeNum,
    });
    setDateOfBirth(tempDateOfBirth);
    setCurrentAge(finalAge);
    setAgeRange(ageRangeNum);
    
    // Capture this before we reset it
    const wasNewFile = showSettingsOnNewFile;
    setShowProjectSettings(false);
    setShowSettingsOnNewFile(false);
    settingsShownRef.current = false; // Reset so settings won't show again for this navigation
    
    // If this was a new file, we can now save it
    if (wasNewFile && !getCurrentFilePath()) {
      // Auto-save new file after settings are set
      try {
        const updatedMap: LifeMap = {
          ...lifeMap,
          title: tempTitle || 'My Life Map',
          date_of_birth: tempDateOfBirth,
          age_range: ageRangeNum,
          categories,
          items,
        };
        const savedPath = await fileAPI.saveFile(updatedMap);
        setCurrentFilePath(savedPath);
        setLifeMap(updatedMap);

        // Update last saved state so hasUnsavedChanges returns false
        lastSavedStateRef.current = {
          items: [...items],
          categories: [...categories],
          title: tempTitle || 'My Life Map',
          date_of_birth: tempDateOfBirth,
          age_range: ageRangeNum,
          zoom: zoom,
        };
      } catch (error) {
        console.error('Failed to auto-save new file:', error);
        // Don't show error - user can save manually later
      }
    }
  };

  const handleOpenProjectSettings = () => {
    setTempTitle(lifeMap?.title || 'My Life Map');
    setTempDateOfBirth(formatDateForInput(dateOfBirth));
    setTempAgeRange(ageRange.toString());
    setSettingsErrors({});
    setShowProjectSettings(true);
  };

  const handleCancelProjectSettings = () => {
    if (showSettingsOnNewFile) {
      // If this was a new file and user cancels, go back to dashboard
      navigate('/');
      return;
    }
    setShowProjectSettings(false);
    settingsShownRef.current = false; // Reset so settings won't show again
    setTempTitle(lifeMap?.title || 'My Life Map');
    setTempDateOfBirth(formatDateForInput(dateOfBirth));
    setTempAgeRange(ageRange.toString());
    setSettingsErrors({});
  };

  const hasUnsavedChanges = (): boolean => {
    if (!lastSavedStateRef.current || !lifeMap) return false;
    
    const saved = lastSavedStateRef.current;
    const currentTitle = tempTitle || lifeMap.title;
    
    // Check if items changed
    if (items.length !== saved.items.length) return true;
    if (categories.length !== saved.categories.length) return true;

    // Check if title, date of birth, range, or zoom changed
    if (currentTitle !== saved.title) return true;
    if (dateOfBirth !== saved.date_of_birth) return true;
    if (ageRange !== saved.age_range) return true;
    if (zoom !== saved.zoom) return true;
    
    // Check if items content changed
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      const savedItem = saved.items[i];
      if (!savedItem ||
          current.id !== savedItem.id ||
          current.title !== savedItem.title ||
          current.start_age !== savedItem.start_age ||
          current.end_age !== savedItem.end_age ||
          current.start_date !== savedItem.start_date ||
          current.end_date !== savedItem.end_date ||
          current.input_mode !== savedItem.input_mode ||
          current.use_max_age !== savedItem.use_max_age ||
          current.category_id !== savedItem.category_id ||
          current.color !== savedItem.color) {
        return true;
      }
    }
    
    // Check if categories changed
    for (let i = 0; i < categories.length; i++) {
      const current = categories[i];
      const savedCat = saved.categories[i];
      if (!savedCat ||
          current.id !== savedCat.id ||
          current.name !== savedCat.name ||
          current.label !== savedCat.label ||
          current.section !== savedCat.section ||
          current.display_order !== savedCat.display_order ||
          current.color !== savedCat.color) {
        return true;
      }
    }
    
    return false;
  };

  const handleCloseFile = async () => {
    if (hasUnsavedChanges()) {
      setShowCloseWarning(true);
    } else {
      setCurrentFilePath(null);
      navigate('/');
    }
  };

  const handleCloseWithSave = async () => {
    setShowCloseWarning(false);
    await saveLifeMap(false); // Don't show save confirmation alert
    setCurrentFilePath(null);
    navigate('/');
  };

  const handleCloseWithoutSave = () => {
    setShowCloseWarning(false);
    setCurrentFilePath(null);
    navigate('/');
  };

  const handleSaveItem = async (itemData: Partial<TimelineItem>) => {
    if (!lifeMap) return;
    
    // Validate required fields
    if (!itemData.title || itemData.title.trim() === '') {
      alert('Title is required');
      return;
    }
    
    // Validate start age/date based on input mode
    if (itemData.input_mode === 'date') {
      if (!itemData.start_date) {
        alert('Start date is required');
        return;
      }
    } else {
      if (itemData.start_age === undefined || itemData.start_age === null) {
        alert('Start age is required');
        return;
      }
    }
    
    try {
      if (editingItem) {
        // Update existing item
        const category = categories.find(c => c.id === (itemData.category_id || editingItem.category_id)) || editingItem.category;
        const updatedItems = items.map(item =>
          item.id === editingItem.id
            ? { 
                ...item, 
                ...itemData, 
                id: editingItem.id,
                category: category || item.category
              }
            : item
        );
        setItems(updatedItems);
      } else {
        // Create new item
        if (!selectedCategory) {
          alert('Please select a category');
          return;
        }
        // Ensure we use the category from the categories array to maintain reference consistency
        const category = categories.find(c => c.id === selectedCategory.id) || selectedCategory;
        const newItem: TimelineItem = {
          id: nextItemId,
          category_id: category.id,
          title: itemData.title!,
          description: itemData.description,
          start_age: itemData.start_age,
          end_age: itemData.end_age,
          start_date: itemData.start_date,
          end_date: itemData.end_date,
          input_mode: itemData.input_mode,
          use_max_age: itemData.use_max_age,
          color: itemData.color || category.color,
          category: category,
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        setNextItemId(nextItemId + 1);
      }
      setShowItemForm(false);
      setEditingItem(null);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item: ' + (error as Error).message);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleEditItem = (item: TimelineItem) => {
    setEditingItem(item);
    setSelectedCategory(item.category || categories.find(c => c.id === item.category_id) || null);
    setShowItemForm(true);
  };

  const handleAddItem = (category: Category) => {
    setEditingItem(null);
    setSelectedCategory(category);
    setShowItemForm(true);
  };

  const handleCategoriesChange = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    // Update items with category references
    setItems(items.map(item => {
      const category = updatedCategories.find(c => c.id === item.category_id);
      return { ...item, category };
    }));
  };

  // Show settings form even if loading or lifeMap is null (for new files)
  if (showProjectSettings) {
    // Settings form will be rendered below, allow it to show
  } else if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  } else if (!lifeMap) {
    return <div className="flex items-center justify-center min-h-screen">Life map not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <nav className="bg-white border-b border-gray-200 no-print">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-gray-900">{lifeMap?.title || tempTitle || 'My Life Map'}</h1>
              {getCurrentFilePath() && (
                <>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <span className="text-xs text-gray-500">
                    {getCurrentFilePath()?.split('/').pop()}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCloseFile}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                title="Close File"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
              <button
                onClick={() => saveLifeMap()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                title="Save (⌘S)"
              >
                <span>💾</span>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-2xl font-bold">{lifeMap?.title || tempTitle || 'My Life Map'}</h1>
        {viewMode !== 'all' && (
          <p className="text-sm text-gray-600 mt-1">
            {viewMode === 'past' ? 'Past Events' : 'Future Events'} - Current Age: {currentAge}
          </p>
        )}
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 print:p-0">
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex flex-wrap gap-1.5 print:hidden">
            {categories
              .sort((a, b) => {
                if (a.section !== b.section) {
                  return a.section === 'top' ? -1 : 1;
                }
                return a.display_order - b.display_order;
              })
              .map(category => (
                <button
                  key={category.id}
                  onClick={() => handleAddItem(category)}
                  className={`px-3 py-1.5 text-sm text-white rounded transition-colors flex items-center gap-1.5 ${
                    category.color === 'blue' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  title={`Add ${category.label}`}
                >
                  <span>+</span>
                  <span>{category.label}</span>
                </button>
              ))}
          </div>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Manage Categories"
          >
            ⚙️ Categories
          </button>
          <button
            onClick={handleOpenProjectSettings}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Project Settings"
          >
            ⚙️ Settings
          </button>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors print:hidden flex items-center gap-1.5"
            title="Print (⌘P)"
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          <div className="flex items-center gap-1 print:hidden">
            <button
              onClick={() => {
                const newZoom = Math.max(0.8, zoom - 0.1);
                setZoom(newZoom);
              }}
              className="px-2 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
              disabled={zoom <= 0.8}
            >
              −
            </button>
            <span className="px-2 text-sm text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => {
                const newZoom = Math.min(1.4, zoom + 0.1);
                setZoom(newZoom);
              }}
              className="px-2 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
              disabled={zoom >= 1.4}
            >
              +
            </button>
          </div>
          <div className="flex gap-1 border-l border-gray-300 pl-3 ml-1 items-center print:hidden">
            <span className="text-xs text-gray-500 mr-1">View:</span>
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('past')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'past' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show items that ended before your current age"
            >
              Past
            </button>
            <button
              onClick={() => setViewMode('future')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                viewMode === 'future' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Show items that start after your current age"
            >
              Future
            </button>
          </div>
        </div>

        <div ref={timelineContainerRef} className="w-full overflow-x-auto overflow-y-visible" style={{ paddingLeft: 0 }}>
          <Timeline
            items={items.filter(item => {
              if (viewMode === 'all') return true;

              const ages = deriveItemAges(item, dateOfBirth, ageRange);
              const effectiveEndAge = ages.end_age;

              if (viewMode === 'past') {
                // Show items that have any portion in the past (start before current age)
                // Items that cross the age line will be shown but clipped at currentAge
                if (ages.start_age < currentAge) {
                  // Check they don't exceed age range
                  if (effectiveEndAge !== null && effectiveEndAge !== undefined) {
                    return effectiveEndAge <= ageRange;
                  } else {
                    return ages.start_age <= ageRange;
                  }
                }
                return false;
              }

              if (viewMode === 'future') {
                // Show items that have any portion in the future
                // Items that cross the age line will be shown but clipped at currentAge
                const maxAge = ageRange;
                if (effectiveEndAge !== null && effectiveEndAge !== undefined) {
                  // Bar item: show if it extends into the future (end_age > currentAge)
                  // and doesn't exceed age range
                  return effectiveEndAge > currentAge && effectiveEndAge <= maxAge;
                } else {
                  // Point item: show if it's in the future and within range
                  return ages.start_age > currentAge && ages.start_age <= maxAge;
                }
              }

              return true;
            })}
            categories={categories}
            onItemClick={handleEditItem}
            currentAge={currentAge}
            ageRange={ageRange}
            dateOfBirth={dateOfBirth}
            autoScale={viewMode !== 'all'}
            viewMode={viewMode}
            width={timelineWidth}
            zoom={zoom}
          />
        </div>
      </main>

      {showItemForm && selectedCategory && (
        <ItemForm
          item={editingItem}
          category={selectedCategory}
          maxAge={ageRange}
          dateOfBirth={dateOfBirth}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          onCancel={() => {
            setShowItemForm(false);
            setEditingItem(null);
            setSelectedCategory(null);
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          nextCategoryId={nextCategoryId}
          onClose={() => {
            setShowCategoryManager(false);
          }}
          onCategoriesChange={handleCategoriesChange}
          setNextCategoryId={setNextCategoryId}
        />
      )}

      {showCloseWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Unsaved Changes</h2>
            <p className="mb-6 text-gray-700">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCloseWarning(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseWithoutSave}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Discard Changes
              </button>
              <button
                onClick={handleCloseWithSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Project Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Life Map"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={tempDateOfBirth}
                  onChange={(e) => {
                    setTempDateOfBirth(e.target.value);
                    if (settingsErrors.dateOfBirth) {
                      setSettingsErrors({ ...settingsErrors, dateOfBirth: undefined });
                    }
                    // Calculate and display age
                    const age = calculateAge(e.target.value);
                    if (age !== null && e.target.value) {
                      // Age will be calculated automatically
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    settingsErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {settingsErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{settingsErrors.dateOfBirth}</p>
                )}
                {tempDateOfBirth && calculateAge(tempDateOfBirth) !== null && (
                  <p className="mt-1 text-sm text-gray-500">
                    Current age: {calculateAge(tempDateOfBirth)} years
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range (total years to display)
                </label>
                <input
                  type="text"
                  value={tempAgeRange}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setTempAgeRange(value);
                    if (settingsErrors.ageRange) {
                      setSettingsErrors({ ...settingsErrors, ageRange: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    settingsErrors.ageRange ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {settingsErrors.ageRange && (
                  <p className="mt-1 text-sm text-red-600">{settingsErrors.ageRange}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Timeline shows ages 0 to {tempAgeRange || '80'}. Current age ({tempDateOfBirth ? calculateAge(tempDateOfBirth) || '0' : '0'}) will be marked with a green line.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCancelProjectSettings}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProjectSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
