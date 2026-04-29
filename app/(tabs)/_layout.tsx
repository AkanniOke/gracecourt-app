import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useAppSettings } from '@/lib/settings-context';

function TabIcon({
  color,
  focused,
  name,
}: {
  color: string;
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={focused ? 25 : 23} color={color} />
      <View style={[styles.indicator, focused && { backgroundColor: color }]} />
    </View>
  );
}

function TabLabel({ color, focused, label }: { color: string; focused: boolean; label: string }) {
  return (
    <Text style={[styles.label, { color }, focused && styles.labelActive]}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const { colors } = useAppSettings();
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      elevation: 12,
      height: 78,
      paddingBottom: 12,
      paddingHorizontal: 8,
      paddingTop: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    }),
    [colors.surface]
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused} label="Home" />
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Announcements',
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused} label="Announcements" />
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="megaphone" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused} label="Events" />
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="calendar-clear" />
          ),
        }}
      />
      <Tabs.Screen
        name="sermons"
        options={{
          title: 'Sermons',
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused} label="Sermons" />
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="play-circle" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused} label="Profile" />
          ),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="person-circle" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  indicator: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
  labelActive: {
    fontWeight: '700',
  },
});
