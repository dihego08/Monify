import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración por defecto de notificaciones
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Solicita permisos de notificaciones al usuario
 * @returns true si los permisos fueron concedidos, false en caso contrario
 */
export async function requestPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Si no tiene permisos, solicitarlos
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('No se concedieron permisos de notificaciones');
            return false;
        }

        // Configuración adicional para Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Recordatorios de Pagos',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    } catch (error) {
        console.error('Error al solicitar permisos de notificaciones:', error);
        return false;
    }
}

/**
 * Programa una notificación local
 * @param id Identificador único de la notificación
 * @param title Título de la notificación
 * @param body Cuerpo del mensaje
 * @param triggerDate Fecha y hora en que se debe disparar la notificación
 * @param data Datos adicionales a incluir en la notificación
 * @returns ID de la notificación programada o null si falla
 */
export async function scheduleNotification(
    id: string,
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, any>
): Promise<string | null> {
    try {
        // Verificar que la fecha sea futura
        if (triggerDate <= new Date()) {
            console.warn('La fecha de la notificación debe ser futura');
            return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            identifier: id,
            content: {
                title,
                body,
                data: data || {},
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                date: triggerDate,
            },
        });

        console.log(`Notificación programada: ${id} para ${triggerDate.toISOString()}`);
        return notificationId;
    } catch (error) {
        console.error('Error al programar notificación:', error);
        return null;
    }
}

/**
 * Cancela una notificación específica
 * @param id Identificador de la notificación a cancelar
 */
export async function cancelNotification(id: string): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
        console.log(`Notificación cancelada: ${id}`);
    } catch (error) {
        console.error('Error al cancelar notificación:', error);
    }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('Todas las notificaciones canceladas');
    } catch (error) {
        console.error('Error al cancelar todas las notificaciones:', error);
    }
}

/**
 * Obtiene todas las notificaciones programadas
 * @returns Lista de notificaciones programadas
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        console.error('Error al obtener notificaciones programadas:', error);
        return [];
    }
}

/**
 * Calcula la fecha de notificación (X días antes de la fecha límite a las 9:00 AM)
 * @param fechaLimite Fecha límite del pago (formato YYYY-MM-DD)
 * @param diasAnticipacion Días de anticipación (por defecto 3)
 * @returns Fecha y hora de la notificación
 */
export function calcularFechaNotificacion(
    fechaLimite: string,
    diasAnticipacion: number = 3
): Date | null {
    try {
        const fecha = new Date(fechaLimite);

        // Verificar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
            console.warn('Fecha límite inválida:', fechaLimite);
            return null;
        }

        // Restar días de anticipación
        fecha.setDate(fecha.getDate() - diasAnticipacion);

        // Establecer hora a las 9:00 AM
        fecha.setHours(9, 0, 0, 0);

        // Verificar que la fecha sea futura
        if (fecha <= new Date()) {
            console.warn('La fecha de notificación ya pasó');
            return null;
        }

        return fecha;
    } catch (error) {
        console.error('Error al calcular fecha de notificación:', error);
        return null;
    }
}

/**
 * Genera un ID único para la notificación de un gasto
 * @param gastoId ID del gasto
 * @returns ID único para la notificación
 */
export function generarIdNotificacion(gastoId: number): string {
    return `gasto_${gastoId}`;
}
