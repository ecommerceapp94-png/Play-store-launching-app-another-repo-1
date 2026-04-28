import React from 'react';
import {
  StatusBar,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ============================================================================
// PRO BROWSER ELITE — Minimal, crash-free welcome screen
// ============================================================================

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  { icon: '⚡', title: 'Lightning Fast',     desc: 'Optimized engine with prefetch and tab-warm-up.' },
  { icon: '🛡️', title: 'Privacy First',      desc: 'No telemetry. No tracking. Ever.' },
  { icon: '🌌', title: 'Neon Dark UI',       desc: 'Glassmorphic surfaces with cosmic gradients.' },
  { icon: '🤖', title: 'AI Sidekick (Aria)', desc: 'Smart summaries and on-page assistance.' },
  { icon: '☁️', title: 'Cloud Sync',         desc: 'End-to-end encrypted bookmarks and tabs.' },
  { icon: '🎯', title: 'Speed Dial Pro',     desc: '12-slot homepage with usage analytics.' },
];

const STATS: Array<{ value: string; label: string }> = [
  { value: '4.9★',  label: 'Rating' },
  { value: '2.0M+', label: 'Installs' },
  { value: '120+',  label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
];

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1E" />

      <LinearGradient
        colors={['#0B0F1E', '#1A1340', '#3B0F60', '#0A0E1A']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={styles.logoGlow} />
            <Image
              source={require('./assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brand}>ProBrowser</Text>
          <Text style={styles.brandElite}>ELITE</Text>

          <View style={styles.tagWrap}>
            <Text style={styles.tagText}>SUPER · ULTRA · MAX · PRO</Text>
          </View>

          <Text style={styles.tagline}>
            The premium browser experience —{'\n'}built for speed, privacy and style.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's inside</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.ctaButton}
            onPress={() =>
              Linking.openURL('https://github.com/ecommerceapp94-png/Play-store-launching-app-another-repo-1').catch(() => {})
            }
          >
            <LinearGradient
              colors={['#FFC15E', '#E89A2C']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>VIEW ON GITHUB</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryButton}
            onPress={() => Linking.openURL('https://gofile.io/d/xun2vo').catch(() => {})}
          >
            <Text style={styles.secondaryText}>SHARE APK</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>v1.0.0 · ELITE BUILD</Text>
          <Text style={styles.footerSub}>© 2026 ProBrowser. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0F1E' },
  scroll: { paddingTop: 64, paddingBottom: 48, paddingHorizontal: 20 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  logoWrap: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7C5BFF',
    opacity: 0.25,
  },
  logo: {
    width: 168,
    height: 168,
    borderRadius: 36,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  brandElite: {
    color: '#FFC15E',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 14,
    marginTop: -2,
    marginBottom: 14,
  },
  tagWrap: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,193,94,0.55)',
    backgroundColor: 'rgba(255,193,94,0.08)',
    marginBottom: 14,
  },
  tagText: {
    color: '#FFE9A8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  tagline: {
    color: '#C7C9DA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: '#8C8FA8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  // Features
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  featureBody: { flex: 1 },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureDesc: {
    color: '#A2A5BD',
    fontSize: 13,
    lineHeight: 18,
  },

  // CTA
  ctaButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#1A0B5C',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 2,
  },

  // Footer
  footer: { alignItems: 'center', marginTop: 8 },
  footerText: {
    color: '#FFC15E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  footerSub: {
    color: '#5A5D75',
    fontSize: 11,
  },
});
