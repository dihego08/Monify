import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DollarSign, Menu, Wallet, Coffee } from 'lucide-react-native';

const WalkthroughableView = walkthroughable(View);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { start, copilotEvents } = useCopilot();

  useEffect(() => {
    const checkTutorial = async () => {
      try {
        // === MODO DEBUG: Limpiamos el storage temporalmente para forzar que salga ===
        await AsyncStorage.removeItem('hasSeenTutorial'); 
        
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
        console.log("👉 ESTADO DEL TUTORIAL:", hasSeenTutorial);

        if (!hasSeenTutorial) {
          console.log("🚀 Iniciando tutorial...");
          // Aumentamos el delay para asegurar que el icono del tab bar ya se renderizó
          setTimeout(() => {
            start();
          }, 1000);
        }
      } catch (error) {
        console.error("Error reading async storage", error);
      }
    };
    checkTutorial();

    const handleStop = async () => {
      try {
        await AsyncStorage.setItem('hasSeenTutorial', 'true');
      } catch (error) {
        console.error("Error saving async storage", error);
      }
    };
    copilotEvents.on('stop', handleStop);

    return () => {
      copilotEvents.off('stop');
    };
  }, []);

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
            title: 'Pagos',
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="hormiga"
          options={{
            title: 'Hormiga',
            tabBarIcon: ({ color, size }) => <Coffee color={color} size={size} />,
          }}
        />
        {/*<Tabs.Screen
          name="shopping"
          options={{
            title: 'Lista Compras',
            tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
          }}
        />*/}
        <Tabs.Screen
          name="actions"
          options={{
            title: 'Menú',
            tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
            tabBarButton: (props) => (
              <CopilotStep text="Empieza configurando tus conceptos de ingresos y gastos aquí." order={1} name="menu">
                <WalkthroughableView>
                  <HapticTab {...props} />
                </WalkthroughableView>
              </CopilotStep>
            )
          }}
        />
      </Tabs>
    );
  }
