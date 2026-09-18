import { Tabs } from 'expo-router';

import { SkinTabBar } from '@/components/navigation/skin-tab-bar';
import { Colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <SkinTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.background.base },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="ai-chat" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
