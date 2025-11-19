import { useState, useEffect } from 'react';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  nextCategoryId: number;
  onClose: () => void;
  onCategoriesChange: (categories: Category[]) => void;
  setNextCategoryId: (id: number) => void;
}

export default function CategoryManager({ 
  categories: initialCategories, 
  nextCategoryId,
  onClose, 
  onCategoriesChange,
  setNextCategoryId 
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    section: 'top' as 'top' | 'bottom',
    display_order: 0,
    color: 'blue' as 'blue' | 'red',
  });
  const [errors, setErrors] = useState<{ name?: string; label?: string; display_order?: string }>({});

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Auto-generate name from label (convert to lowercase, replace spaces with underscores)
  const generateNameFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setErrors({});
    setFormData({
      name: '',
      label: '',
      section: 'top',
      display_order: categories.filter(c => c.section === 'top').length,
      color: 'blue',
    });
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setErrors({});
    setFormData({
      name: category.name,
      label: category.label,
      section: category.section,
      display_order: category.display_order,
      color: category.color,
    });
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; label?: string; display_order?: string } = {};
    
    // Validate label (required)
    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }
    
    // Validate name (required, must be unique, valid format)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else {
      // Check for valid format (lowercase letters, numbers, underscores only)
      if (!/^[a-z0-9_]+$/.test(formData.name)) {
        newErrors.name = 'Name must contain only lowercase letters, numbers, and underscores';
      } else {
        // Check for uniqueness (excluding current category if editing)
        const existingCategory = categories.find(
          cat => cat.name === formData.name && 
          (!editingCategory || cat.id !== editingCategory.id)
        );
        if (existingCategory) {
          newErrors.name = 'A category with this name already exists';
        }
      }
    }
    
    // Validate display order (must be between 0 and max for the section)
    // Max is the number of categories in the section (allows adding at the end)
    const maxDisplayOrder = categories.filter(c => c.section === formData.section).length;
    if (formData.display_order < 0 || formData.display_order > maxDisplayOrder) {
      newErrors.display_order = `Display order must be between 0 and ${maxDisplayOrder}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      let updatedCategories: Category[];
      let newCategory: Category | undefined;
      
      if (editingCategory) {
        // Update existing category
        updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id
            ? { ...cat, ...formData }
            : cat
        );
      } else {
        // Create new category
        newCategory = {
          id: nextCategoryId,
          ...formData,
        };
        updatedCategories = [...categories, newCategory];
        setNextCategoryId(nextCategoryId + 1);
      }
      
      // Reorder display orders to be unique and sequential
      // Get all categories in the same section
      const sectionCategories = updatedCategories.filter(c => c.section === formData.section);
      const maxDisplayOrder = categories.filter(c => c.section === formData.section).length;
      
      // If display order is less than max (inserting in middle) or there are duplicates, reorder
      const hasDuplicates = sectionCategories.length !== new Set(sectionCategories.map(c => c.display_order)).size;
      const isInsertingInMiddle = formData.display_order < maxDisplayOrder;
      
      if (isInsertingInMiddle || hasDuplicates) {
        // Get the category being saved
        const targetCategory = editingCategory 
          ? updatedCategories.find(c => c.id === editingCategory.id)
          : newCategory;
        
        if (targetCategory) {
          // Get all other categories in the section (excluding the one being saved)
          const otherCategories = sectionCategories.filter(c => c.id !== targetCategory.id);
          
          // Sort other categories by their current display order
          otherCategories.sort((a, b) => {
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order;
            }
            return a.id - b.id;
          });
          
          // Insert target category at the desired position
          const insertPosition = formData.display_order;
          otherCategories.splice(insertPosition, 0, targetCategory);
          
          // Reassign sequential display orders (0, 1, 2, 3, ...)
          otherCategories.forEach((cat, index) => {
            const categoryIndex = updatedCategories.findIndex(c => c.id === cat.id);
            if (categoryIndex !== -1) {
              updatedCategories[categoryIndex] = { ...updatedCategories[categoryIndex], display_order: index };
            }
          });
        }
      }
      
      setCategories(updatedCategories);
      onCategoriesChange(updatedCategories);
      setShowForm(false);
      setEditingCategory(null);
      setErrors({});
    } catch (error: any) {
      alert('Failed to save category: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will fail if any timeline items use it.')) {
      return;
    }
    
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (!categoryToDelete) return;
    
    const updatedCategories = categories.filter(cat => cat.id !== id);
    
    // Reorder display orders for categories in the same section to be sequential
    const sectionCategories = updatedCategories.filter(c => c.section === categoryToDelete.section);
    
    // Sort by current display order, then reassign sequential values
    sectionCategories.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order;
      }
      return a.id - b.id;
    });
    
    // Reassign sequential display orders (0, 1, 2, 3, ...)
    sectionCategories.forEach((cat, index) => {
      const categoryIndex = updatedCategories.findIndex(c => c.id === cat.id);
      if (categoryIndex !== -1) {
        updatedCategories[categoryIndex] = { ...updatedCategories[categoryIndex], display_order: index };
      }
    });
    
    setCategories(updatedCategories);
    onCategoriesChange(updatedCategories);
  };

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.section !== b.section) {
      return a.section === 'top' ? -1 : 1;
    }
    return a.display_order - b.display_order;
  });

  const topCategories = sortedCategories.filter(c => c.section === 'top');
  const bottomCategories = sortedCategories.filter(c => c.section === 'bottom');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {!showForm ? (
          <>
            <div className="mb-4">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2">Top Section</h3>
                <div className="space-y-2">
                  {topCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-sm text-gray-500">{cat.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="px-2 py-1 text-sm bg-red-200 rounded hover:bg-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-2">Bottom Section</h3>
                <div className="space-y-2">
                  {bottomCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-sm text-gray-500">{cat.name}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="px-2 py-1 text-sm bg-red-200 rounded hover:bg-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Label (display name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setFormData({ 
                    ...formData, 
                    label: newLabel,
                    // Auto-generate name from label if name is empty or was auto-generated
                    name: !editingCategory && (!formData.name || formData.name === generateNameFromLabel(formData.label))
                      ? generateNameFromLabel(newLabel)
                      : formData.name
                  });
                  // Clear error when user types
                  if (errors.label) {
                    setErrors({ ...errors, label: undefined });
                  }
                }}
                className={`w-full px-3 py-2 border rounded ${errors.label ? 'border-red-500' : ''}`}
                placeholder="e.g., Projects, major hobbies"
              />
              {errors.label && (
                <p className="text-red-500 text-sm mt-1">{errors.label}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Name (internal ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  // Convert to lowercase and replace invalid characters
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setFormData({ ...formData, name: sanitized });
                  // Clear error when user types
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : ''} ${editingCategory ? 'bg-gray-100' : ''}`}
                disabled={!!editingCategory}
                placeholder="e.g., projects, residences"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
              {!editingCategory && (
                <p className="text-gray-500 text-xs mt-1">
                  Auto-generated from label. Must be unique and contain only lowercase letters, numbers, and underscores.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select
                value={formData.section}
                onChange={(e) => {
                  const newSection = e.target.value as 'top' | 'bottom';
                  // Auto-update display order when section changes
                  const newDisplayOrder = categories.filter(c => c.section === newSection).length;
                  setFormData({ ...formData, section: newSection, display_order: newDisplayOrder });
                }}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="top">Top (above age bar)</option>
                <option value="bottom">Bottom (below age bar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                max={categories.filter(c => c.section === formData.section).length}
                value={formData.display_order}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const maxDisplayOrder = categories.filter(c => c.section === formData.section).length;
                  const clampedValue = Math.max(0, Math.min(maxDisplayOrder, value));
                  setFormData({ ...formData, display_order: clampedValue });
                  // Clear error when user types
                  if (errors.display_order) {
                    setErrors({ ...errors, display_order: undefined });
                  }
                }}
                className={`w-full px-3 py-2 border rounded ${errors.display_order ? 'border-red-500' : ''}`}
              />
              {errors.display_order && (
                <p className="text-red-500 text-sm mt-1">{errors.display_order}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Lower numbers appear first (0-{categories.filter(c => c.section === formData.section).length}). Default: {categories.filter(c => c.section === formData.section).length}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Default Color</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value as 'blue' | 'red' })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="blue">Blue</option>
                <option value="red">Red</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
