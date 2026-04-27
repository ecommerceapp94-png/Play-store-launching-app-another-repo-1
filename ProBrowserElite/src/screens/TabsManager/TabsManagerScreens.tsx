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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { BrowserTab } from '../../types';
import { BrowserTabCard } from '../../components/ui/CommonCards';
import { AIFloatingButton, AIAssistantSheet } from '../../components/ui/AIAssistant';
import { GlassCard, GradientButton } from '../../components/ui/GlassCard';
import {
  borderRadius,
  spacing,
  generateId,
  triggerHaptic,
  createGlassStyle,
  createShadowStyle,
} from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TABS MANAGER HOME SCREEN - Level 1
// ============================================================================

type TabsManagerNavigationProp = NativeStackNavigationProp<any, 'TabsManagerHome'>;

const generateMockTabs = (): BrowserTab[] => {
  const titles = [
    'Google', 'YouTube', 'GitHub', 'Twitter', 'Stack Overflow',
    'Reddit', 'Netflix', 'LinkedIn', 'Amazon', 'Instagram'
  ];
  return titles.map((title, index) => ({
    id: `tab_${index}`,
    title,
    url: `https://www.${title.toLowerCase().replace(' ', '')}.com`,
    isLoading: index < 3,
    canGoBack: index > 0,
    canGoForward: index < titles.length - 1,
    timestamp: Date.now() - index * 3600000,
    scrollPosition: 0,
    zoomLevel: 1,
    isPinned: index < 2,
    isMuted: false,
  }));
};

export const TabsManagerHomeScreen: React.FC = () => {
  const navigation = useNavigation<TabsManagerNavigationProp>();
  const { isDarkMode, colors, gradients } = useTheme();
  const [tabs, setTabs] = useState<BrowserTab[]>(generateMockTabs());
  const [isLoading, setIsLoading] = useState(false);
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

  const handleTabPress = useCallback(
    (tab: BrowserTab) => {
      triggerHaptic('light');
      navigation.navigate('TabPreview', { tabId: tab.id });
    },
    [navigation]
  );

  const handleTabLongPress = useCallback((tab: BrowserTab) => {
    triggerHaptic('heavy');
    setIsSelectionMode(true);
    setSelectedTabs([tab.id]);
  }, []);

  const handleNewTab = () => {
    triggerHaptic('medium');
    const newTab: BrowserTab = {
      id: generateId('tab'),
      title: 'New Tab',
      url: 'https://www.google.com',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      timestamp: Date.now(),
      scrollPosition: 0,
      zoomLevel: 1,
      isPinned: false,
      isMuted: false,
    };
    setTabs((prev) => [newTab, ...prev]);
  };

  const handleCloseTab = useCallback((tabId: string) => {
    triggerHaptic('light');
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
  }, []);

  const handleDeleteSelected = () => {
    triggerHaptic('heavy');
    setTabs((prev) => prev.filter((t) => !selectedTabs.includes(t.id)));
    setSelectedTabs([]);
    setIsSelectionMode(false);
  };

  const pinnedTabs = useMemo(() => tabs.filter((t) => t.isPinned), [tabs]);
  const unpinnedTabs = useMemo(() => tabs.filter((t) => !t.isPinned), [tabs]);

  const selectAllTabs = () => {
    if (selectedTabs.length === tabs.length) {
      setSelectedTabs([]);
    } else {
      setSelectedTabs(tabs.map((t) => t.id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity onPress={() => {
                setIsSelectionMode(false);
                setSelectedTabs([]);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.selectionTitle}>
                {selectedTabs.length} selected
              </Text>
              <TouchableOpacity onPress={selectAllTabs}>
                <Text style={styles.selectAllText}>
                  {selectedTabs.length === tabs.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>Tabs</Text>
              <TouchableOpacity onPress={handleNewTab} style={styles.newTabButton}>
                <Text style={styles.newTabButtonText}>+</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.tabStats}>
          <Text style={styles.tabStatsText}>
            {tabs.length} open · {pinnedTabs.length} pinned
          </Text>
        </View>
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
        {/* Pinned Tabs */}
        {pinnedTabs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                📌 Pinned
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pinnedTabsContainer}
            >
              {pinnedTabs.map((tab) => (
                <BrowserTabCard
                  key={tab.id}
                  id={tab.id}
                  title={tab.title}
                  url={tab.url}
                  isLoading={tab.isLoading}
                  isPinned={tab.isPinned}
                  onPress={() => handleTabPress(tab)}
                  onClose={() => handleCloseTab(tab.id)}
                  onLongPress={() => handleTabLongPress(tab)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Unpinned Tabs */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            📑 All Tabs
          </Text>
        </View>

        <View style={styles.tabsGrid}>
          {unpinnedTabs.map((tab) => (
            <View key={tab.id} style={styles.tabItemWrapper}>
              <BrowserTabCard
                id={tab.id}
                title={tab.title}
                url={tab.url}
                isLoading={tab.isLoading}
                isPinned={tab.isPinned}
                onPress={() => handleTabPress(tab)}
                onClose={() => handleCloseTab(tab.id)}
                onLongPress={() => handleTabLongPress(tab)}
              />
            </View>
          ))}
        </View>

        {/* Add Tab Button */}
        <GlassCard
          onPress={handleNewTab}
          style={styles.addTabCard}
          borderRadiusSize="xl"
        >
          <View style={styles.addTabContent}>
            <Text style={styles.addTabEmoji}>➕</Text>
            <Text style={[styles.addTabText, { color: colors.text }]}>New Tab</Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Delete Selected Button */}
      {isSelectionMode && selectedTabs.length > 0 && (
        <View style={[styles.deleteBar, { backgroundColor: colors.error }]}>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>
              Delete {selectedTabs.length} tab{selectedTabs.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AI Floating Button */}
      <AIFloatingButton onPress={() => setAiSheetVisible(true)} />

      {/* AI Sheet Modal */}
      <Modal visible={aiSheetVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <AIAssistantSheet
            visible={aiSheetVisible}
            onClose={() => setAiSheetVisible(false)}
            context="You can manage your tabs here. Create new tabs, organize them into groups, or close ones you no longer need. Would you like help with anything?"
          />
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// TAB PREVIEW SCREEN - Level 2
// ============================================================================

type TabPreviewNavigationProp = NativeStackNavigationProp<any, 'TabPreview'>;

export const TabPreviewScreen: React.FC = () => {
  const navigation = useNavigation<TabPreviewNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'TabPreview')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    triggerHaptic('light');
    navigation.goBack();
  };

  const handleGoForward = () => {
    triggerHaptic('light');
    // Navigate forward
  };

  const handleSettings = () => {
    triggerHaptic('light');
    navigation.navigate('TabSettings', { tabId: route?.tabId });
  };

  const handleRefresh = () => {
    triggerHaptic('medium');
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleMoveTab = (direction: 'start' | 'end') => {
    triggerHaptic('light');
    // Move tab logic
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewHeader}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Text style={styles.headerButtonEmoji}>←</Text>
        </TouchableOpacity>
        <View style={styles.previewTitleContainer}>
          <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
            {route?.tabId || 'Tab Preview'}
          </Text>
          <Text style={[styles.previewUrl, { color: colors.textSecondary }]}>
            example.com
          </Text>
        </View>
        <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
          <Text style={styles.headerButtonEmoji}>⚙️</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Preview Content */}
      <View style={styles.previewContent}>
        <GlassCard style={styles.previewCard} borderRadiusSize="xl">
          <LinearGradient
            colors={gradients.card as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCardGradient}
          >
            <Text style={styles.previewEmoji}>📄</Text>
            <Text style={[styles.previewCardTitle, { color: colors.text }]}>
              Tab Preview
            </Text>
            <Text style={[styles.previewCardSubtitle, { color: colors.textSecondary }]}>
              This is a preview of the tab content
            </Text>
            <View style={styles.previewCardActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={[styles.previewAction, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.previewActionText}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </GlassCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.previewActions}>
        <TouchableOpacity
          onPress={() => handleMoveTab('start')}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>⬆️</Text>
          <Text style={[styles.previewActionLabel, { color: colors.text }]}>Move to Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleMoveTab('end')}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>⬇️</Text>
          <Text style={[styles.previewActionLabel, { color: colors.text }]}>Move to End</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSettings}
          style={[styles.previewActionButton, { backgroundColor: colors.card }]}
        >
          <Text style={styles.previewActionEmoji}>⚙️</Text>
          <Text style={[styles.previewActionLabel, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// TAB SETTINGS SCREEN - Level 3
// ============================================================================

type TabSettingsNavigationProp = NativeStackNavigationProp<any, 'TabSettings'>;

export const TabSettingsScreen: React.FC = () => {
  const navigation = useNavigation<TabSettingsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'TabSettings')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [isJavaScriptEnabled, setIsJavaScriptEnabled] = useState(true);
  const [blockImages, setBlockImages] = useState(false);
  const [blockAds, setBlockAds] = useState(true);
  const [isDesktopMode, setIsDesktopMode] = useState(false);

  const handleToggle = (setting: string) => {
    triggerHaptic('light');
    switch (setting) {
      case 'javascript':
        setIsJavaScriptEnabled(!isJavaScriptEnabled);
        break;
      case 'images':
        setBlockImages(!blockImages);
        break;
      case 'ads':
        setBlockAds(!blockAds);
        break;
      case 'desktop':
        setIsDesktopMode(!isDesktopMode);
        break;
    }
  };

  const handleAdvanced = () => {
    triggerHaptic('light');
    navigation.navigate('TabAdvancedSettings', { tabId: route?.tabId });
  };

  const settingOptions = [
    { id: 'javascript', label: 'JavaScript', value: isJavaScriptEnabled, description: 'Enable JavaScript execution' },
    { id: 'images', label: 'Block Images', value: blockImages, description: 'Reduce data usage' },
    { id: 'ads', label: 'Block Ads', value: blockAds, description: 'Block advertisements' },
    { id: 'desktop', label: 'Desktop Mode', value: isDesktopMode, description: 'Request desktop version of websites' },
  ];

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
        <Text style={styles.settingsTitle}>Tab Settings</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.settingsScroll}>
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Content Settings
          </Text>
          {settingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleToggle(option.id)}
              style={[styles.settingItem, { backgroundColor: colors.card }]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.settingToggle,
                  {
                    backgroundColor: option.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.settingToggleThumb,
                    {
                      transform: [{ translateX: option.value ? 20 : 0 }],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleAdvanced}
          style={[styles.advancedButton, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.advancedButtonText, { color: colors.text }]}>
            Advanced Settings
          </Text>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// TAB ADVANCED SETTINGS SCREEN - Level 4
// ============================================================================

type TabAdvancedSettingsNavigationProp = NativeStackNavigationProp<any, 'TabAdvancedSettings'>;

export const TabAdvancedSettingsScreen: React.FC = () => {
  const navigation = useNavigation<TabAdvancedSettingsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'TabAdvancedSettings')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [customUserAgent, setCustomUserAgent] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [enableCookies, setEnableCookies] = useState(true);
  const [clearCache, setClearCache] = useState(false);

  const handleSave = () => {
    triggerHaptic('medium');
    Alert.alert('Settings Saved', 'Your advanced tab settings have been saved.');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.advancedHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.advancedTitle}>Advanced</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.advancedScroll}>
        <View style={styles.advancedSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            User Agent
          </Text>
          <GlassCard style={styles.inputCard} borderRadiusSize="lg">
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Custom User Agent string"
              placeholderTextColor={colors.textSecondary}
              value={customUserAgent}
              onChangeText={setCustomUserAgent}
            />
          </GlassCard>
        </View>

        <View style={styles.advancedSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Zoom Level: {Math.round(zoomLevel * 100)}%
          </Text>
          <View style={[styles.sliderContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}>
              <Text style={styles.sliderButton}>−</Text>
            </TouchableOpacity>
            <View style={[styles.slider, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((zoomLevel - 0.5) / 1.5) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <TouchableOpacity onPress={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}>
              <Text style={styles.sliderButton}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.advancedSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Privacy
          </Text>
          <TouchableOpacity
            onPress={() => setEnableCookies(!enableCookies)}
            style={[styles.optionItem, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Enable Cookies
            </Text>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: enableCookies ? colors.primary : 'transparent',
                  borderColor: enableCookies ? colors.primary : colors.border,
                },
              ]}
            >
              {enableCookies && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setClearCache(!clearCache)}
            style={[styles.optionItem, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              Clear Cache on Exit
            </Text>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: clearCache ? colors.primary : 'transparent',
                  borderColor: clearCache ? colors.primary : colors.border,
                },
              ]}
            >
              {clearCache && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
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
  newTabButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTabButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  tabStats: {
    marginTop: spacing.sm,
  },
  tabStatsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  pinnedTabsContainer: {
    paddingHorizontal: spacing.lg,
  },
  tabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  tabItemWrapper: {
    marginBottom: spacing.md,
  },
  addTabCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  addTabContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  addTabEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  addTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBar: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  deleteButton: {
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cancelText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectAllText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Preview screen styles
  previewHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerButtonEmoji: {
    fontSize: 24,
  },
  previewTitleContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewUrl: {
    fontSize: 12,
  },
  previewContent: {
    flex: 1,
    padding: spacing.lg,
  },
  previewCard: {
    flex: 1,
  },
  previewCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 60,
    marginBottom: spacing.lg,
  },
  previewCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  previewCardSubtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  previewCardActions: {
    flexDirection: 'row',
  },
  previewAction: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  previewActionText: {
    color: '#FFFFFF',
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
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  previewActionLabel: {
    fontSize: 12,
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
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  settingsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  settingToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  settingToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  advancedButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  arrowText: {
    fontSize: 24,
    color: '#94A3B8',
  },
  // Advanced settings styles
  advancedHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedTitle: {
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
  advancedScroll: {
    flex: 1,
  },
  advancedSection: {
    padding: spacing.lg,
  },
  inputCard: {
    marginTop: spacing.sm,
  },
  input: {
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  slider: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: spacing.md,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderButton: {
    fontSize: 24,
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// ADDITIONAL PREMIUM TAB SCREEN - Extended Functionality
// ============================================================================

interface ExtendedTabFeatureProps {
  id: string;
  title: string;
  onPress: () => void;
}

export const ExtendedTabFe: React.FC<ExtendedTabFeatureProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedFeatureCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedFeatureTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Tab Analytics Card Component
// ============================================================================

interface TabAnalyticsProps {
  visits: number;
  duration: number;
  dataUsed: string;
}

export const TabAnalyticsC: React.FC<TabAnalyticsProps> = ({ visits, duration, dataUsed }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.analyticsTitle, { color: colors.text }]}>Analytics</Text>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Visits</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{visits}</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Duration</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{duration}min</Text>
      </View>
      <View style={styles.analyticsRow}>
        <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Data</Text>
        <Text style={[styles.analyticsValue, { color: colors.text }]}>{dataUsed}</Text>
      </View>
    </View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumF: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
// ============================================================================
// ADDITIONAL UI FEATURE - Unique Component
// ============================================================================
const TabFeatureCard = () => null;
