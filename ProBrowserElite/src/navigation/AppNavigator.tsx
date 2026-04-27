import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../context/ThemeContext';

// Browser Screens
import {
  BrowserHomeScreen,
  BrowserWebViewScreen,
  URLEditorScreen,
  ContextMenuScreen,
} from '../screens/Browser/BrowserScreens';

// Tabs Manager Screens
import {
  TabsManagerHomeScreen,
  TabPreviewScreen,
  TabSettingsScreen,
  TabAdvancedSettingsScreen,
} from '../screens/TabsManager/TabsManagerScreens';

// Bookmarks Screens
import {
  BookmarksHomeScreen,
  FolderContentsScreen,
  BookmarkOptionsScreen,
  OrganizeBookmarksScreen,
} from '../screens/Bookmarks/BookmarksScreens';

// History Screens
import {
  HistoryHomeScreen,
  DateHistoryScreen,
  HistoryDetailScreen,
  HistoryOptionsScreen,
} from '../screens/History/HistoryScreens';

// Downloads Screens
import {
  DownloadsHomeScreen,
  FilePreviewScreen,
  FileOptionsScreen,
  DownloadSettingsScreen,
} from '../screens/Downloads/DownloadsScreens';

// ============================================================================
// STACK NAVIGATORS
// ============================================================================

// Browser Stack
const BrowserStack = createNativeStackNavigator();

const BrowserStackScreen: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <BrowserStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <BrowserStack.Screen name="BrowserHome" component={BrowserHomeScreen} />
      <BrowserStack.Screen name="BrowserWebView" component={BrowserWebViewScreen} />
      <BrowserStack.Screen name="URLEditor" component={URLEditorScreen} />
      <BrowserStack.Screen name="ContextMenu" component={ContextMenuScreen} />
    </BrowserStack.Navigator>
  );
};

// Tabs Manager Stack
const TabsManagerStack = createNativeStackNavigator();

const TabsManagerStackScreen: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <TabsManagerStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <TabsManagerStack.Screen name="TabsManagerHome" component={TabsManagerHomeScreen} />
      <TabsManagerStack.Screen name="TabPreview" component={TabPreviewScreen} />
      <TabsManagerStack.Screen name="TabSettings" component={TabSettingsScreen} />
      <TabsManagerStack.Screen name="TabAdvancedSettings" component={TabAdvancedSettingsScreen} />
    </TabsManagerStack.Navigator>
  );
};

// Bookmarks Stack
const BookmarksStack = createNativeStackNavigator();

const BookmarksStackScreen: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <BookmarksStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <BookmarksStack.Screen name="BookmarksHome" component={BookmarksHomeScreen} />
      <BookmarksStack.Screen name="FolderContents" component={FolderContentsScreen} />
      <BookmarksStack.Screen name="BookmarkOptions" component={BookmarkOptionsScreen} />
      <BookmarksStack.Screen name="OrganizeBookmarks" component={OrganizeBookmarksScreen} />
    </BookmarksStack.Navigator>
  );
};

// History Stack
const HistoryStack = createNativeStackNavigator();

const HistoryStackScreen: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <HistoryStack.Screen name="HistoryHome" component={HistoryHomeScreen} />
      <HistoryStack.Screen name="DateHistory" component={DateHistoryScreen} />
      <HistoryStack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
      <HistoryStack.Screen name="HistoryOptions" component={HistoryOptionsScreen} />
    </HistoryStack.Navigator>
  );
};

// Downloads Stack
const DownloadsStack = createNativeStackNavigator();

const DownloadsStackScreen: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <DownloadsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <DownloadsStack.Screen name="DownloadsHome" component={DownloadsHomeScreen} />
      <DownloadsStack.Screen name="FilePreview" component={FilePreviewScreen} />
      <DownloadsStack.Screen name="FileOptions" component={FileOptionsScreen} />
      <DownloadsStack.Screen name="DownloadSettings" component={DownloadSettingsScreen} />
    </DownloadsStack.Navigator>
  );
};

// ============================================================================
// MAIN TAB NAVIGATOR
// ============================================================================

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; focused: boolean; color: string }> = ({ icon, focused, color }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
  </View>
);

export const MainTabNavigator: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Browser"
        component={BrowserStackScreen}
        options={{
          tabBarLabel: 'Browser',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🌐" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TabsManager"
        component={TabsManagerStackScreen}
        options={{
          tabBarLabel: 'Tabs',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📑" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksStackScreen}
        options={{
          tabBarLabel: 'Bookmarks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🔖" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="🕐" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Downloads"
        component={DownloadsStackScreen}
        options={{
          tabBarLabel: 'Downloads',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon="📥" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================================================
// APP NAVIGATOR
// ============================================================================

export const AppNavigator: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <MainTabNavigator />
    </NavigationContainer>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIcon: {
    fontSize: 22,
  },
});