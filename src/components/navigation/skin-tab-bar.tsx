import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { FC, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import AiChatIcon from '@/assets/icons/nav-ai-chat.svg';
import HomeIcon from '@/assets/icons/nav-home.svg';
import ProfileIcon from '@/assets/icons/nav-profile.svg';
import ScanIcon from '@/assets/icons/nav-scan.svg';
import { Alpha, Colors } from '@/constants/colors';
import { Layout, Radius, Shadows, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useStartScan } from '@/hooks/use-start-scan';
import { useI18n } from '@/i18n/i18n-provider';

type TabName = 'index' | 'scan' | 'ai-chat' | 'account';

const BAR_HEIGHT = 64;
const INDICATOR_SIZE = 48;

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
 * Floating capsule navigation: Home · Scan · Profile, with the active tab marked
 * by a rose halo. Hidden on the Scan tab, which is full-screen by design.
 */
export function SkinTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const { insets } = useDesignInsets();
  const startScan = useStartScan();

  const activeRoute = state.routes[state.index]?.name;
  if (activeRoute === 'scan') {
    return null;
  }

  const tabs: { name: TabName; label: string; Icon: FC<SvgProps> }[] = [
    { name: 'index', label: t.tabs.home, Icon: HomeIcon },
    { name: 'scan', label: t.tabs.scan, Icon: ScanIcon },
    { name: 'ai-chat', label: t.tabs.aiChat, Icon: AiChatIcon },
    { name: 'account', label: t.tabs.profile, Icon: ProfileIcon },
  ];

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
        <View style={styles.row}>
          {tabs.map(({ name, label, Icon }) => {
            const focused = activeRoute === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: focused }}
                onPress={() => onTabPress(name)}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                {focused ? <View style={styles.indicator} /> : null}
                <Icon
                  color={
                    focused
                      ? ICON_ACTIVE
                      : name === 'scan'
                        ? TONE.iconIdlePrimary
                        : TONE.iconIdle
                  }
                />
              </Pressable>
            );
          })}
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
    paddingHorizontal: Spacing.s,
  },
  item: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brand.primary,
    boxShadow: '0px 4px 16px 0px rgba(201, 89, 97, 0.55)',
  },
  pressed: {
    opacity: 0.75,
  },
});
