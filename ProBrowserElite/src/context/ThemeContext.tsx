import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContextType, ThemeColors, ThemeGradients } from '../types';

const THEME_STORAGE_KEY = '@pro_browser/theme';

const lightColors: ThemeColors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
};

const darkColors: ThemeColors = {
  primary: '#818CF8',
  secondary: '#A78BFA',
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  glass: 'rgba(30, 41, 59, 0.8)',
  glassBorder: 'rgba(30, 41, 59, 0.5)',
};

const lightGradients: ThemeGradients = {
  primary: ['#6366F1', '#8B5CF6'],
  secondary: ['#EC4899', '#8B5CF6'],
  background: ['#F8FAFC', '#E2E8F0'],
  card: ['#FFFFFF', '#F1F5F9'],
  header: ['#6366F1', '#4F46E5'],
};

const darkGradients: ThemeGradients = {
  primary: ['#818CF8', '#A78BFA'],
  secondary: ['#EC4899', '#A78BFA'],
  background: ['#0F172A', '#1E293B'],
  card: ['#1E293B', '#334155'],
  header: ['#1E293B', '#0F172A'],
};

const defaultContext: ThemeContextType = {
  isDarkMode: true,
  toggleTheme: () => {},
  colors: darkColors,
  gradients: darkGradients,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (theme: string) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    setIsAnimating(true);
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      saveTheme(newTheme ? 'dark' : 'light');
      return newTheme;
    });
    setTimeout(() => setIsAnimating(false), 300);
  };

  const colors = isDarkMode ? darkColors : lightColors;
  const gradients = isDarkMode ? darkGradients : lightGradients;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        colors,
        gradients,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;