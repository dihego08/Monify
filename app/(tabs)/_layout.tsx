  import { Tabs } from 'expo-router';
import React from 'react';

  import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DollarSign, Menu, Wallet } from 'lucide-react-native';

  export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Ingresos',
            tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Gastos',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="actions"
          options={{
            title: 'Menú',
            tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
          }}
        />
      </Tabs>
    );
  }
