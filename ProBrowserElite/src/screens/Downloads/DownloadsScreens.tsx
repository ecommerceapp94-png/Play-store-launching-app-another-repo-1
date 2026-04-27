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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { DownloadItem } from '../../types';
import { defaultDownloads } from '../../data/mockData';
import { DownloadCard } from '../../components/ui/CommonCards';
import { AIFloatingButton, AIAssistantSheet } from '../../components/ui/AIAssistant';
import { GlassCard, GradientButton } from '../../components/ui/GlassCard';
import {
  borderRadius,
  spacing,
  generateId,
  triggerHaptic,
  formatFileSize,
  getMimeTypeIcon,
} from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// DOWNLOADS HOME SCREEN - Level 1
// ============================================================================

type DownloadsNavigationProp = NativeStackNavigationProp<any, 'DownloadsHome'>;

export const DownloadsHomeScreen: React.FC = () => {
  const navigation = useNavigation<DownloadsNavigationProp>();
  const { isDarkMode, colors, gradients } = useTheme();
  const [downloads, setDownloads] = useState<DownloadItem[]>(defaultDownloads);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'downloading' | 'failed'>('all');

  useFocusEffect(
    useCallback(() => {
      // Simulate progress updates
      const interval = setInterval(() => {
        setDownloads((prev) =>
          prev.map((d) => {
            if (d.status === 'downloading' && d.progress < 100) {
              return { ...d, progress: Math.min(d.progress + 10, 100) };
            }
            if (d.status === 'downloading' && d.progress >= 100) {
              return { ...d, status: 'completed' as const, progress: 100 };
            }
            return d;
          })
        );
      }, 1000);

      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    triggerHaptic('medium');
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const filteredDownloads = useMemo(() => {
    if (filter === 'all') return downloads;
    if (filter === 'completed') return downloads.filter((d) => d.status === 'completed');
    if (filter === 'downloading') return downloads.filter((d) => d.status === 'downloading' || d.status === 'paused');
    if (filter === 'failed') return downloads.filter((d) => d.status === 'failed');
    return downloads;
  }, [downloads, filter]);

  const handleDownloadPress = useCallback(
    (download: DownloadItem) => {
      triggerHaptic('light');
      navigation.navigate('FilePreview', { downloadId: download.id });
    },
    [navigation]
  );

  const handleClearCompleted = () => {
    triggerHaptic('medium');
    Alert.alert(
      'Clear Completed',
      'Remove all completed downloads from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () =>
            setDownloads((prev) => prev.filter((d) => d.status !== 'completed')),
        },
      ]
    );
  };

  const totalSize = useMemo(
    () => downloads.reduce((sum, d) => sum + d.fileSize, 0),
    [downloads]
  );

  const completedCount = useMemo(
    () => downloads.filter((d) => d.status === 'completed').length,
    [downloads]
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
          <Text style={styles.headerTitle}>Downloads</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DownloadSettings', {})}>
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {downloads.length} files · {formatFileSize(totalSize)} · {completedCount} completed
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'downloading', 'completed', 'failed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color: filter === f ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {filteredDownloads.map((download) => (
          <DownloadCard
            key={download.id}
            id={download.id}
            title={download.title}
            fileSize={download.fileSize}
            mimeType={download.mimeType}
            progress={download.progress}
            status={download.status}
            onPress={() => handleDownloadPress(download)}
            onLongPress={() => handleDownloadPress(download)}
          />
        ))}

        {filteredDownloads.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {filter !== 'all' ? filter : ''} downloads
            </Text>
          </View>
        )}

        {/* Clear Button */}
        {completedCount > 0 && (
          <TouchableOpacity
            onPress={handleClearCompleted}
            style={[styles.clearButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.clearButtonText, { color: colors.error }]}>
              Clear Completed
            </Text>
          </TouchableOpacity>
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
            context="Downloads show all your downloaded files. You can preview images, PDFs, and other files, share them, or manage their settings. What would you like to do?"
          />
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// FILE PREVIEW SCREEN - Level 2
// ============================================================================

type FilePreviewNavigationProp = NativeStackNavigationProp<any, 'FilePreview'>;

export const FilePreviewScreen: React.FC = () => {
  const navigation = useNavigation<FilePreviewNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'FilePreview')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();

  const download = defaultDownloads.find((d) => d.id === route?.downloadId);

  const getMimeTypeCategory = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    return 'file';
  };

  const handleShare = () => {
    triggerHaptic('light');
    Alert.alert('Share', 'Sharing file...');
  };

  const handleDelete = () => {
    triggerHaptic('heavy');
    Alert.alert('Delete', 'Delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handleMove = () => {
    triggerHaptic('light');
    Alert.alert('Move', 'Move file to...');
  };

  const getPreviewEmoji = (): string => {
    switch (getMimeTypeCategory(download?.mimeType || '')) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'pdf': return '📄';
      case 'spreadsheet': return '📊';
      case 'presentation': return '📽️';
      case 'document': return '📝';
      default: return '📁';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.previewTitleContainer}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {download?.title || 'File'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('FileOptions', { downloadId: download?.id })}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Preview Area */}
      <View style={styles.previewArea}>
        <LinearGradient
          colors={
            isDarkMode
              ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']
              : ['rgba(255, 255, 255, 0.98)', 'rgba(241, 245, 249, 0.99)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewCard}
        >
          <Text style={styles.previewEmoji}>{getPreviewEmoji()}</Text>
          <Text style={[styles.previewFileName, { color: colors.text }]}>
            {download?.title}
          </Text>
          <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
            {download?.mimeType} · {download?.fileSize ? formatFileSize(download.fileSize) : 'Unknown size'}
          </Text>
          <Text style={[styles.previewStatus, { color: colors.primary }]}>
            {download?.status.charAt(0).toUpperCase() + download?.status.slice(1)}
          </Text>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.previewActions}>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>📤</Text>
          <Text style={[styles.previewActionLabel, { color: colors.text }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleMove}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>📁</Text>
          <Text style={[styles.previewActionLabel, { color: colors.text }]}>Move</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>🗑️</Text>
          <Text style={[styles.previewActionLabel, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// FILE OPTIONS SCREEN - Level 3
// ============================================================================

type FileOptionsNavigationProp = NativeStackNavigationProp<any, 'FileOptions'>;

export const FileOptionsScreen: React.FC = () => {
  const navigation = useNavigation<FileOptionsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'FileOptions')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();

  const download = defaultDownloads.find((d) => d.id === route?.downloadId);

  const handleShare = () => {
    triggerHaptic('light');
    // Share
  };

  const handleRename = () => {
    triggerHaptic('light');
    Alert.prompt('Rename', 'Enter new name', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Rename', onPress: () => {} },
    ], 'plain-text', download?.title);
  };

  const handleCopy = () => {
    triggerHaptic('light');
    Alert.alert('Copied', 'File path copied to clipboard');
  };

  const handleDelete = () => {
    triggerHaptic('heavy');
    Alert.alert('Delete', 'Delete this file permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const options = [
    { id: 'share', icon: '📤', label: 'Share', action: handleShare },
    { id: 'rename', icon: '✏️', label: 'Rename', action: handleRename },
    { id: 'copy', icon: '📋', label: 'Copy Path', action: handleCopy },
    { id: 'info', icon: 'ℹ️', label: 'File Info', action: () => {} },
    { id: 'delete', icon: '🗑️', label: 'Delete', action: handleDelete, destructive: true },
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
            <Text style={styles.optionsEmoji}>📄</Text>
            <Text style={[styles.optionsFileName, { color: colors.text }]}>
              {download?.title}
            </Text>
            <Text style={[styles.optionsMeta, { color: colors.textSecondary }]}>
              {download?.filePath}
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
// DOWNLOAD SETTINGS SCREEN - Level 4
// ============================================================================

type DownloadSettingsNavigationProp = NativeStackNavigationProp<any, 'DownloadSettings'>;

export const DownloadSettingsScreen: React.FC = () => {
  const navigation = useNavigation<DownloadSettingsNavigationProp>();
  const { isDarkMode, colors, gradients } = useTheme();
  const [downloadLocation, setDownloadLocation] = useState('/downloads');
  const [wifiOnly, setWifiOnly] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoOpen, setAutoOpen] = useState(false);

  const handleSave = () => {
    triggerHaptic('medium');
    Alert.alert('Saved', 'Download settings updated');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.settingsHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.settingsTitle}>Download Settings</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.settingsScroll}>
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Storage</Text>
          <GlassCard style={styles.inputCard} borderRadiusSize="lg">
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Download Location
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputText, { color: colors.text }]}>{downloadLocation}</Text>
              <TouchableOpacity>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Network</Text>
          <TouchableOpacity
            onPress={() => setWifiOnly(!wifiOnly)}
            style={[styles.settingItem, { backgroundColor: colors.card }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Download over Wi-Fi only</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Save mobile data
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: wifiOnly ? colors.primary : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: wifiOnly ? 20 : 0 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Behavior
          </Text>
          <TouchableOpacity
            onPress={() => setNotifications(!notifications)}
            style={[styles.settingItem, { backgroundColor: colors.card }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Notify when download completes
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: notifications ? colors.primary : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: notifications ? 20 : 0 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAutoOpen(!autoOpen)}
            style={[styles.settingItem, { backgroundColor: colors.card }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto-open
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Open files after download
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: autoOpen ? colors.primary : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: autoOpen ? 20 : 0 }] },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.storageInfo}>
          <Text style={styles.storageInfoEmoji}>💾</Text>
          <Text style={[styles.storageInfoText, { color: colors.textSecondary }]}>
            Storage used: {formatFileSize(0)}
          </Text>
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
  settingsText: {
    fontSize: 24,
  },
  statsRow: {
    marginTop: spacing.sm,
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
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
  clearButton: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Preview screen styles
  previewHeader: {
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
  previewTitleContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  previewArea: {
    flex: 1,
    padding: spacing.lg,
  },
  previewCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  previewFileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  previewMeta: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  previewStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    paddingBottom: 100,
  },
  previewActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  previewActionEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  previewActionLabel: {
    fontSize: 12,
    fontWeight: '500',
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
  placeholder: {
    width: 40,
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
  optionsFileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  optionsMeta: {
    fontSize: 12,
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
  // Settings screen styles
  settingsHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsScroll: {
    flex: 1,
  },
  settingsSection: {
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  inputCard: {
    padding: spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 15,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  storageInfoEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  storageInfoText: {
    fontSize: 14,
  },
});
// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
  );
};

// ============================================================================
// DOWNLOADS EXTENDED PREMIUM - Additional Features
// ============================================================================

interface DownloadExtendedProps {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: string;
}

export const DownloadExtendedCardV2: React.FC<DownloadExtendedProps> = ({ filename, size, progress, status }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => {}} style={[styles.downloadExtendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.downloadExtendedName, { color: colors.text }]}>{filename}</Text>
      <Text style={[styles.downloadExtendedSize, { color: colors.textSecondary }]}>{size}MB</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${progress}%` }]} />
      </View>
      <Text style={[styles.downloadExtendedStatus, { color: colors.text }]}>{status}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Download Queue Manager
// ============================================================================

interface DownloadQueueProps {
  downloads: DownloadExtendedProps[];
  onReorder: (from: number, to: number) => void;
}

export const DownloadQueueManagerV2: React.FC<DownloadQueueProps> = ({ downloads, onReorder }) => {
  const { colors } = useTheme();
  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <DownloadExtendedCard {...item} />
      )}
      style={[styles.queueList, { backgroundColor: colors.background }]}
    />
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
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
// ============================================================================
// ADDITIONAL DOWNLOAD FEATURE
// ============================================================================
const DownloadFeature = () => null;
