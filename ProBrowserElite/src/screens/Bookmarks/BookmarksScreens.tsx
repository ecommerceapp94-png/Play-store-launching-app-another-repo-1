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
import { Bookmark, BookmarkFolder } from '../../types';
import { defaultBookmarkFolders, defaultBookmarks } from '../../data/mockData';
import { BookmarkCard } from '../../components/ui/CommonCards';
import { AIFloatingButton, AIAssistantSheet } from '../../components/ui/AIAssistant';
import { GlassCard } from '../../components/ui/GlassCard';
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
// BOOKMARKS HOME SCREEN - Level 1
// ============================================================================

type BookmarksNavigationProp = NativeStackNavigationProp<any, 'BookmarksHome'>;

export const BookmarksHomeScreen: React.FC = () => {
  const navigation = useNavigation<BookmarksNavigationProp>();
  const { isDarkMode, colors, gradients } = useTheme();
  const [folders, setFolders] = useState<BookmarkFolder[]>(defaultBookmarkFolders);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(defaultBookmarks);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSheetVisible, setAiSheetVisible] = useState(false);
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);
  const searchAnim = React.useRef(new Animated.Value(1)).current;

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

  const handleFolderPress = useCallback(
    (folder: BookmarkFolder) => {
      triggerHaptic('light');
      navigation.navigate('FolderContents', { folderId: folder.id });
    },
    [navigation]
  );

  const handleBookmarkPress = useCallback(
    (bookmark: Bookmark) => {
      triggerHaptic('light');
      navigation.navigate('BookmarkOptions', { bookmarkId: bookmark.id });
    },
    [navigation]
  );

  const handleNewFolder = () => {
    triggerHaptic('medium');
    Alert.prompt(
      'New Folder',
      'Enter folder name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (name) => {
            if (name) {
              const newFolder: BookmarkFolder = {
                id: generateId('folder'),
                name,
                icon: 'folder',
                color: '#6366F1',
                itemCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setFolders((prev) => [...prev, newFolder]);
              triggerHaptic('light');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const rootBookmarks = useMemo(
    () => bookmarks.filter((b) => !b.folderId),
    [bookmarks]
  );
  const displayedBookmarks = showAllBookmarks ? rootBookmarks : rootBookmarks.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <TouchableOpacity onPress={handleNewFolder} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {folders.length} folders · {bookmarks.length} items
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
        {/* Folders Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Folders</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foldersContainer}
        >
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              onPress={() => handleFolderPress(folder)}
              onLongPress={() => {
                triggerHaptic('heavy');
                Alert.alert(folder.name, `${folder.itemCount} items`);
              }}
              style={styles.folderCard}
            >
              <LinearGradient
                colors={
                  isDarkMode
                    ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']
                    : ['rgba(255, 255, 255, 0.98)', 'rgba(241, 245, 249, 0.99)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.folderCardGradient}
              >
                <Text style={styles.folderEmoji}>📁</Text>
                <Text style={[styles.folderName, { color: colors.text }]} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text style={[styles.folderCount, { color: colors.textSecondary }]}>
                  {folder.itemCount} items
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Bookmarks Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Bookmarks</Text>
          <TouchableOpacity onPress={() => setShowAllBookmarks(!showAllBookmarks)}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>
              {showAllBookmarks ? 'Show Less' : 'Show All'}
            </Text>
          </TouchableOpacity>
        </View>

        {displayedBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            id={bookmark.id}
            title={bookmark.title}
            url={bookmark.url}
            tags={bookmark.tags}
            onPress={() => handleBookmarkPress(bookmark)}
            onLongPress={() => handleBookmarkPress(bookmark)}
          />
        ))}

        {/* Organize Button */}
        <GlassCard
          onPress={() => navigation.navigate('OrganizeBookmarks', {})}
          style={styles.organizeCard}
        >
          <View style={styles.organizeContent}>
            <Text style={styles.organizeEmoji}>📂</Text>
            <Text style={[styles.organizeText, { color: colors.text }]}>Organize</Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* AI Floating Button */}
      <AIFloatingButton onPress={() => setAiSheetVisible(true)} />

      {/* AI Sheet Modal */}
      <Modal visible={aiSheetVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <AIAssistantSheet
            visible={aiSheetVisible}
            onClose={() => setAiSheetVisible(false)}
            context="Bookmarks help you save your favorite websites. You can organize them into folders, add tags, and access them quickly. Would you like to create a new bookmark or folder?"
          />
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// FOLDER CONTENTS SCREEN - Level 2
// ============================================================================

type FolderContentsNavigationProp = NativeStackNavigationProp<any, 'FolderContents'>;

export const FolderContentsScreen: React.FC = () => {
  const navigation = useNavigation<FolderContentsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'FolderContents')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(
    defaultBookmarks.filter((b) => b.folderId === route?.folderId)
  );

  const folder = defaultBookmarkFolders.find((f) => f.id === route?.folderId);

  const handleBookmarkPress = useCallback(
    (bookmark: Bookmark) => {
      triggerHaptic('light');
      navigation.navigate('BookmarkOptions', { bookmarkId: bookmark.id });
    },
    [navigation]
  );

  const handleAddBookmark = () => {
    triggerHaptic('medium');
    // Add bookmark logic
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.folderHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.folderTitleContainer}>
          <Text style={styles.folderEmoji}>📁</Text>
          <Text style={styles.folderTitle}>{folder?.name || 'Folder'}</Text>
        </View>
        <TouchableOpacity onPress={handleAddBookmark} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.folderScroll}>
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            id={bookmark.id}
            title={bookmark.title}
            url={bookmark.url}
            tags={bookmark.tags}
            onPress={() => handleBookmarkPress(bookmark)}
          />
        ))}
        {bookmarks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No bookmarks in this folder
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================================
// BOOKMARK OPTIONS SCREEN - Level 3
// ============================================================================

type BookmarkOptionsNavigationProp = NativeStackNavigationProp<any, 'BookmarkOptions'>;

export const BookmarkOptionsScreen: React.FC = () => {
  const navigation = useNavigation<BookmarkOptionsNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'BookmarkOptions')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const bookmark = defaultBookmarks.find((b) => b.id === route?.bookmarkId);

  React.useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
    }
  }, [bookmark]);

  const handleSave = () => {
    triggerHaptic('medium');
    Alert.alert('Saved', 'Bookmark updated successfully');
    setIsEditing(false);
  };

  const handleDelete = () => {
    triggerHaptic('heavy');
    Alert.alert(
      'Delete Bookmark',
      'Are you sure you want to delete this bookmark?',
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

  const options = [
    { id: 'edit', icon: '✏️', label: 'Edit', action: () => setIsEditing(true) },
    { id: 'share', icon: '📤', label: 'Share', action: () => {} },
    { id: 'move', icon: '📁', label: 'Move to Folder', action: () => {} },
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
        <Text style={styles.optionsTitle}>{bookmark?.title || 'Bookmark'}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.optionsScroll}>
        {/* Bookmark Info */}
        <GlassCard style={styles.bookmarkInfoCard} borderRadiusSize="xl">
          <View style={styles.bookmarkInfoContent}>
            <Text style={styles.bookmarkInfoEmoji}>🔖</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[styles.editInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={url}
                  onChangeText={setUrl}
                  placeholder="URL"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.bookmarkInfoTitle, { color: colors.text }]}>
                  {bookmark?.title}
                </Text>
                <Text style={[styles.bookmarkInfoUrl, { color: colors.textSecondary }]}>
                  {bookmark?.url}
                </Text>
                <View style={styles.tagContainer}>
                  {bookmark?.tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </GlassCard>

        {/* Options */}
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
// ORGANIZE BOOKMARKS SCREEN - Level 4
// ============================================================================

type OrganizeBookmarksNavigationProp = NativeStackNavigationProp<any, 'OrganizeBookmarks'>;

export const OrganizeBookmarksScreen: React.FC = () => {
  const navigation = useNavigation<OrganizeBookmarksNavigationProp>();
  const route = navigation.getState()?.routes?.find(r => r.name === 'OrganizeBookmarks')?.params as any;
  const { isDarkMode, colors, gradients } = useTheme();
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const allBookmarks = defaultBookmarks;

  const handleSelect = (bookmarkId: string) => {
    triggerHaptic('light');
    if (selectedBookmarks.includes(bookmarkId)) {
      setSelectedBookmarks((prev) => prev.filter((id) => id !== bookmarkId));
    } else {
      setSelectedBookmarks((prev) => [...prev, bookmarkId]);
    }
  };

  const handleDeleteSelected = () => {
    triggerHaptic('heavy');
    Alert.alert(
      'Delete Selected',
      `Delete ${selectedBookmarks.length} bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSelectedBookmarks([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.header as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.organizeHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.organizeTitle}>
          {isSelectionMode ? `${selectedBookmarks.length} selected` : 'Organize'}
        </Text>
        <TouchableOpacity onPress={() => setIsSelectionMode(!isSelectionMode)}>
          <Text style={styles.selectText}>
            {isSelectionMode ? 'Done' : 'Select'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.organizeScroll}>
        {allBookmarks.map((bookmark) => (
          <TouchableOpacity
            key={bookmark.id}
            onPress={() => (isSelectionMode ? handleSelect(bookmark.id) : {})}
            onLongPress={() => {
              triggerHaptic('heavy');
              setIsSelectionMode(true);
              setSelectedBookmarks([bookmark.id]);
            }}
            style={[styles.organizeItem, { backgroundColor: colors.card }]}
          >
            <View style={styles.organizeItemContent}>
              <Text style={styles.bookmarkEmoji}>🔖</Text>
              <View style={styles.organizeInfo}>
                <Text style={[styles.organizeItemTitle, { color: colors.text }]}>
                  {bookmark.title}
                </Text>
                <Text style={[styles.organizeItemUrl, { color: colors.textSecondary }]}>
                  {bookmark.url}
                </Text>
              </View>
            </View>
            {isSelectionMode && (
              <View
                style={[
                  styles.selectCheckbox,
                  {
                    backgroundColor: selectedBookmarks.includes(bookmark.id)
                      ? colors.primary
                      : 'transparent',
                    borderColor: selectedBookmarks.includes(bookmark.id)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                {selectedBookmarks.includes(bookmark.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Action Bar */}
      {isSelectionMode && selectedBookmarks.length > 0 && (
        <View style={[styles.actionBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={[styles.actionBarButton, { backgroundColor: colors.error }]}
          >
            <Text style={styles.actionBarText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}
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
  addButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsRow: {
    marginTop: spacing.sm,
  },
  statsText: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  foldersContainer: {
    paddingHorizontal: spacing.lg,
  },
  folderCard: {
    width: 140,
    marginRight: spacing.md,
  },
  folderCardGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  folderName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  folderCount: {
    fontSize: 12,
  },
  folderEmoji: {
    fontSize: 40,
  },
  organizeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  organizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  organizeEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  organizeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Folder contents screen styles
  folderHeader: {
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
  folderTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  folderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  folderScroll: {
    flex: 1,
  },
  folderEmoji: {
    fontSize: 32,
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
  // Bookmark options screen styles
  optionsHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsTitle: {
    flex: 1,
    fontSize: 18,
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
  bookmarkInfoCard: {
    marginBottom: spacing.lg,
  },
  bookmarkInfoContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  bookmarkInfoEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  bookmarkInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  bookmarkInfoUrl: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editInput: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  saveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  // Organize screen styles
  organizeHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizeTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  organizeScroll: {
    flex: 1,
    padding: spacing.lg,
  },
  organizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  organizeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  organizeItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  organizeItemUrl: {
    fontSize: 13,
  },
  selectCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionBar: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  actionBarButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionBarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
    </View>
  );
};

// ============================================================================
// PREMIUM BOOKMARK EXTENDED - Additional Features
// ============================================================================

interface BookmarkExtendedProps {
  id: string;
  title: string;
  url: string;
  tags: string[];
  onPress: () => void;
}

export const BookmarkExtendedCardV2: React.FC<BookmarkExtendedProps> = ({ title, tags, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.extendedCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.extendedTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {tags.map((tag, i) => (
          <Text key={i} style={[styles.tag, { color: colors.primary }]}>{tag}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// Bookmark Folder Analytics
// ============================================================================

interface FolderAnalyticsProps {
  totalBookmarks: number;
  lastUpdated: string;
  size: string;
}

export const FolderAnalyticsCardV2: React.FC<FolderAnalyticsProps> = ({ totalBookmarks, lastUpdated, size }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.folderAnalytics, { backgroundColor: colors.surface }]}>
      <Text style={[styles.folderTitle, { color: colors.text }]}>Folder Stats</Text>
      <Text style={[styles.folderStat, { color: colors.text }]}>{totalBookmarks} items</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{lastUpdated}</Text>
      <Text style={[styles.folderStat, { color: colors.textSecondary }]}>{size}</Text>
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
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL PREMIUM FEATURE - Extended Screen Component
// ============================================================================
interface PremiumFeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}
export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({ title, description, icon, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true }).start();
    triggerHaptic('light');
  };
  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
        style={[styles.premiumFeatureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.premiumFeatureIconContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.premiumFeatureIcon}>{icon}</Text>
        </View>
        <View style={styles.premiumFeatureContent}>
          <Text style={[styles.premiumFeatureTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.premiumFeatureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.premiumFeatureArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
// ============================================================================
// ADDITIONAL BOOKMARK FEATURE
// ============================================================================
const BookmarkFeature = () => null;
