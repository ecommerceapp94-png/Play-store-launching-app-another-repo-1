// ============================================================================
// PRO BROWSER ELITE - Premium Browser App TypeScript Interfaces
// ============================================================================

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface SpeedDial {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  category: 'social' | 'news' | 'shopping' | 'entertainment' | 'productivity' | 'utilities';
  favicon?: string;
  visitCount: number;
  lastVisited?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  timestamp: number;
  scrollPosition: number;
  zoomLevel: number;
  isPinned: boolean;
  isMuted: boolean;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  description?: string;
  folderId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  timestamp: string;
  visitCount: number;
  duration: number;
}

export interface DownloadItem {
  id: string;
  title: string;
  url: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  thumbnail?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultSearchEngine: string;
  homepage: string;
  enableJavaScript: boolean;
  enableCookies: boolean;
  blockPopups: boolean;
  clearOnExit: boolean;
  downloadLocation: string;
  notifications: boolean;
  hapticFeedback: boolean;
  animations: boolean;
  dataSaver: boolean;
  doNotTrack: boolean;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type RootStackParamList = {
  MainTabs: undefined;
  WebViewScreen: { tabId: string; url: string };
};

export type BrowserStackParamList = {
  BrowserHome: undefined;
  BrowserWebView: { tabId: string; url: string };
  URLEditor: { currentUrl?: string };
  ContextMenu: { url: string; title: string };
};

export type TabsManagerStackParamList = {
  TabsManagerHome: undefined;
  TabPreview: { tabId: string };
  TabSettings: { tabId: string };
  TabAdvancedSettings: { tabId: string };
};

export type BookmarksStackParamList = {
  BookmarksHome: undefined;
  FolderContents: { folderId: string };
  BookmarkOptions: { bookmarkId: string };
  OrganizeBookmarks: { folderId?: string };
};

export type HistoryStackParamList = {
  HistoryHome: undefined;
  DateHistory: { date: string };
  HistoryDetail: { historyId: string };
  HistoryOptions: { historyId: string };
};

export type DownloadsStackParamList = {
  DownloadsHome: undefined;
  FilePreview: { downloadId: string };
  FileOptions: { downloadId: string };
  DownloadSettings: undefined;
};

export type MainTabParamList = {
  Browser: undefined;
  TabsManager: undefined;
  Bookmarks: undefined;
  History: undefined;
  Downloads: undefined;
};

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface GlassCardProps {
  children: React.ReactNode;
  style?: object;
  intensity?: 'light' | 'medium' | 'heavy';
  borderRadius?: number;
  padding?: number;
  onPress?: () => void;
}

export interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  delay?: number;
}

export interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface BottomSheetOption {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface AISuggestion {
  id: string;
  text: string;
  icon?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  gradients: ThemeGradients;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  glass: string;
  glassBorder: string;
}

export interface ThemeGradients {
  primary: string[];
  secondary: string[];
  background: string[];
  card: string[];
  header: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface WebViewState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  progress: number;
  error?: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'history' | 'bookmark' | 'search' | 'website';
  icon?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface PullToRefreshEvent {
  refreshing: boolean;
  onRefresh: () => void;
}

export interface InfiniteScrollEvent {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

// ============================================================================
// ANIMATION TYPES
// ============================================================================

export interface MicroAnimationConfig {
  type: 'scale' | 'spring' | 'fade' | 'slide';
  duration?: number;
  tension?: number;
  friction?: number;
  delay?: number;
}

export interface GestureConfig {
  onPress?: () => void;
  onLongPress?: () => void;
  onDoublePress?: () => void;
  onPan?: (translateX: number, translateY: number) => void;
  onPinch?: (scale: number) => void;
  onRotate?: (rotation: number) => void;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageKeys {
  SETTINGS: '@pro_browser/settings';
  TABS: '@pro_browser/tabs';
  BOOKMARKS: '@pro_bookmarks/folders';
  BOOKMARK_ITEMS: '@pro_bookmarks/items';
  HISTORY: '@pro_browser/history';
  DOWNLOADS: '@pro_browser/downloads';
  FAVORITES: '@pro_browser/favorites';
  AI_CONVERSATIONS: '@pro_browser/ai_conversations';
  THEME: '@pro_browser/theme';
  SPEED_DIALS: '@pro_browser/speed_dials';
}