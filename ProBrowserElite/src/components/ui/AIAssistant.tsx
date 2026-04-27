import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '../../context/ThemeContext';
import { mockAIResponses, aiSuggestions } from '../../data/mockData';
import { borderRadius, spacing, generateId, triggerHaptic } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// AI ASSISTANT BOTTOM SHEET - Floating AI on every screen
// ============================================================================

interface AIAssistantSheetProps {
  visible: boolean;
  onClose: () => void;
  context?: string;
}

export const AIAssistantSheet: React.FC<AIAssistantSheetProps> = ({
  visible,
  onClose,
  context = 'How can I help you today?',
}) => {
  const { isDarkMode, colors, gradients } = useTheme();
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: context,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const snapPoints = useMemo(() => ['50%', '80%'], []);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim()) return;
    
    triggerHaptic('medium');
    const userId = generateId('msg');
    setMessages((prev) => [...prev, { id: userId, role: 'user', content: userMessage }]);
    setUserMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
      setMessages((prev) => [
        ...prev,
        { id: generateId('ai'), role: 'assistant', content: randomResponse },
      ]);
      setIsTyping(false);
    }, 1500);
  }, [userMessage]);

  const QuickActions = [
    { label: 'Open new tab', emoji: '➕' },
    { label: 'Bookmarks', emoji: '🔖' },
    { label: 'History', emoji: '🕐' },
    { label: 'Downloads', emoji: '⬇️' },
  ];

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.surface }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.border }]}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        {/* AI Header */}
        <View style={styles.aiHeader}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
          <View style={styles.aiHeaderText}>
            <Text style={[styles.aiTitle, { color: colors.text }]}>AI Assistant</Text>
            <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>
              Always here to help
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {QuickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                triggerHaptic('light');
                setUserMessage(action.label);
              }}
              style={[styles.quickAction, { backgroundColor: colors.card }]}
            >
              <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? styles.userMessage
                  : styles.assistantMessage,
                {
                  backgroundColor:
                    msg.role === 'user'
                      ? colors.primary
                      : isDarkMode
                        ? colors.card
                        : '#F1F5F9',
                },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  {
                    color: msg.role === 'user' ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.card }]}>
              <Text style={styles.typingText}>typing...</Text>
            </View>
          )}
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textSecondary}
              value={userMessage}
              onChangeText={setUserMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!userMessage.trim() || isTyping}
              style={[
                styles.sendButton,
                {
                  backgroundColor: userMessage.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

// ============================================================================
// AI FLOATING BUTTON - Quick access to AI
// ============================================================================

interface AIFloatingButtonProps {
  onPress: () => void;
}

export const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.floatingButtonContainer,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.floatingButtonEmoji}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
  handleIndicator: {
    width: 40,
    height: 4,
  },
  sheetContent: {
    flex: 1,
    padding: spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  aiAvatarText: {
    fontSize: 24,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  aiSubtitle: {
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  quickActionEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    marginBottom: spacing.lg,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginTop: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 18,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    zIndex: 1000,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonEmoji: {
    fontSize: 28,
  },
});
