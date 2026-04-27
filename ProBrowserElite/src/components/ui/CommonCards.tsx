import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { SpeedDial } from '../../types';
import { borderRadius, spacing, createGlassStyle, triggerHaptic } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAL_SIZE = (SCREEN_WIDTH - spacing.lg * 3) / 4;

// ============================================================================
// SPEED DIAL COMPONENT - Premium tappable speed dial for browser home
// ============================================================================

interface SpeedDialItemProps {
  dial: SpeedDial;
  onPress: () => void;
  onLongPress?: () => void;
  index: number;
}

export const SpeedDialItem: React.FC<SpeedDialItemProps> = ({
  dial,
  onPress,
  onLongPress,
  index,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
    triggerHaptic('light');
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const getIconText = (): string => {
    const iconMap: { [key: string]: string } = {
      'search': '🔍',
      'play-circle': '▶️',
      'shopping-cart': '🛒',
      'twitter': '🐦',
      'github': '🐙',
      'reddit-alien': '🤖',
      'film': '🎬',
      'linkedin': '💼',
      'wikipedia-w': '📚',
      'discord': '💬',
      'stack-overflow': '💻',
      'instagram': '📷',
    };
    return iconMap[dial.icon] || '🌐';
  };

  return (
    <Animated.View
      style={[
        styles.dialContainer,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={1}
        style={styles.dialTouchable}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']
              : ['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.98)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dialCard}
        >
          <View style={[styles.dialIconContainer, { backgroundColor: dial.color + '20' }]}>
            <Text style={[styles.dialIcon, { fontSize: dial.name.length > 10 ? 16 : 24 }]}>
              {getIconText()}
            </Text>
          </View>
          <Text
            style={[
              styles.dialName,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {dial.name}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// SPEED DIAL GRID - Grid of all speed dials
// ============================================================================

interface SpeedDialGridProps {
  dials: SpeedDial[];
  onDialPress: (dial: SpeedDial) => void;
  onDialLongPress?: (dial: SpeedDial) => void;
}

export const SpeedDialGrid: React.FC<SpeedDialGridProps> = ({
  dials,
  onDialPress,
  onDialLongPress,
}) => {
  return (
    <View style={styles.gridContainer}>
      {dials.map((dial, index) => (
        <SpeedDialItem
          key={dial.id}
          dial={dial}
          onPress={() => onDialPress(dial)}
          onLongPress={onDialLongPress ? () => onDialLongPress(dial) : undefined}
          index={index}
        />
      ))}
    </View>
  );
};

// ============================================================================
// BROWSER TAB CARD - Display tab in tabs manager
// ============================================================================

interface BrowserTabCardProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  isPinned: boolean;
  onPress: () => void;
  onClose?: () => void;
  onLongPress?: () => void;
}

export const BrowserTabCard: React.FC<BrowserTabCardProps> = ({
  id,
  title,
  url,
  favicon,
  isLoading,
  isPinned,
  onPress,
  onClose,
  onLongPress,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
    triggerHaptic('medium');
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const extractDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={1}
        style={styles.tabCard}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']
              : ['rgba(255, 255, 255, 0.98)', 'rgba(241, 245, 249, 0.99)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabCardContent}
        >
          <View style={styles.tabHeader}>
            {isPinned && (
              <View style={styles.pinnedIndicator}>
                <Text style={styles.pinnedText}>📌</Text>
              </View>
            )}
            {isLoading && (
              <View style={styles.loadingIndicator}>
                <Animated.View style={styles.loadingSpinner} />
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tabPreview}>
            <Text style={styles.previewText}>📄</Text>
          </View>
          <Text style={styles.tabTitle} numberOfLines={1}>
            {title || 'New Tab'}
          </Text>
          <Text style={styles.tabUrl} numberOfLines={1}>
            {extractDomain(url)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// BOOKMARK CARD - Display bookmark item
// ============================================================================

interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  tags: string[];
  onPress: () => void;
  onLongPress?: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  id,
  title,
  url,
  favicon,
  tags,
  onPress,
  onLongPress,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
    triggerHaptic('light');
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const extractDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={1}
        style={styles.bookmarkCard}
      >
        <View style={styles.bookmarkIcon}>
          <Text style={styles.bookmarkEmoji}>🔖</Text>
        </View>
        <View style={styles.bookmarkInfo}>
          <Text style={[styles.bookmarkTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.bookmarkUrl, { color: colors.textSecondary }]} numberOfLines={1}>
            {extractDomain(url)}
          </Text>
          {tags.length > 0 && (
            <View style={styles.tagContainer}>
              {tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// HISTORY CARD - Display history item
// ============================================================================

interface HistoryCardProps {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  visitCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  id,
  title,
  url,
  timestamp,
  visitCount,
  onPress,
  onLongPress,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
    triggerHaptic('light');
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const extractDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={1}
        style={styles.historyCard}
      >
        <View style={styles.historyIcon}>
          <Text style={styles.historyEmoji}>🕐</Text>
        </View>
        <View style={styles.historyInfo}>
          <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.historyUrl, { color: colors.textSecondary }]} numberOfLines={1}>
            {extractDomain(url)}
          </Text>
          <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
            {formatTime(timestamp)} · {visitCount} visit{visitCount > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// DOWNLOAD CARD - Display download item
// ============================================================================

interface DownloadCardProps {
  id: string;
  title: string;
  fileSize: number;
  mimeType: string;
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  onPress: () => void;
  onLongPress?: () => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  id,
  title,
  fileSize,
  mimeType,
  progress,
  status,
  onPress,
  onLongPress,
}) => {
  const { isDarkMode, colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
    triggerHaptic('light');
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 200,
    }).start();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  const getStatusEmoji = (): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'downloading':
        return '⬇️';
      case 'paused':
        return '⏸️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📄';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'downloading':
        return colors.primary;
      case 'paused':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        activeOpacity={1}
        style={styles.downloadCard}
      >
        <View style={styles.downloadIcon}>
          <Text style={styles.downloadEmoji}>{getStatusEmoji()}</Text>
        </View>
        <View style={styles.downloadInfo}>
          <Text style={[styles.downloadTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.downloadMeta, { color: colors.textSecondary }]}>
            {formatFileSize(fileSize)} ·{' '}
            <Text style={{ color: getStatusColor() }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </Text>
          {(status === 'downloading' || status === 'paused') && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progress}%`,
                    backgroundColor:
                      status === 'paused' ? colors.warning : colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </View>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE + 30,
    marginBottom: spacing.lg,
  },
  dialTouchable: {
    flex: 1,
  },
  dialCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dialIcon: {
    textAlign: 'center',
  },
  dialName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabCard: {
    width: SCREEN_WIDTH * 0.45,
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  tabCardContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pinnedIndicator: {
    fontSize: 12,
  },
  pinnedText: {
    fontSize: 14,
  },
  loadingIndicator: {
    width: 16,
    height: 16,
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#6366F1',
  },
  closeButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  tabPreview: {
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  previewText: {
    fontSize: 32,
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tabUrl: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  bookmarkIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookmarkEmoji: {
    fontSize: 22,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bookmarkUrl: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  arrowText: {
    fontSize: 24,
    color: '#94A3B8',
    marginLeft: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyEmoji: {
    fontSize: 22,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  historyUrl: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  historyMeta: {
    fontSize: 12,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  downloadIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  downloadEmoji: {
    fontSize: 22,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  downloadMeta: {
    fontSize: 13,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
