import { useState, useCallback, useRef, useEffect } from 'react';
import { ViewStyle, Animated, Easing } from 'react-native';

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

export const createAnimation = (
  initialValue: number = 0,
  useNativeDriver: boolean = true
) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;

  const animate = useCallback(
    (toValue: number, duration: number = 300, easing?: (value: number) => number) => {
      return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing,
        useNativeDriver,
      });
    },
    [animatedValue]
  );

  const spring = useCallback(
    (toValue: number, config?: Partial<Animated.SpringAnimationConfig>) => {
      return Animated.spring(animatedValue, {
        toValue,
        useNativeDriver,
        ...config,
      });
    },
    [animatedValue]
  );

  return { animatedValue, animate, spring };
};

export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// ============================================================================
// SCREEN DIMENSIONS
// ============================================================================

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

// ============================================================================
// STYLE HELPERS
// ============================================================================

export const createGlassStyle = (
  isDarkMode: boolean,
  intensity: 'light' | 'medium' | 'heavy' = 'medium'
): ViewStyle => {
  const opacityMap = {
    light: 0.5,
    medium: 0.7,
    heavy: 0.9,
  };

  return {
    backgroundColor: isDarkMode
      ? `rgba(30, 41, 59, ${opacityMap[intensity]})`
      : `rgba(255, 255, 255, ${opacityMap[intensity]})`,
    borderWidth: 1,
    borderColor: isDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',
  };
};

export const createShadowStyle = (
  isDarkMode: boolean,
  elevation: number = 4
): ViewStyle => {
  if (isDarkMode) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.3,
      shadowRadius: elevation,
      elevation,
    };
  }

  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.1,
    shadowRadius: elevation,
    elevation,
  };
};

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatTime = (dateString: string): string => {
  const date_2 = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
};

export const getMimeTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf')) return 'file-pdf-o';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'file-excel-o';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'file-powerpoint-o';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-word-o';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'file-zip-o';
  return 'file';
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
};

export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// DEBOOUNCE AND THROTTLE
// ============================================================================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ============================================================================
// UNIQUE ID GENERATOR
// ============================================================================

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// GROUP DATA BY DATE
// ============================================================================

export const groupByDate = <T extends { timestamp: string }>(
  items: T[]
): { [key: string]: T[] } => {
  const groups: { [key: string]: T[] } = {
    Today: [],
    Yesterday: [],
    'Last Week': [],
    'Last Month': [],
    Older: [],
  };

  const now_2 = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);
  const lastMonth = new Date(today.getTime() - 30 * 86400000);

  items.forEach((item) => {
    const date_3 = new Date(item.timestamp);
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() >= today.getTime()) {
      groups['Today'].push(item);
    } else if (itemDate.getTime() >= yesterday.getTime()) {
      groups['Yesterday'].push(item);
    } else if (itemDate.getTime() >= lastWeek.getTime()) {
      groups['Last Week'].push(item);
    } else if (itemDate.getTime() >= lastMonth.getTime()) {
      groups['Last Month'].push(item);
    } else {
      groups['Older'].push(item);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
};

// ============================================================================
// HAPTIC FEEDBACK TRIGGER
// ============================================================================

// Note: In a real app, this would use expo-haptics or react-native-haptic-feedback
// For this implementation, we'll create a placeholder function
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' = 'medium'): void => {
  // This is a placeholder - actual implementation depends on the haptic library
  console.log(`Haptic feedback: ${type}`);
};

// ============================================================================
// SCROLL TO REFRESH CONFIG
// ============================================================================

export const pullToRefreshConfig = {
  refreshing: false,
  onRefresh: () => {},
  showsVerticalScrollIndicator: false,
  contentContainerStyle: {
    paddingBottom: 100,
  },
};

// ============================================================================
// INFINITE SCROLL CONFIG
// ============================================================================

export const infiniteScrollConfig = {
  pageSize: 20,
  initialLoadSize: 20,
};

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  SETTINGS: '@pro_browser/settings',
  TABS: '@pro_browser/tabs',
  BOOKMARKS: '@pro_bookmarks/folders',
  BOOKMARK_ITEMS: '@pro_bookmarks/items',
  HISTORY: '@pro_browser/history',
  DOWNLOADS: '@pro_browser/downloads',
  FAVORITES: '@pro_browser/favorites',
  AI_CONVERSATIONS: '@pro_browser/ai_conversations',
  THEME: '@pro_browser/theme',
  SPEED_DIALS: '@pro_browser/speed_dials',
};