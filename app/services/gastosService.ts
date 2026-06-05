import { db } from "../database/database";
import {
  calcularFechaNotificacion,
  cancelNotification,
  generarIdNotificacion,
  scheduleNotification,
} from "./notificationsService";

// Obtener todos los conceptos de gasto activos
export async function getConceptosGasto() {
  return await db.getAllAsync(
    "SELECT * FROM GastosConceptos /*WHERE activo = 1 */ORDER BY concepto ASC"
  );
}
export async function getConceptosGastoActivos() {
  return await db.getAllAsync(
    "SELECT * FROM GastosConceptos WHERE activo = 1 ORDER BY concepto ASC"
  );
}
export async function editarConceptoGasto(concepto: string, id: number) {
  await db.runAsync(
    "UPDATE GastosConceptos SET concepto = ? WHERE id = ?",
    [concepto, id]
  );
}
export async function eliminarConceptoGasto(id: number) {
  await db.runAsync(
    "DELETE FROM GastosConceptos WHERE id = ?",
    [id]
  );
}
export async function toggleActivoGasto(id: number) {
  await db.runAsync(
    "UPDATE GastosConceptos SET activo = CASE WHEN activo = 1 THEN 0 ELSE 1 END WHERE id = ?",
    [id]
  );
}
// Guardar o actualizar concepto de gasto
export async function guardarConceptoGasto(concepto: string) {
  /*// Primero verificamos si ya existe un concepto de gasto registrado para ese concepto
  const existente = await db.getFirstAsync(
      "SELECT id FROM GastosConceptos WHERE concepto = ?",
      [concepto]
  );

  if (existente) {
      // Si existe, actualizamos el nombre
      await db.runAsync(
          "UPDATE GastosConceptos SET concepto = ? WHERE id = ?",
          [concepto, existente.id]
      );
  } else {*/
  // Si no existe, insertamos un nuevo registro
  await db.runAsync(
    "INSERT INTO GastosConceptos (concepto) VALUES (?)",
    [concepto]
  );
  //}
}
export async function eliminarGastoPorMes(id: number) {
  console.log('Eliminando gasto con ID:', id);

  // Cancelar notificación antes de eliminar
  await cancelarNotificacionGasto(id);

  return await db.runAsync(
    "DELETE FROM GastosMensuales WHERE id = ?",
    [id]
  );
}
// Obtener todos los gastos registrados en un mes
export async function getGastosPorMes(mes: string) {
  return await db.getAllAsync(
    `SELECT gm.*, gc.concepto 
     FROM GastosMensuales gm
     JOIN GastosConceptos gc ON gm.concepto_id = gc.id
     WHERE gm.mes = ?
     ORDER BY gm.pagado, gc.concepto ASC`,
    [mes]
  );
}
// Guardar o actualizar gasto mensual
export async function guardarGastoMensual(
  concepto_id: number,
  mes: string,
  monto: number,
  fecha_limite: string,
  descripcion: string,
  cuenta_id: number = 1
) {
  const result = await db.runAsync(
    "INSERT INTO GastosMensuales (concepto_id, mes, monto, fecha_limite, descripcion, cuenta_id) VALUES (?, ?, ?, ?, ?, ?)",
    [concepto_id, mes, monto, fecha_limite, descripcion, cuenta_id]
  );

  // Programar notificación si tiene fecha límite
  if (fecha_limite && result.lastInsertRowId) {
    await programarNotificacionGasto(result.lastInsertRowId, concepto_id, fecha_limite, monto);
  }
}
export async function actualizarGastoMensual(
  concepto_id: number,
  mes: string,
  monto: number,
  fecha_limite: string,
  descripcion: string,
  id: number,
  cuenta_id: number = 1
) {
  await db.runAsync(
    "UPDATE GastosMensuales SET concepto_id = ?, mes = ?, monto = ?, fecha_limite = ?, descripcion = ?, cuenta_id = ? WHERE id = ?",
    [concepto_id, mes, monto, fecha_limite, descripcion, cuenta_id, id]
  );

  // Cancelar notificación anterior y programar nueva
  await cancelarNotificacionGasto(id);
  if (fecha_limite) {
    await programarNotificacionGasto(id, concepto_id, fecha_limite, monto);
  }
}
// Obtener el total de gastos de un mes
export async function getTotalGastosPorMes(mes: string) {
  const total = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(monto) as total
     FROM GastosMensuales
     WHERE mes = ?`,
    [mes]
  );
  return total?.total || 0;
}
// Actualizar el estado de pago de un gasto
export async function actualizarEstadoGasto(id: number, pagado: boolean) {
  await db.runAsync(
    "UPDATE GastosMensuales SET pagado = ? WHERE id = ?",
    [pagado, id]
  );

  // Si se marca como pagado, cancelar la notificación
  if (pagado) {
    await cancelarNotificacionGasto(id);
  } else {
    // Si se desmarca como pagado, re-programar la notificación
    const gasto = await db.getFirstAsync<{
      concepto_id: number;
      fecha_limite: string;
      monto: number;
    }>(
      "SELECT concepto_id, fecha_limite, monto FROM GastosMensuales WHERE id = ?",
      [id]
    );
    if (gasto?.fecha_limite) {
      await programarNotificacionGasto(id, gasto.concepto_id, gasto.fecha_limite, gasto.monto);
    }
  }
}

// ========== FUNCIONES DE NOTIFICACIONES ==========

/**
 * Programa una notificación para un gasto específico
 */
async function programarNotificacionGasto(
  gastoId: number,
  conceptoId: number,
  fechaLimite: string,
  monto: number
): Promise<void> {
  try {
    // Obtener el nombre del concepto
    const concepto = await db.getFirstAsync<{ concepto: string }>(
      "SELECT concepto FROM GastosConceptos WHERE id = ?",
      [conceptoId]
    );

    if (!concepto) {
      console.warn('Concepto no encontrado para el gasto:', gastoId);
      return;
    }

    // Calcular fecha de notificación (3 días antes a las 9:00 AM)
    const fechaNotificacion = calcularFechaNotificacion(fechaLimite, 3);

    if (!fechaNotificacion) {
      console.warn('No se pudo calcular fecha de notificación para:', fechaLimite);
      return;
    }

    // Generar ID único para la notificación
    const notificationId = generarIdNotificacion(gastoId);

    // Formatear el monto
    const montoFormateado = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);

    // Programar la notificación
    await scheduleNotification(
      notificationId,
      '💰 Recordatorio de Pago',
      `${concepto.concepto}: ${montoFormateado} vence en 3 días (${fechaLimite})`,
      fechaNotificacion,
      { gastoId, conceptoId, monto, fechaLimite }
    );

    console.log(`Notificación programada para gasto ${gastoId}: ${concepto.concepto}`);
  } catch (error) {
    console.error('Error al programar notificación de gasto:', error);
  }
}

/**
 * Cancela la notificación de un gasto específico
 */
async function cancelarNotificacionGasto(gastoId: number): Promise<void> {
  try {
    const notificationId = generarIdNotificacion(gastoId);
    await cancelNotification(notificationId);
    console.log(`Notificación cancelada para gasto ${gastoId}`);
  } catch (error) {
    console.error('Error al cancelar notificación de gasto:', error);
  }
}

/**
 * Sincroniza todas las notificaciones de gastos pendientes
 * Útil para ejecutar al iniciar la app
 */
export async function sincronizarNotificaciones(): Promise<void> {
  try {
    console.log('Sincronizando notificaciones de gastos pendientes...');

    // Obtener todos los gastos pendientes con fecha límite
    const gastosPendientes = await db.getAllAsync<{
      id: number;
      concepto_id: number;
      fecha_limite: string;
      monto: number;
    }>(
      `SELECT id, concepto_id, fecha_limite, monto 
       FROM GastosMensuales 
       WHERE pagado = 0 AND fecha_limite IS NOT NULL`
    );

    // Cancelar todas las notificaciones existentes de gastos
    // (para evitar duplicados)
    for (const gasto of gastosPendientes) {
      await cancelarNotificacionGasto(gasto.id);
    }

    // Re-programar notificaciones para gastos pendientes
    let programadas = 0;
    for (const gasto of gastosPendientes) {
      const fechaNotificacion = calcularFechaNotificacion(gasto.fecha_limite, 3);
      if (fechaNotificacion) {
        await programarNotificacionGasto(
          gasto.id,
          gasto.concepto_id,
          gasto.fecha_limite,
          gasto.monto
        );
        programadas++;
      }
    }

    console.log(`Sincronización completada: ${programadas} notificaciones programadas`);
  } catch (error) {
    console.error('Error al sincronizar notificaciones:', error);
  }
}
