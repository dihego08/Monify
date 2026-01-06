import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { sincronizarNotificaciones } from '../app/services/gastosService';
import { requestPermissions } from '../app/services/notificationsService';

/**
 * Hook personalizado para gestionar el sistema de notificaciones
 * - Solicita permisos al usuario
 * - Sincroniza notificaciones de gastos pendientes
 * - Configura listeners para interacciones con notificaciones
 */
export function useNotifications() {
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function initializeNotifications() {
            try {
                console.log('Inicializando sistema de notificaciones...');

                // 1. Solicitar permisos
                const granted = await requestPermissions();

                if (isMounted) {
                    setPermissionsGranted(granted);
                }

                if (!granted) {
                    console.warn('Permisos de notificaciones no concedidos');
                    return;
                }

                // 2. Sincronizar notificaciones de gastos pendientes
                await sincronizarNotificaciones();

                if (isMounted) {
                    setIsInitialized(true);
                    console.log('Sistema de notificaciones inicializado correctamente');
                }
            } catch (error) {
                console.error('Error al inicializar notificaciones:', error);
            }
        }

        initializeNotifications();

        // Cleanup
        return () => {
            isMounted = false;
        };
    }, []);

    // Listener para cuando el usuario toca una notificación
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('Notificación tocada:', response);

                // Aquí puedes agregar lógica para navegar a la pantalla de gastos
                // o realizar alguna acción específica
                const data = response.notification.request.content.data;

                if (data.gastoId) {
                    console.log('Navegar a gasto:', data.gastoId);
                    // TODO: Implementar navegación a la pantalla de gastos
                    // navigation.navigate('Gastos', { gastoId: data.gastoId });
                }
            }
        );

        return () => subscription.remove();
    }, []);

    // Listener para cuando llega una notificación mientras la app está abierta
    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notificación recibida:', notification);
                // La notificación se mostrará automáticamente según la configuración
                // en notificationsService.ts
            }
        );

        return () => subscription.remove();
    }, []);

    return {
        permissionsGranted,
        isInitialized,
    };
}
