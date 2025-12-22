  import { Tabs } from 'expo-router';

  import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ShoppingCart } from 'lucide-react-native';

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
          name="shopping"
          options={{
            title: 'Lista Compras',
            tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
          }}
        />
      </Tabs>
    );
  }
