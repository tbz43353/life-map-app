import { useState, useEffect } from 'react';
import { TimelineItem, Category, TimelineItemColor } from '../types';
import { calculateAgeAtDate, calculateMonthsDiff } from '../utils/ageCalculator';

interface ItemFormProps {
  item: TimelineItem | null;
  category: Category;
  maxAge: number;
  dateOfBirth: string;
  onSave: (item: Partial<TimelineItem>) => void;
  onCancel: () => void;
  onDelete?: (itemId: number) => void;
}

export default function ItemForm({ item, category, maxAge, dateOfBirth, onSave, onCancel, onDelete }: ItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'age' | 'date'>('age');
  const [startAge, setStartAge] = useState('');
  const [endAge, setEndAge] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<TimelineItemColor>('blue');
  const [isMaxChecked, setIsMaxChecked] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; startAge?: string; endAge?: string; startDate?: string; endDate?: string }>({});

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setColor(item.color);

      // Load based on input mode
      const mode = item.input_mode || 'age';
      setInputMode(mode);

      if (mode === 'date' && item.start_date) {
        // Date mode
        setStartDate(item.start_date);
        setEndDate(item.end_date || '');
        setStartAge('');
        setEndAge('');
        // Check if use_max_age is set for date mode
        setIsMaxChecked(item.use_max_age || false);
      } else {
        // Age mode
        setStartAge(item.start_age !== undefined ? item.start_age.toString() : '0');
        setStartDate('');
        setEndDate('');

        // Check if use_max_age is set
        if (item.use_max_age) {
          setIsMaxChecked(true);
          setEndAge(maxAge.toString());
        } else {
          setIsMaxChecked(false);
          const itemEndAge = item.end_age !== undefined && item.end_age !== null ? item.end_age.toString() : '';
          setEndAge(itemEndAge);
        }
      }
    } else {
      // Set default color based on category
      setColor(category.color);
      setInputMode('age');
      setStartAge('0');
      setEndAge('');
      setStartDate('');
      setEndDate('');
      setIsMaxChecked(false);
    }
  }, [item, category, maxAge]);

  const validateAge = (value: string, fieldName: string): number | null => {
    if (!value.trim()) {
      if (fieldName === 'startAge') {
        return null; // Start age is required, will be caught by required check
      }
      return null; // End age is optional
    }

    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }

    if (num < 0 || num > maxAge) {
      return null;
    }

    return num;
  };

  const handleMaxCheckboxChange = (checked: boolean) => {
    setIsMaxChecked(checked);
    if (checked) {
      setEndAge(maxAge.toString());
      // Clear any end age errors when max is checked
      if (errors.endAge) {
        setErrors({ ...errors, endAge: undefined });
      }
    } else {
      setEndAge('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const validationErrors: { title?: string; startAge?: string; endAge?: string; startDate?: string; endDate?: string } = {};

    // Validate title
    if (!title.trim()) {
      validationErrors.title = 'Title is required';
    }

    if (inputMode === 'date') {
      // Validate dates
      if (!startDate.trim()) {
        validationErrors.startDate = 'Start date is required';
      } else {
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          validationErrors.startDate = 'Please enter a valid date';
        }
      }

      if (endDate.trim()) {
        const endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          validationErrors.endDate = 'Please enter a valid date';
        } else if (startDate.trim()) {
          const startDateObj = new Date(startDate);
          if (!isNaN(startDateObj.getTime()) && endDateObj < startDateObj) {
            validationErrors.endDate = 'End date must be after start date';
          }
        }
      }
    } else {
      // Validate ages
      if (!startAge.trim()) {
        validationErrors.startAge = 'Start age is required';
      } else {
        const startAgeNum = validateAge(startAge, 'startAge');
        if (startAgeNum === null) {
          validationErrors.startAge = `Please enter a valid age (0-${maxAge})`;
        }
      }

      if (endAge.trim()) {
        const endAgeNum = validateAge(endAge, 'endAge');
        if (endAgeNum === null) {
          validationErrors.endAge = `Please enter a valid age (0-${maxAge})`;
        } else {
          // Check that end age is not less than start age
          const startAgeNum = validateAge(startAge, 'startAge');
          if (startAgeNum !== null && endAgeNum < startAgeNum) {
            validationErrors.endAge = 'End age must be greater than or equal to start age';
          }
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const itemData: Partial<TimelineItem> = {
      category_id: category.id,
      title,
      description: description || undefined,
      color,
      input_mode: inputMode,
    };

    if (inputMode === 'date') {
      // Date mode - store dates, clear ages
      itemData.start_date = startDate;
      itemData.end_date = isMaxChecked ? undefined : (endDate.trim() || undefined);
      itemData.start_age = undefined;
      itemData.end_age = undefined;
      itemData.use_max_age = isMaxChecked;
    } else {
      // Age mode - store ages, clear dates
      const startAgeNum = Number(startAge);
      itemData.start_age = startAgeNum;
      itemData.start_date = undefined;
      itemData.end_date = undefined;

      // Handle use_max_age flag
      if (isMaxChecked) {
        itemData.use_max_age = true;
        itemData.end_age = undefined; // Don't store a specific end_age when using max
      } else {
        itemData.use_max_age = false;
        itemData.end_age = endAge.trim() ? Number(endAge) : undefined;
      }
    }

    onSave(itemData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {item ? 'Edit' : 'Add'} {category.label}
        </h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Input Mode Toggle */}
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="age"
                checked={inputMode === 'age'}
                onChange={() => {
                  setInputMode('age');
                  setErrors({}); // Clear errors when switching modes
                }}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Age</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="date"
                checked={inputMode === 'date'}
                onChange={() => {
                  setInputMode('date');
                  setErrors({}); // Clear errors when switching modes
                }}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Date</span>
            </label>
          </div>

          {inputMode === 'age' ? (
            /* Age Input Mode */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Age *
                </label>
                <input
                  type="text"
                  value={startAge}
                  onChange={(e) => {
                    // Only allow numeric characters
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setStartAge(value);
                    if (errors.startAge) {
                      setErrors({ ...errors, startAge: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startAge ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startAge && (
                  <p className="mt-1 text-sm text-red-600">{errors.startAge}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    End Age (optional)
                  </label>
                  <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap ml-2">
                    <input
                      type="checkbox"
                      checked={isMaxChecked}
                      onChange={(e) => handleMaxCheckboxChange(e.target.checked)}
                      className="mr-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Max</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={endAge}
                  disabled={isMaxChecked}
                  onChange={(e) => {
                    // Only allow numeric characters
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEndAge(value);
                    if (errors.endAge) {
                      setErrors({ ...errors, endAge: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endAge ? 'border-red-500' : 'border-gray-300'
                  } ${isMaxChecked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.endAge && (
                  <p className="mt-1 text-sm text-red-600">{errors.endAge}</p>
                )}
              </div>
            </div>
          ) : (
            /* Date Input Mode */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) {
                      setErrors({ ...errors, startDate: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
                {startDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    Age: {calculateAgeAtDate(startDate, dateOfBirth) ?? '—'}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    End Date (optional)
                  </label>
                  <label className="flex items-center text-xs text-gray-700 cursor-pointer whitespace-nowrap ml-2">
                    <input
                      type="checkbox"
                      checked={isMaxChecked}
                      onChange={(e) => {
                        setIsMaxChecked(e.target.checked);
                        if (e.target.checked) {
                          setEndDate('');
                          if (errors.endDate) {
                            setErrors({ ...errors, endDate: undefined });
                          }
                        }
                      }}
                      className="mr-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Max</span>
                  </label>
                </div>
                <input
                  type="date"
                  value={endDate}
                  disabled={isMaxChecked}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) {
                      setErrors({ ...errors, endDate: undefined });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  } ${isMaxChecked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
                {isMaxChecked ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Will extend to age {maxAge}
                  </p>
                ) : endDate && startDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    {(() => {
                      const months = calculateMonthsDiff(startDate, endDate);
                      if (months === null) return '';
                      if (months < 3) return 'Will be treated as milestone';
                      if (months <= 12) return 'Will span 1 year';
                      return `Age: ${calculateAgeAtDate(endDate, dateOfBirth) ?? '—'}`;
                    })()}
                  </p>
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="blue"
                  checked={color === 'blue'}
                  onChange={(e) => setColor(e.target.value as TimelineItemColor)}
                  className="mr-2"
                />
                <span className="w-6 h-6 bg-blue-600 rounded inline-block"></span>
                <span className="ml-2">Blue</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="red"
                  checked={color === 'red'}
                  onChange={(e) => setColor(e.target.value as TimelineItemColor)}
                  className="mr-2"
                />
                <span className="w-6 h-6 bg-red-600 rounded inline-block"></span>
                <span className="ml-2">Red</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            {item && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this item?')) {
                    onDelete(item.id);
                    onCancel();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <div className="flex justify-end space-x-2 ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

