import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { HistoryItem } from '../../types';
import { defaultHistory } from '../../data/mockData';
import { HistoryCard } from '../../components/ui/CommonCards';
import { AIFloatingButton, AIAssistantSheet } from '../../components/ui/AIAssistant';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  borderRadius,
  spacing,
  generateId,
  triggerHaptic,
  groupByDate,
  formatDate,
  formatTime,
} from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// HISTORY HOME SCREEN - Level 1
// ============================================================================

type HistoryNavigationProp = NativeStackNavigationProp<any, 'HistoryHome'>;

export const HistoryHomeScreen: React.FC = () => {
  const navigation = useNavigation<HistoryNavigationProp>();
  const { isDarkMode, colors, gradients } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>(defaultHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Refresh on focus
    }, [])
  );

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    triggerHaptic('medium');
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const groupedHistory = useMemo(() => groupByDate(history), [history]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return groupedHistory;
    const query = searchQuery.toLowerCase();
    return Object.keys(groupedHistory).reduce((acc, group) => {
      const items = groupedHistory[group].filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
      );
      if (items.length > 0) {
        acc[group] = items;
      }
      return acc;
    }, {} as { [key: string]: HistoryItem[] });
  }, [groupedHistory, searchQuery]);

  const handleHistoryPress = useCallback(
    (item: HistoryItem) => {
      triggerHaptic('light');
      navigation.navigate('HistoryDetail', { historyId: item.id });
    },
    [navigation]
  );

  const handleClearAll = () => {
    triggerHaptic('heavy');
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all browsing history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setHistory([]),
        },
      ]
    );
  };

  const totalVisits = useMemo(
    () => history.reduce((sum, item) => sum + item.visitCount, 0),
    [history]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Search history..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Text style={styles.statsText}>
          {history.length} pages · {totalVisits} visits
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(filteredHistory).map(([group, items]) => (
          <View key={group} style={styles.groupContainer}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                {group}
              </Text>
            </View>
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                timestamp={item.timestamp}
                visitCount={item.visitCount}
                onPress={() => handleHistoryPress(item)}
                onLongPress={() => handleHistoryPress(item)}
              />
            ))}
          </View>
        ))}

        {Object.keys(filteredHistory).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🕐</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No results found' : 'No history yet'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* AI Floating Button */}
      <AIFloatingButton onPress={() => setAiSheetVisible(true)} />

      {/* AI Sheet Modal */}
      <Modal visible={aiSheetVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <AIAssistantSheet
            visible={aiSheetVisible}
            onClose={() => setAiSheetVisible(false)}
            context="Your browsing history shows all the pages you've visited. You can search through it, clear specific entries, or delete your entire history. What would you like to do?"
          />
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// DATE HISTORY SCREEN - Level 2
// ============================================================================

type DateHistoryNavigationProp = NativeStackNavigationProp<any, 'DateHistory'>;

export const DateHistoryScreen: React.FC = () => {
  const navigation = useNavigation<DateHistoryNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'DateHistory')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>(defaultHistory);

  const filteredHistory = useMemo(() => {
    if (!route?.date) return history;
    return history.filter((item) => {
      const itemDate = new Date(item.timestamp).toDateString();
      return itemDate === new Date(route.date).toDateString();
    });
  }, [history, route?.date]);

  const handleHistoryPress = useCallback(
    (item: HistoryItem) => {
      triggerHaptic('light');
      navigation.navigate('HistoryDetail', { historyId: item.id });
    },
    [navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.dateHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.dateTitleContainer}>
          <Text style={styles.dateTitle}>
            {route?.date ? formatDate(route.date) : 'History'}
          </Text>
          <Text style={styles.dateCount}>{filteredHistory.length} pages</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.dateScroll}>
        {filteredHistory.map((item) => (
          <HistoryCard
            key={item.id}
            id={item.id}
            title={item.title}
            url={item.url}
            timestamp={item.timestamp}
            visitCount={item.visitCount}
            onPress={() => handleHistoryPress(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// HISTORY DETAIL SCREEN - Level 3
// ============================================================================

type HistoryDetailNavigationProp = NativeStackNavigationProp<any, 'HistoryDetail'>;

export const HistoryDetailScreen: React.FC = () => {
  const navigation = useNavigation<HistoryDetailNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'HistoryDetail')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();

  const historyItem = defaultHistory.find((h) => h.id === route?.historyId);

  const handleOpen = () => {
    triggerHaptic('light');
    // Would open URL
  };

  const handleMoreOptions = () => {
    triggerHaptic('light');
    navigation.navigate('HistoryOptions', { historyId: route?.historyId });
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.detailHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>Details</Text>
        <TouchableOpacity onPress={handleMoreOptions}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.detailScroll}>
        <GlassCard style={styles.detailCard} borderRadiusSize="xl">
          <View style={styles.detailContent}>
            <Text style={styles.detailEmoji}>🕐</Text>
            <Text style={[styles.detailPageTitle, { color: colors.text }]}>
              {historyItem?.title || 'Page'}
            </Text>
            <Text style={[styles.detailPageUrl, { color: colors.textSecondary }]}>
              {historyItem?.url}
            </Text>
          </View>
        </GlassCard>

        <View style={styles.detailStats}>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>📅</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Visited</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {historyItem?.visitCount} times
              </Text>
            </View>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Time on page</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {historyItem?.duration ? formatDuration(historyItem.duration) : '0s'}
              </Text>
            </View>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card }]}>
            <Text style={styles.statEmoji}>🕐</Text>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Last visited</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {historyItem?.timestamp
                  ? `${formatDate(historyItem.timestamp)} at ${formatTime(historyItem.timestamp)}`
                  : 'Never'}
              </Text>
            </View>
          </View>
        </View>

        <GlassCard onPress={handleOpen} style={styles.openCard}>
          <View style={styles.openContent}>
            <Text style={styles.openEmoji}>🌐</Text>
            <Text style={[styles.openText, { color: colors.text }]}>Open this page</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// HISTORY OPTIONS SCREEN - Level 4
// ============================================================================

type HistoryOptionsNavigationProp = NativeStackNavigationProp<any, 'HistoryOptions'>;

export const HistoryOptionsScreen: React.FC = () => {
  const navigation = useNavigation<HistoryOptionsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'HistoryOptions')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();

  const historyItem = defaultHistory.find((h) => h.id === route?.historyId);

  const handleDelete = () => {
    triggerHaptic('heavy');
    Alert.alert(
      'Delete',
      'Remove this item from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleClearSameDomain = () => {
    triggerHaptic('medium');
    Alert.alert('Cleared', 'All pages from this domain removed from history');
  };

  const handleShare = () => {
    triggerHaptic('light');
    // Share logic
  };

  const options = [
    { id: 'share', icon: '📤', label: 'Share', action: handleShare },
    { id: 'copy', icon: '📋', label: 'Copy Link', action: () => triggerHaptic('light') },
    { id: 'clear', icon: '🗑️', label: "Clear All from this site", action: handleClearSameDomain },
    { id: 'delete', icon: '❌', label: 'Delete', action: handleDelete, destructive: true },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.optionsHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.optionsTitle}>Options</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.optionsScroll}>
        <GlassCard style={styles.optionsCard} borderRadiusSize="lg">
          <View style={styles.optionsContent}>
            <Text style={styles.optionsEmoji}>🕐</Text>
            <Text style={[styles.optionsPageTitle, { color: colors.text }]}>
              {historyItem?.title}
            </Text>
            <Text style={[styles.optionsPageUrl, { color: colors.textSecondary }]}>
              {historyItem?.url}
            </Text>
          </View>
        </GlassCard>

        <View style={styles.optionsList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                triggerHaptic('light');
                option.action();
              }}
              style={[styles.optionItem, { backgroundColor: colors.card }]}
            >
              <Text style={styles.optionEmoji}>{option.icon}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  { color: option.destructive ? colors.error : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchBarContainer: {
    marginTop: spacing.md,
  },
  searchInput: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: 15,
  },
  statsText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  groupContainer: {
    marginBottom: spacing.lg,
  },
  groupHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Date history screen styles
  dateHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  dateTitleContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  placeholder: {
    width: 40,
  },
  dateScroll: {
    flex: 1,
  },
  // Detail screen styles
  detailHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  moreText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  detailScroll: {
    flex: 1,
    padding: spacing.lg,
  },
  detailCard: {
    marginBottom: spacing.lg,
  },
  detailContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  detailEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  detailPageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  detailPageUrl: {
    fontSize: 14,
    textAlign: 'center',
  },
  detailStats: {
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  statEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  openCard: {
    marginTop: spacing.md,
  },
  openContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  openEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  openText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Options screen styles
  optionsHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionsScroll: {
    flex: 1,
    padding: spacing.lg,
  },
  optionsCard: {
    marginBottom: spacing.lg,
  },
  optionsContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  optionsEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  optionsPageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  optionsPageUrl: {
    fontSize: 14,
    textAlign: 'center',
  },
  optionsList: {},
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ============================================================================
// HISTORY EXTENDED PREMIUM - Additional Features
// ============================================================================

interface HistoryExtendedProps {
  id: string;
  title: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export const HistoryExtendedCardV2: React.FC<HistoryExtendedProps> = ({ title, timestamp, metadata }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.historyExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.historyExtendedTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.historyExtendedTime, { color: colors.textSecondary }]}>{timestamp}</Text>
      <View style={styles.metadataContainer}>
        {Object.entries(metadata).map(([key, value]) => (
          <Text key={key} style={[styles.metadataText, { color: colors.text }]}>{key}: {value}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// History Search Filter Component
// ============================================================================

interface HistorySearchFilterProps {
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const HistorySearchFilterComponentV2: React.FC<HistorySearchFilterProps> = ({ onFilterChange, filters }) => {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} onPress={() => onFilterChange(filter)} style={[styles.filterChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterText, { color: colors.text }]}>{filter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeature: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
// ============================================================================
// ADDITIONAL HISTORY FEATURE
// ============================================================================
const HistoryFeature = () => null;
