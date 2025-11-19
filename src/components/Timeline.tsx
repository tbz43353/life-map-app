import { ReactElement } from 'react';
import { TimelineItem, Category } from '../types';
import { calculateAgeAtDate, calculateMonthsDiff } from '../utils/ageCalculator';

interface TimelineProps {
  items: TimelineItem[];
  categories: Category[];
  onItemClick: (item: TimelineItem) => void;
  currentAge?: number;
  ageRange?: number;
  dateOfBirth?: string; // For deriving ages from date-based items
  autoScale?: boolean; // Whether to auto-scale based on visible items
  viewMode?: 'all' | 'past' | 'future'; // Current view mode for better scaling
  width?: number; // Timeline width (defaults to 1200)
  zoom?: number; // Zoom level (defaults to 1.0)
}

// Helper to derive ages from item (handles both age and date modes)
interface DerivedAges {
  start_age: number;
  end_age?: number;
}

const deriveItemAges = (item: TimelineItem, dateOfBirth: string, ageRange: number): DerivedAges => {
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

const DEFAULT_TIMELINE_WIDTH = 1200;
const ROW_HEIGHT = 35;
const AGE_MARKER_HEIGHT = 30;
const SECTION_SPACING = 10;
const ITEM_HEIGHT = 24;
const ITEM_SPACING = 3;
const LEFT_LABEL_PADDING = 120; // Space for category labels on the left

// Helper functions to get category info from dynamic categories
const getCategoryRows = (categories: Category[]) => {
  const topCategories = categories
    .filter(c => c.section === 'top')
    .sort((a, b) => a.display_order - b.display_order);
  const bottomCategories = categories
    .filter(c => c.section === 'bottom')
    .sort((a, b) => a.display_order - b.display_order);
  
  const topRows: Record<number, number> = {};
  topCategories.forEach((cat, idx) => {
    topRows[cat.id] = idx;
  });
  
  const bottomRows: Record<number, number> = {};
  bottomCategories.forEach((cat, idx) => {
    bottomRows[cat.id] = idx;
  });
  
  return { topCategories, bottomCategories, topRows, bottomRows };
};

// Calculate Y positions with dynamic row heights
const getCategoryRowHeight = (categoryId: number, categoryMaxStacks: Map<number, number>, categoryMaxHeights?: Map<number, number>): number => {
  if (categoryMaxHeights && categoryMaxHeights.has(categoryId)) {
    return categoryMaxHeights.get(categoryId)!;
  }
  const maxStack = categoryMaxStacks.get(categoryId) || 1;
  return Math.max(ROW_HEIGHT, maxStack * (ITEM_HEIGHT + ITEM_SPACING) + ITEM_SPACING * 2);
};

const getTopSectionY = (row: number, categoryId: number, categoryMaxStacks: Map<number, number>, categoryMaxHeights?: Map<number, number>, topCategories?: Category[]) => {
  if (!topCategories) return 0;
  let yOffset = 0;
  for (let i = 0; i < row; i++) {
    const cat = topCategories[i];
    if (cat) {
      yOffset += getCategoryRowHeight(cat.id, categoryMaxStacks, categoryMaxHeights);
    }
  }
  const currentRowHeight = getCategoryRowHeight(categoryId, categoryMaxStacks, categoryMaxHeights);
  return yOffset + currentRowHeight / 2;
};

const getAgeBarY = (categoryMaxStacks: Map<number, number>, categoryMaxHeights?: Map<number, number>, topCategories?: Category[]) => {
  if (!topCategories) return SECTION_SPACING;
  let totalHeight = 0;
  topCategories.forEach(cat => {
    totalHeight += getCategoryRowHeight(cat.id, categoryMaxStacks, categoryMaxHeights);
  });
  return totalHeight + SECTION_SPACING;
};

const getBottomSectionY = (row: number, categoryId: number, categoryMaxStacks: Map<number, number>, ageBarY: number, categoryMaxHeights?: Map<number, number>, bottomCategories?: Category[]) => {
  if (!bottomCategories) return ageBarY + AGE_MARKER_HEIGHT + SECTION_SPACING;
  let yOffset = ageBarY + AGE_MARKER_HEIGHT + SECTION_SPACING;
  for (let i = 0; i < row; i++) {
    const cat = bottomCategories[i];
    if (cat) {
      yOffset += getCategoryRowHeight(cat.id, categoryMaxStacks, categoryMaxHeights);
    }
  }
  const currentRowHeight = getCategoryRowHeight(categoryId, categoryMaxStacks, categoryMaxHeights);
  return yOffset + currentRowHeight / 2;
};

export default function Timeline({ items, categories, onItemClick, currentAge = 0, ageRange = 80, dateOfBirth = '', autoScale = false, viewMode = 'all', width = DEFAULT_TIMELINE_WIDTH, zoom = 1.0 }: TimelineProps) {
  const TIMELINE_WIDTH = width;
  const { topCategories, bottomCategories, topRows, bottomRows } = getCategoryRows(categories);

  // Pre-compute derived ages for all items
  const itemAges = new Map<number, DerivedAges>();
  items.forEach(item => {
    itemAges.set(item.id, deriveItemAges(item, dateOfBirth, ageRange));
  });

  // Helper to get derived ages for an item
  const getItemAges = (item: TimelineItem): DerivedAges => {
    return itemAges.get(item.id) || { start_age: item.start_age ?? 0, end_age: item.end_age };
  };
  
  // Create maps for quick lookup
  const categoryMap = new Map<number, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  
  // Get category by ID or name (for backward compatibility)
  const getCategory = (item: TimelineItem): Category | undefined => {
    if (item.category) return item.category;
    return categoryMap.get(item.category_id);
  };
  // Calculate the actual age range to display based on visible items
  const calculateDisplayRange = () => {
    if (!autoScale) {
      return { startAge: 0, displayRange: ageRange };
    }
    
    if (items.length === 0) {
      // If no items but auto-scaling is enabled, show appropriate range based on view mode
      if (viewMode === 'future') {
        // For future view with no items, show from current age to end of range
        const futureRange = Math.min(ageRange - currentAge, 40);
        return { startAge: currentAge, displayRange: Math.max(futureRange, 20) };
      } else if (viewMode === 'past') {
        // For past view with no items, show from start to current age
        return { startAge: 0, displayRange: Math.max(currentAge, 20) };
      }
      return { startAge: 0, displayRange: Math.min(ageRange, 40) };
    }
    
    // Find min and max ages from visible items
    let minAge = Infinity;
    let maxAge = -Infinity;

    items.forEach(item => {
      const ages = deriveItemAges(item, dateOfBirth, ageRange);
      minAge = Math.min(minAge, ages.start_age);
      const itemEndAge = ages.end_age ?? ages.start_age;
      maxAge = Math.max(maxAge, itemEndAge);
    });
    
    if (minAge === Infinity || maxAge === -Infinity) {
      if (viewMode === 'future') {
        const futureRange = Math.min(ageRange - currentAge, 40);
        return { startAge: currentAge, displayRange: Math.max(futureRange, 20) };
      }
      return { startAge: 0, displayRange: Math.min(ageRange, 40) };
    }
    
    // Add padding (10% on each side, minimum 5 years)
    const itemSpan = maxAge - minAge;
    const padding = itemSpan > 0 ? Math.max(itemSpan * 0.1, 5) : 5;
    let calculatedStart = Math.max(0, Math.floor(minAge - padding));
    const calculatedEnd = Math.ceil(maxAge + padding);
    
    // For future view, don't allow start to go below current age
    if (viewMode === 'future' && calculatedStart < currentAge) {
      calculatedStart = currentAge;
    }
    
    // For past view, don't allow end to go above current age
    if (viewMode === 'past' && calculatedEnd > currentAge) {
      const pastRange = currentAge - calculatedStart;
      // Ensure minimum range
      if (pastRange < 20) {
        calculatedStart = Math.max(0, currentAge - 20);
      }
    }
    
    const calculatedRange = calculatedEnd - calculatedStart;
    
    // Don't zoom in too much - keep minimum range of 20 years
    let finalRange = Math.max(calculatedRange, 20);
    let finalStart = Math.max(0, calculatedStart);
    let finalEnd = finalStart + finalRange;
    
    // For future view, ensure start is at least current age
    if (viewMode === 'future') {
      finalStart = Math.max(finalStart, currentAge);
      finalEnd = finalStart + finalRange;
    }
    
    // For past view, ensure end is at most current age
    if (viewMode === 'past') {
      if (finalEnd > currentAge) {
        finalEnd = currentAge;
        finalRange = finalEnd - finalStart;
      }
    }
    
    // Ensure we don't exceed the configured age range
    const maxEndAge = finalStart + finalRange;
    if (maxEndAge > ageRange) {
      // Cap the range to not exceed ageRange
      const maxAllowedRange = ageRange - finalStart;
      const cappedRange = Math.min(finalRange, maxAllowedRange);
      // For future view, ensure we don't go below current age
      if (viewMode === 'future') {
        const adjustedStart = Math.max(currentAge, ageRange - cappedRange);
        return { startAge: adjustedStart, displayRange: cappedRange };
      }
      // For past view, ensure we don't go above current age
      if (viewMode === 'past') {
        const adjustedStart = Math.max(0, currentAge - cappedRange);
        return { startAge: adjustedStart, displayRange: cappedRange };
      }
      const adjustedStart = Math.max(0, ageRange - cappedRange);
      return { startAge: adjustedStart, displayRange: cappedRange };
    }
    
    return { startAge: finalStart, displayRange: finalRange };
  };
  
  const { startAge, displayRange } = calculateDisplayRange();
  const AGE_RANGE = displayRange;
  const START_AGE = startAge;
  
  const ageToX = (age: number) => {
    if (AGE_RANGE === 0) return 0;
    const normalizedAge = age - START_AGE;
    return (normalizedAge / AGE_RANGE) * TIMELINE_WIDTH;
  };

  // Check if two items overlap in time or visually
  // For bar items: overlap if they share any time period
  // For point items (milestones): overlap if their rendered boxes overlap based on X position and width
  const itemsOverlap = (item1: TimelineItem, item2: TimelineItem): boolean => {
    const ages1 = getItemAges(item1);
    const ages2 = getItemAges(item2);
    const item1EndAge = ages1.end_age;
    const item2EndAge = ages2.end_age;
    const item1IsPoint = item1EndAge === null || item1EndAge === undefined;
    const item2IsPoint = item2EndAge === null || item2EndAge === undefined;

    // If both are point items, check visual overlap based on rendered width
    if (item1IsPoint && item2IsPoint) {
      const item1X = ageToX(ages1.start_age);
      const item2X = ageToX(ages2.start_age);
      const item1Width = itemWidths.get(item1.id) || 60;
      const item2Width = itemWidths.get(item2.id) || 60;

      // Calculate the left and right edges of each item's rendered box
      const item1Left = item1X - item1Width / 2;
      const item1Right = item1X + item1Width / 2;
      const item2Left = item2X - item2Width / 2;
      const item2Right = item2X + item2Width / 2;

      // Items overlap if their boxes overlap horizontally
      return item1Right > item2Left && item2Right > item1Left;
    }

    // For bar items or mixed cases, use time-based overlap
    const item1End = item1EndAge ?? ages1.start_age;
    const item2End = item2EndAge ?? ages2.start_age;
    // Items overlap if: item1End > ages2.start_age AND item2End > ages1.start_age
    // This means if one ends exactly when another starts (item1End === ages2.start_age), they don't overlap
    return item1End > ages2.start_age && item2End > ages1.start_age;
  };

  // Assign stack positions to items within each category
  const assignStackPositions = (categoryItems: TimelineItem[]): Map<number, number> => {
    const stackMap = new Map<number, number>(); // item.id -> stackLevel
    const stacks: TimelineItem[][] = [];

    // Sort items by start_age to ensure consistent stacking behavior
    const sortedItems = [...categoryItems].sort((a, b) => {
      const agesA = getItemAges(a);
      const agesB = getItemAges(b);
      if (agesA.start_age !== agesB.start_age) {
        return agesA.start_age - agesB.start_age;
      }
      // If same start age, sort by end_age (point items last)
      const aEnd = agesA.end_age ?? Infinity;
      const bEnd = agesB.end_age ?? Infinity;
      return aEnd - bEnd;
    });

    for (const item of sortedItems) {
      let placed = false;
      // Try to place in existing stack
      for (let i = 0; i < stacks.length; i++) {
        const stack = stacks[i];
        // Check if item doesn't overlap with any item in this stack
        const noOverlap = stack.every(stackItem => !itemsOverlap(item, stackItem));
        if (noOverlap) {
          stack.push(item);
          stackMap.set(item.id, i);
          placed = true;
          break;
        }
      }
      // If couldn't place in existing stack, create new stack
      if (!placed) {
        stacks.push([item]);
        stackMap.set(item.id, stacks.length - 1);
      }
    }

    return stackMap;
  };

  // Calculate text layout for an item (used for height calculation)
  const calculateTextLayout = (text: string, availableWidth: number, isPointItem: boolean = false) => {
    const zoomLevel = zoom;
    const baseSize = 11 * zoomLevel;
    const minSize = 9 * zoomLevel; // Minimum size before wrapping
    // Use less padding for point items (milestones)
    const padding = isPointItem ? 4 * zoomLevel : 8 * zoomLevel; // horizontal padding
    const lineHeight = 13 * zoomLevel; // Line height for wrapped text
    const charWidth = baseSize * 0.6; // approximate character width
    const minCharWidth = minSize * 0.6;
    
    // First, try to fit at base size
    const maxCharsAtBase = (availableWidth - padding) / charWidth;
    if (text.length <= maxCharsAtBase) {
      return {
        fontSize: baseSize,
        lines: [text],
        itemHeight: ITEM_HEIGHT
      };
    }
    
    // Try to fit at minimum size
    const maxCharsAtMin = (availableWidth - padding) / minCharWidth;
    if (text.length <= maxCharsAtMin) {
      const calculatedSize = (availableWidth - padding) / text.length / 0.6;
      const fontSize = Math.max(minSize, Math.min(baseSize, calculatedSize));
      return {
        fontSize,
        lines: [text],
        itemHeight: ITEM_HEIGHT
      };
    }
    
    // Text doesn't fit even at minimum size - wrap it
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testLength = testLine.length * minCharWidth;
      
      if (testLength <= availableWidth - padding) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    const numLines = Math.max(1, lines.length);
    const wrappedHeight = Math.max(ITEM_HEIGHT, numLines * lineHeight + 4);
    
    return {
      fontSize: minSize,
      lines,
      itemHeight: wrappedHeight
    };
  };

  // Calculate rendered width for a point item based on text content
  const calculatePointItemWidth = (text: string): number => {
    const zoomLevel = zoom;
    const baseSize = 11 * zoomLevel;
    const padding = 4 * zoomLevel; // Reduced padding for milestone items
    const charWidth = baseSize * 0.6;
    
    // Calculate width needed for text at base size
    const widthAtBase = text.length * charWidth + padding;
    // Use minimum width of 50, or width needed for text (reduced from 60)
    return Math.max(50 * zoomLevel, widthAtBase);
  };

  // Pre-calculate item heights and widths for all items
  const itemHeights = new Map<number, number>();
  const itemWidths = new Map<number, number>();
  items.forEach(item => {
    const ages = getItemAges(item);
    const startX = ageToX(ages.start_age);
    let width: number;

    const effectiveEndAge = ages.end_age;
    const isPointItem = effectiveEndAge === null || effectiveEndAge === undefined;
    if (!isPointItem && effectiveEndAge !== null && effectiveEndAge !== undefined) {
      // Bar item - width based on age range
      // Minimum width is 1 year to ensure proportional representation
      const oneYearWidth = TIMELINE_WIDTH / AGE_RANGE;
      const endX = ageToX(effectiveEndAge);
      width = Math.max(endX - startX, oneYearWidth);
    } else {
      // Point item - width based on text content
      width = calculatePointItemWidth(item.title);
    }

    itemWidths.set(item.id, width);
    const textLayout = calculateTextLayout(item.title, width, isPointItem);
    itemHeights.set(item.id, textLayout.itemHeight);
  });

  // Calculate stack positions for all items by category
  const stackPositions = new Map<number, number>();
  const categoryMaxStacks = new Map<number, number>(); // category ID -> max stack
  const categoryMaxHeights = new Map<number, number>(); // category ID -> max height

  categories.forEach(category => {
    const categoryItems = items.filter(item => {
      const itemCategory = getCategory(item);
      return itemCategory && itemCategory.id === category.id;
    });
    const positions = assignStackPositions(categoryItems);
    positions.forEach((level, itemId) => {
      stackPositions.set(itemId, level);
    });
    const maxStack = Math.max(...Array.from(positions.values()), 0) + 1;
    categoryMaxStacks.set(category.id, maxStack);
    
    // Calculate maximum height needed for this category
    // For each stack level, find the tallest item at that level
    const stackHeights: number[] = [];
    for (let stackLevel = 0; stackLevel < maxStack; stackLevel++) {
      const itemsAtLevel = categoryItems.filter(item => (positions.get(item.id) || 0) === stackLevel);
      const maxHeightAtLevel = Math.max(...itemsAtLevel.map(item => itemHeights.get(item.id) || ITEM_HEIGHT), ITEM_HEIGHT);
      stackHeights.push(maxHeightAtLevel);
    }
    
    // Total height = sum of all stack heights + spacing between stacks
    const totalHeight = stackHeights.reduce((sum, h) => sum + h, 0) + (maxStack - 1) * ITEM_SPACING + ITEM_SPACING * 2;
    categoryMaxHeights.set(category.id, Math.max(ROW_HEIGHT, totalHeight));
  });

  const renderAgeMarkers = (ageBarY: number) => {
    const markers = [];
    const yearWidth = TIMELINE_WIDTH / AGE_RANGE;

    // Render all individual years as boxes within the display range
    for (let age = START_AGE; age <= START_AGE + AGE_RANGE; age++) {
      const x = ageToX(age);
      const isDecade = age % 10 === 0;
      const boxHeight = AGE_MARKER_HEIGHT;
      const boxWidth = yearWidth;

      markers.push(
        <g key={age}>
          {/* Box for each year - edge-to-edge alignment */}
          <rect
            x={x - boxWidth / 2}
            y={ageBarY}
            width={boxWidth}
            height={boxHeight}
            fill={isDecade ? "#000" : "#fff"}
            stroke="#ccc"
            strokeWidth={0.5}
          />
          {/* Show labels for all years */}
          <text
            x={x}
            y={ageBarY + AGE_MARKER_HEIGHT / 2 + 4}
            textAnchor="middle"
            fontSize={isDecade ? (11 * zoom) : (8 * zoom)}
            fill={isDecade ? "#fff" : "#333"}
            fontWeight={isDecade ? "600" : "400"}
          >
            {age}
          </text>
        </g>
      );
    }

    return markers;
  };

  const renderConnectionLine = (item: TimelineItem, ageBarY: number) => {
    // Only render connection lines for point items (inflection_point, insight, goal)
    const ages = getItemAges(item);
    const effectiveEndAge = ages.end_age;
    const isPoint = effectiveEndAge === null || effectiveEndAge === undefined;
    if (!isPoint) return null;

    const itemCategory = getCategory(item);
    if (!itemCategory) return null;

    let y: number;
    const stackLevel = stackPositions.get(item.id) || 0;
    const actualItemHeight = itemHeights.get(item.id) || ITEM_HEIGHT;

    // Calculate cumulative offset for this stack level
    const categoryItems = items.filter(i => {
      const iCategory = getCategory(i);
      return iCategory && iCategory.id === itemCategory.id;
    });
    let stackOffset = 0;
    for (let level = 0; level < stackLevel; level++) {
      const itemsAtLevel = categoryItems.filter(i => (stackPositions.get(i.id) || 0) === level);
      const maxHeightAtLevel = Math.max(...itemsAtLevel.map(i => itemHeights.get(i.id) || ITEM_HEIGHT), ITEM_HEIGHT);
      stackOffset += maxHeightAtLevel + ITEM_SPACING;
    }

    const row = itemCategory.section === 'top'
      ? topRows[itemCategory.id]
      : bottomRows[itemCategory.id];

    if (itemCategory.section === 'top') {
      const baseY = getTopSectionY(row, itemCategory.id, categoryMaxStacks, categoryMaxHeights, topCategories);
      const categoryHeight = getCategoryRowHeight(itemCategory.id, categoryMaxStacks, categoryMaxHeights);
      y = baseY - categoryHeight / 2 + ITEM_SPACING + stackOffset + actualItemHeight / 2;
    } else {
      const baseY = getBottomSectionY(row, itemCategory.id, categoryMaxStacks, ageBarY, categoryMaxHeights, bottomCategories);
      const categoryHeight = getCategoryRowHeight(itemCategory.id, categoryMaxStacks, categoryMaxHeights);
      y = baseY - categoryHeight / 2 + ITEM_SPACING + stackOffset + actualItemHeight / 2;
    }

    const startX = ageToX(ages.start_age);
    const color = item.color === 'red' ? '#ef4444' : '#3b82f6';

    // Determine if line goes up or down
    const lineStartY = y < ageBarY ? y + actualItemHeight / 2 : y - actualItemHeight / 2;
    const lineEndY = y < ageBarY ? ageBarY : ageBarY + AGE_MARKER_HEIGHT;

    return (
      <line
        key={`line-${item.id}`}
        x1={startX}
        y1={lineStartY}
        x2={startX}
        y2={lineEndY}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="5,5"
        opacity={0.6}
        className="pointer-events-none"
      />
    );
  };

  const renderItem = (item: TimelineItem, ageBarY: number) => {
    const itemCategory = getCategory(item);
    if (!itemCategory) return null;
    
    const stackLevel = stackPositions.get(item.id) || 0;
    const actualItemHeight = itemHeights.get(item.id) || ITEM_HEIGHT;
    
    // Calculate cumulative offset for this stack level
    // We need to sum up the heights of all items in previous stack levels
    const categoryItems = items.filter(i => {
      const iCategory = getCategory(i);
      return iCategory && iCategory.id === itemCategory.id;
    });
    let stackOffset = 0;
    for (let level = 0; level < stackLevel; level++) {
      const itemsAtLevel = categoryItems.filter(i => (stackPositions.get(i.id) || 0) === level);
      const maxHeightAtLevel = Math.max(...itemsAtLevel.map(i => itemHeights.get(i.id) || ITEM_HEIGHT), ITEM_HEIGHT);
      stackOffset += maxHeightAtLevel + ITEM_SPACING;
    }
    
    let y: number;
    const row = itemCategory.section === 'top' 
      ? topRows[itemCategory.id] 
      : bottomRows[itemCategory.id];
    
    if (itemCategory.section === 'top') {
      const baseY = getTopSectionY(row, itemCategory.id, categoryMaxStacks, categoryMaxHeights, topCategories);
      const categoryHeight = getCategoryRowHeight(itemCategory.id, categoryMaxStacks, categoryMaxHeights);
      y = baseY - categoryHeight / 2 + ITEM_SPACING + stackOffset + actualItemHeight / 2;
    } else {
      const baseY = getBottomSectionY(row, itemCategory.id, categoryMaxStacks, ageBarY, categoryMaxHeights, bottomCategories);
      const categoryHeight = getCategoryRowHeight(itemCategory.id, categoryMaxStacks, categoryMaxHeights);
      y = baseY - categoryHeight / 2 + ITEM_SPACING + stackOffset + actualItemHeight / 2;
    }
    
    const ages = getItemAges(item);
    const startX = ageToX(ages.start_age);
    let width = itemWidths.get(item.id) || 60;
    const effectiveEndAge = ages.end_age;
    const isPoint = effectiveEndAge === null || effectiveEndAge === undefined;
    const color = item.color === 'red' ? '#ef4444' : '#3b82f6';

    // Clip bars that cross the current age line based on view mode
    let clippedStartX = startX;
    let clippedWidth = width;
    if (!isPoint && effectiveEndAge !== null && effectiveEndAge !== undefined) {
      const currentAgeX = ageToX(currentAge);
      const endX = ageToX(effectiveEndAge);

      if (viewMode === 'past' && effectiveEndAge > currentAge) {
        // Clip at current age for past view
        clippedWidth = currentAgeX - startX;
        clippedWidth = Math.max(0, clippedWidth); // Ensure non-negative
      } else if (viewMode === 'future' && ages.start_age < currentAge) {
        // Clip at current age for future view
        clippedStartX = currentAgeX;
        clippedWidth = endX - currentAgeX;
        clippedWidth = Math.max(0, clippedWidth); // Ensure non-negative
      }
    }
    
    // Get pre-calculated text layout
    const textLayout = calculateTextLayout(item.title, width, isPoint);
    const textColor = '#fff'; // White text for all items for better readability

    return (
      <g key={item.id}>
        {isPoint ? (
          // Render as a box/point
          <g>
            <rect
              x={startX - width / 2}
              y={y - actualItemHeight / 2}
              width={width}
              height={actualItemHeight}
              fill={color}
              stroke="#000"
              strokeWidth={1}
              rx={0}
              className={`cursor-pointer hover:opacity-80 ${item.color === 'red' ? 'print-red-item' : 'print-blue-item'}`}
              onClick={() => onItemClick(item)}
            />
            {/* Label for point items - inside box with wrapping */}
            <text
              x={startX}
              y={y - actualItemHeight / 2 + textLayout.fontSize + 2}
              textAnchor="middle"
              fontSize={textLayout.fontSize}
              fill={textColor}
              fontWeight="500"
              className="pointer-events-none select-none"
            >
              {textLayout.lines.map((line, idx) => (
                <tspan
                  key={idx}
                  x={startX}
                  dy={idx === 0 ? 0 : textLayout.fontSize + 2}
                  textAnchor="middle"
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ) : (
          // Render as a bar (with clipping if needed)
          <g>
            {clippedWidth > 0 && (
              <>
                {/* Define clipPath for text to prevent overflow */}
                <defs>
                  <clipPath id={`clip-bar-${item.id}`}>
                    <rect
                      x={clippedStartX}
                      y={y - actualItemHeight / 2}
                      width={clippedWidth}
                      height={actualItemHeight}
                    />
                  </clipPath>
                </defs>
                <rect
                  x={clippedStartX}
                  y={y - actualItemHeight / 2}
                  width={clippedWidth}
                  height={actualItemHeight}
                  fill={color}
                  stroke="#000"
                  strokeWidth={1}
                  rx={0}
                  className={`cursor-pointer hover:opacity-80 ${item.color === 'red' ? 'print-red-item' : 'print-blue-item'}`}
                  onClick={() => onItemClick(item)}
                />
                {/* Item label for bars - clipped to bar bounds */}
                <text
                  x={clippedStartX + clippedWidth / 2}
                  y={y - actualItemHeight / 2 + textLayout.fontSize + 2}
                  textAnchor="middle"
                  fontSize={textLayout.fontSize}
                  fill={textColor}
                  fontWeight="500"
                  className="pointer-events-none select-none"
                  clipPath={`url(#clip-bar-${item.id})`}
                >
                  {textLayout.lines.map((line, idx) => (
                    <tspan
                      key={idx}
                      x={clippedStartX + clippedWidth / 2}
                      dy={idx === 0 ? 0 : textLayout.fontSize + 2}
                      textAnchor="middle"
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </>
            )}
          </g>
        )}
        {/* Enhanced tooltip showing title and age range */}
        <title>
          {item.title}
          {isPoint ? ` (Age ${ages.start_age})` : ` (Age ${ages.start_age}-${effectiveEndAge})`}
          {item.description ? `\n${item.description}` : ''}
        </title>
      </g>
    );
  };

  const getCategoryColor = (color: 'blue' | 'red'): string => {
    return color === 'blue' ? "#bfdbfe" : "#fecaca"; // medium blue or medium red
  };

  const renderCategoryBackgrounds = (ageBarY: number) => {
    const backgrounds: ReactElement[] = [];
    
    // Top section backgrounds
    topCategories.forEach((category) => {
      const row = topRows[category.id];
      const y = getTopSectionY(row, category.id, categoryMaxStacks, categoryMaxHeights, topCategories);
      const height = getCategoryRowHeight(category.id, categoryMaxStacks, categoryMaxHeights);
      
      backgrounds.push(
        <rect
          key={`bg-top-${category.id}`}
          x={0}
          y={y - height / 2}
          width={TIMELINE_WIDTH}
          height={height}
          fill={getCategoryColor(category.color)}
          className={`pointer-events-none ${category.color === 'red' ? 'print-red-category' : 'print-blue-category'}`}
          opacity={0.6}
        />
      );
    });
    
    // Bottom section backgrounds
    bottomCategories.forEach((category) => {
      const row = bottomRows[category.id];
      const y = getBottomSectionY(row, category.id, categoryMaxStacks, ageBarY, categoryMaxHeights, bottomCategories);
      const height = getCategoryRowHeight(category.id, categoryMaxStacks, categoryMaxHeights);
      
      backgrounds.push(
        <rect
          key={`bg-bottom-${category.id}`}
          x={0}
          y={y - height / 2}
          width={TIMELINE_WIDTH}
          height={height}
          fill={getCategoryColor(category.color)}
          className={`pointer-events-none ${category.color === 'red' ? 'print-red-category' : 'print-blue-category'}`}
          opacity={0.6}
        />
      );
    });
    
    return backgrounds;
  };

  const renderCategoryLabels = (ageBarY: number) => {
    const labels: ReactElement[] = [];
    
    // Top section labels
    topCategories.forEach((category) => {
      const row = topRows[category.id];
      const y = getTopSectionY(row, category.id, categoryMaxStacks, categoryMaxHeights, topCategories);
      labels.push(
        <text
          key={category.id}
          x={-10}
          y={y + 5}
          textAnchor="end"
          fontSize={12 * zoom}
          fill="#666"
          fontWeight="500"
        >
          {category.label}
        </text>
      );
    });
    
    // Bottom section labels
    bottomCategories.forEach((category) => {
      const row = bottomRows[category.id];
      const y = getBottomSectionY(row, category.id, categoryMaxStacks, ageBarY, categoryMaxHeights, bottomCategories);
      labels.push(
        <text
          key={category.id}
          x={-10}
          y={y + 5}
          textAnchor="end"
          fontSize={12 * zoom}
          fill="#666"
          fontWeight="500"
        >
          {category.label}
        </text>
      );
    });
    
    return labels;
  };

  const ageBarY = getAgeBarY(categoryMaxStacks, categoryMaxHeights, topCategories);
  
  // Calculate the maximum width needed for category labels
  // Account for zoom level and longest label
  const maxLabelLength = Math.max(
    ...categories.map(cat => cat.label.length),
    3 // Minimum for "Age"
  );
  const labelFontSize = 12 * zoom;
  const estimatedLabelWidth = maxLabelLength * labelFontSize * 0.6; // Approximate character width
  const dynamicLeftPadding = Math.max(LEFT_LABEL_PADDING, estimatedLabelWidth + 10); // Add 10px buffer
  
  let topSectionHeight = 0;
  topCategories.forEach(cat => {
    topSectionHeight += getCategoryRowHeight(cat.id, categoryMaxStacks, categoryMaxHeights);
  });
  
  let bottomSectionHeight = 0;
  bottomCategories.forEach(cat => {
    bottomSectionHeight += getCategoryRowHeight(cat.id, categoryMaxStacks, categoryMaxHeights);
  });
  
  const totalHeight = 
    topSectionHeight + 
    SECTION_SPACING + 
    AGE_MARKER_HEIGHT + 
    SECTION_SPACING + 
    bottomSectionHeight + 
    20; // padding

  const topSectionEndY = topSectionHeight;
  const bottomSectionStartY = ageBarY + AGE_MARKER_HEIGHT + SECTION_SPACING;

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto print:shadow-none print:p-2 print:overflow-visible">
      <svg
        width={TIMELINE_WIDTH + dynamicLeftPadding + 50}
        height={totalHeight}
        viewBox={`-${dynamicLeftPadding} 0 ${TIMELINE_WIDTH + dynamicLeftPadding + 50} ${totalHeight}`}
        className="h-auto print:w-full print:h-auto"
        style={{ 
          minWidth: TIMELINE_WIDTH + dynamicLeftPadding + 50,
          maxWidth: '100%'
        }}
        data-print-width="100%"
        preserveAspectRatio="xMinYMin meet"
      >
        {/* Grid lines for top section */}
        {Array.from({ length: Math.floor(AGE_RANGE / 10) + 1 }, (_, i) => {
          const age = START_AGE + i * 10;
          if (age > START_AGE + AGE_RANGE) return null;
          const x = ageToX(age);
          return (
            <line
              key={`grid-top-${age}`}
              x1={x}
              y1={0}
              x2={x}
              y2={topSectionEndY}
              stroke="#e5e7eb"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        }).filter(Boolean)}
        
        {/* Grid lines for bottom section */}
        {Array.from({ length: Math.floor(AGE_RANGE / 10) + 1 }, (_, i) => {
          const age = START_AGE + i * 10;
          if (age > START_AGE + AGE_RANGE) return null;
          const x = ageToX(age);
          return (
            <line
              key={`grid-bottom-${age}`}
              x1={x}
              y1={bottomSectionStartY}
              x2={x}
              y2={totalHeight}
              stroke="#e5e7eb"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        }).filter(Boolean)}
        
        {/* Category background bands (drawn first) */}
        <g>{renderCategoryBackgrounds(ageBarY)}</g>
        
        {/* Current age indicator line */}
        {currentAge >= START_AGE && currentAge <= START_AGE + AGE_RANGE && (
          <line
            x1={ageToX(currentAge)}
            y1={0}
            x2={ageToX(currentAge)}
            y2={totalHeight}
            stroke="#10b981"
            strokeWidth={3}
            strokeDasharray="8,4"
            opacity={0.8}
          />
        )}
        
        {/* Category labels */}
        <g>{renderCategoryLabels(ageBarY)}</g>
        
        {/* Connection lines (drawn first so they appear behind items) */}
        <g>{items.map((item) => renderConnectionLine(item, ageBarY)).filter(Boolean)}</g>
        
        {/* Timeline items */}
        <g>{items.map((item) => renderItem(item, ageBarY))}</g>
        
        {/* Age markers (drawn last so they appear on top) */}
        <g>{renderAgeMarkers(ageBarY)}</g>
        
        {/* Age bar label */}
        <text
          x={-20}
          y={ageBarY + AGE_MARKER_HEIGHT / 2 + 4}
          textAnchor="end"
          fontSize={12 * zoom}
          fill="#666"
          fontWeight="500"
        >
          Age
        </text>
      </svg>
    </div>
  );
}

