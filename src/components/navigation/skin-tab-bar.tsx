import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/app-icon';
import { BotMessageSquareIcon, HouseIcon, ScanFaceIcon, type LucideIcon, UserIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Layout, Radius, Shadows, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useStartScan } from '@/hooks/use-start-scan';
import { useI18n } from '@/i18n/i18n-provider';

type TabName = 'index' | 'scan' | 'ai-chat' | 'account';

const BAR_HEIGHT = 64;
const INDICATOR_SIZE = 48;
const ROW_PADDING = Spacing.s;

/** Settles with a slight overshoot so the halo lands softly instead of stopping dead. */
const SLIDE_SPRING = { damping: 22, stiffness: 220, mass: 1 };

/**
 * Capsule finish. 'dark' is an ink bar that anchors the soft pink screens;
 * 'light' is a frosted white bar closer to the original Figma navigation.
 */
const TAB_BAR_TONE: 'dark' | 'light' = 'light';

const TONES = {
  dark: {
    iconIdle: Alpha.white(0.62),
    /** Scan stays the primary action, so its idle icon is brighter than the others. */
    iconIdlePrimary: Alpha.white(0.88),
    glassScheme: 'dark' as const,
    glassTint: Alpha.ink(0.86),
    solid: Colors.background.camera,
    borderWidth: 0,
    border: 'transparent',
    shadow: Shadows.navFloating,
  },
  light: {
    iconIdle: Colors.text.muted,
    iconIdlePrimary: Colors.brand.primary,
    glassScheme: 'light' as const,
    glassTint: Alpha.white(0.86),
    solid: Alpha.white(0.97),
    borderWidth: 1,
    border: Alpha.taupe(0.4),
    shadow: Shadows.navFloatingLight,
  },
};

const TONE = TONES[TAB_BAR_TONE];
const ICON_ACTIVE = Colors.text.onBrand;

/** Liquid Glass exists on iOS 26+ only; everywhere else the bar falls back to solid ink. */
const LIQUID_GLASS = isLiquidGlassAvailable();

/**
 * Floating capsule navigation: Home · Scan · AI Chat · Profile. One rose halo
 * marks the active tab and slides to the next tab when the page changes.
 * Hidden on the Scan tab, which is full-screen by design.
 */
export function SkinTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const { insets } = useDesignInsets();
  const startScan = useStartScan();
  const [rowSize, setRowSize] = useState({ width: 0, height: 0 });

  const tabs: { name: TabName; label: string; icon: LucideIcon }[] = [
    { name: 'index', label: t.tabs.home, icon: HouseIcon },
    { name: 'scan', label: t.tabs.scan, icon: ScanFaceIcon },
    { name: 'ai-chat', label: t.tabs.aiChat, icon: BotMessageSquareIcon },
    { name: 'account', label: t.tabs.profile, icon: UserIcon },
  ];

  const activeRoute = state.routes[state.index]?.name;
  const activeIndex = tabs.findIndex((tab) => tab.name === activeRoute);
  const hidden = activeRoute === 'scan';

  // Fractional tab index of the halo: 0 = Home … 3 = Profile.
  const position = useSharedValue(Math.max(activeIndex, 0));

  useEffect(() => {
    // While the bar is hidden on Scan the halo stays put, then slides from there on return.
    if (activeIndex >= 0 && !hidden) {
      position.value = withSpring(activeIndex, SLIDE_SPRING);
    }
  }, [activeIndex, hidden, position]);

  const slotWidth = rowSize.width > 0 ? (rowSize.width - ROW_PADDING * 2) / tabs.length : 0;
  const haloLeft = ROW_PADDING + (slotWidth - INDICATOR_SIZE) / 2;
  const haloTop = (rowSize.height - INDICATOR_SIZE) / 2;

  // The halo travels right while the white icons inside it travel left by the same
  // amount, so each icon stays put and only turns white where the halo covers it.
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * slotWidth }],
  }));
  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -position.value * slotWidth }],
  }));

  if (hidden) {
    return null;
  }

  const onTabPress = (name: TabName) => {
    if (name === 'scan') {
      startScan();
      return;
    }

    const route = state.routes.find((candidate) => candidate.name === name);
    if (!route) return;

    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeRoute !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, Spacing.m) }]}>
      <TabBarSurface>
        <View
          style={styles.row}
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setRowSize((current) =>
              current.width === width && current.height === height ? current : { width, height },
            );
          }}>
          {tabs.map(({ name, label, icon }) => (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: activeRoute === name }}
              onPress={() => onTabPress(name)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <AppIcon
                icon={icon}
                size={24}
                color={name === 'scan' ? TONE.iconIdlePrimary : TONE.iconIdle}
              />
            </Pressable>
          ))}

          {slotWidth > 0 ? (
            <>
              <Animated.View
                pointerEvents="none"
                style={[styles.halo, { left: haloLeft, top: haloTop }, haloStyle]}
              />
              <Animated.View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.window, { left: haloLeft, top: haloTop }, haloStyle]}>
                <Animated.View
                  style={[
                    styles.highlightRow,
                    { left: -haloLeft, top: -haloTop, width: rowSize.width, height: rowSize.height },
                    counterStyle,
                  ]}>
                  {tabs.map(({ name, icon }) => (
                    <View key={name} style={styles.highlightItem}>
                      <AppIcon icon={icon} size={24} color={ICON_ACTIVE} />
                    </View>
                  ))}
                </Animated.View>
              </Animated.View>
            </>
          ) : null}
        </View>
      </TabBarSurface>
    </View>
  );
}

/** Liquid Glass on iOS 26+, solid capsule everywhere else. */
function TabBarSurface({ children }: { children: ReactNode }) {
  if (LIQUID_GLASS) {
    return (
      <GlassView
        style={styles.bar}
        glassEffectStyle="regular"
        colorScheme={TONE.glassScheme}
        tintColor={TONE.glassTint}>
        {children}
      </GlassView>
    );
  }

  return <View style={[styles.bar, styles.barSolid]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  bar: {
    width: '100%',
    maxWidth: 360,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: TONE.borderWidth,
    borderColor: TONE.border,
    boxShadow: TONE.shadow,
  },
  barSolid: {
    backgroundColor: TONE.solid,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ROW_PADDING,
  },
  item: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brand.primary,
    boxShadow: '0px 4px 16px 0px rgba(201, 89, 97, 0.55)',
  },
  window: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  highlightRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: ROW_PADDING,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
