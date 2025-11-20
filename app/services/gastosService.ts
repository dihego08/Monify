import { db } from "../database/database";

// Obtener todos los conceptos de gasto activos
export async function getConceptosGasto() {
  return await db.getAllAsync(
    "SELECT * FROM GastosConceptos WHERE activo = 1 ORDER BY concepto ASC"
  );
}
// Guardar o actualizar concepto de gasto
export async function guardarConceptoGasto(concepto: string) {
    // Primero verificamos si ya existe un concepto de gasto registrado para ese concepto
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
    } else {
        // Si no existe, insertamos un nuevo registro
        await db.runAsync(
            "INSERT INTO GastosConceptos (concepto) VALUES (?)",
            [concepto]
        );
    }
}
export async function eliminarGastoPorMes(id: number) {
    console.log('Eliminando gasto con ID:', id);
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
) {
  // Primero verificamos si ya existe un gasto registrado para ese concepto en ese mes
  const existente = await db.getFirstAsync(
    "SELECT id FROM GastosMensuales WHERE concepto_id = ? AND mes = ?",
    [concepto_id, mes]
  );

  if (existente) {
    // Si existe, actualizamos el monto
    await db.runAsync(
      "UPDATE GastosMensuales SET monto = ?, fecha_limite = ? WHERE id = ?",
      [monto, fecha_limite, existente.id]
    );
  } else {
    // Si no existe, insertamos un nuevo registro
    await db.runAsync(
      "INSERT INTO GastosMensuales (concepto_id, mes, monto, fecha_limite) VALUES (?, ?, ?, ?)",
      [concepto_id, mes, monto, fecha_limite]
    );
  }
}

// Obtener el total de gastos de un mes
export async function getTotalGastosPorMes(mes: string) {
  const total = await db.getFirstAsync(
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
}
