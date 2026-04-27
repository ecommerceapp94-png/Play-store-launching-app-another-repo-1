import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, spacing, createGlassStyle, createShadowStyle, springConfig, animationDurations } from '../../utils/helpers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  borderRadiusSize?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  animationType?: 'scale' | 'fade' | 'spring';
  disabled?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
}

// ============================================================================
// PREMIUM GLASS CARD COMPONENT - Glassmorphism with Neumorphism Support
// ============================================================================

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'medium',
  borderRadiusSize = 'lg',
  padding = spacing.md,
  onPress,
  onLongPress,
  animationType = 'scale',
  disabled = false,
  gradient = true,
  gradientColors,
}) => {
  const { isDarkMode, colors, gradients: themeGradients } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const borderRadiusValue = borderRadius[borderRadiusSize];

  useEffect(() => {
    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, []);

  const handlePressIn = () => {
    if (disabled || !onPress) return;

    if (animationType === 'scale') {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        ...springConfig,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: animationDurations.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;

    if (animationType === 'scale') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...springConfig,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: animationDurations.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const glassStyle = createGlassStyle(isDarkMode, intensity);
  const shadowStyle = createShadowStyle(isDarkMode, 8);

  const cardStyles: ViewStyle[] = [
    styles.card,
    glassStyle,
    shadowStyle,
    {
      borderRadius: borderRadiusValue,
      padding,
    },
    style,
  ];

  const content = gradient ? (
    <LinearGradient
      colors={gradientColors || (isDarkMode ? themeGradients.card : ['#FFFFFF', '#F1F5F9'])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { borderRadius: borderRadiusValue }]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, borderRadius: borderRadiusValue }}>{children}</View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { opacity: opacityAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={onLongPress}
          disabled={disabled}
          style={cardStyles}
        >
          {content}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={cardStyles}>{content}</View>;
};

// ============================================================================
// ANIMATED BUTTON COMPONENT
// ============================================================================

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      ...springConfig,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...springConfig,
    }).start();
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.error };
      default:
        return {};
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      case 'medium':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg };
      case 'large':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      default:
        return colors.text;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[styles.button, getVariantStyles(), getSizeStyles(), disabled && styles.disabled, fullWidth && styles.fullWidth, style]}
      >
        {loading ? (
          <Text style={[styles.buttonText, { color: getTextColor() }]}>Loading...</Text>
        ) : (
          <>
            {icon}
            <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// SKELETON LOADER COMPONENT
// ============================================================================

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadiusSize?: 'sm' | 'md' | 'lg' | 'xl' | 'round';
  delay?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadiusSize = 'md',
  delay = 0,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        delay,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const borderRadiusValue = borderRadius[borderRadiusSize];

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: borderRadiusValue,
          backgroundColor: isDarkMode ? colors.surface : colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ============================================================================
// GRADIENT BUTTON COMPONENT
// ============================================================================

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const { isDarkMode, colors, gradients } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      ...springConfig,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...springConfig,
    }).start();
  };

  const gradientColors = variant === 'primary' ? gradients.primary : gradients.secondary;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} activeOpacity={0.9} style={style}>
        <LinearGradient
          colors={disabled ? [colors.border, colors.border] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientButton,
            size === 'small' && styles.buttonSmall,
            size === 'large' && styles.buttonLarge,
            disabled && styles.disabledButton,
          ]}
        >
          {icon}
          <Text style={styles.gradientButtonText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// NEUMORPHIC CARD COMPONENT
// ============================================================================

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  inset?: boolean;
}

export const NeumorphicCard: React.FC<NeumorphicCardProps> = ({ children, style, inset = false }) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <View
      style={[
        styles.neumorphicCard,
        {
          backgroundColor: colors.card,
          shadowColor: isDarkMode ? '#000000' : '#E2E8F0',
        },
        inset && styles.neumorphicInset,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  buttonSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonLarge: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  skeleton: {
    opacity: 0.5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  neumorphicCard: {
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  neumorphicInset: {
    shadowOffset: { width: -6, height: -6 },
    elevation: 4,
    opacity: 0.5,
  },
});
// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// GLASS CARD EXTENDED - Additional Premium Components
// ============================================================================

interface GlassCardExtendedProps {
  title: string;
  icon: string;
  gradient?: string[];
  onPress: () => void;
}

export const GlassCardExtended: React.FC<GlassCardExtendedProps> = ({ title, icon, gradient, onPress }) => {
  const { isDarkMode, colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.glassExtendedCard, { backgroundColor: colors.glass }]}>
      <Text style={styles.glassExtendedIcon}>{icon}</Text>
      <Text style={[styles.glassExtendedTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};
