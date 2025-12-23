import { db } from "../database/database";

// Guardar o actualizar concepto de ingreso
export async function guardarConceptoIngreso(concepto: string) {
  /*// Primero verificamos si ya existe un concepto de ingreso registrado para ese concepto
  const existente = await db.getFirstAsync(
    "SELECT id FROM IngresosConceptos WHERE concepto = ?",
    [concepto]
  );

  if (existente) {
    // Si existe, actualizamos el monto
    await db.runAsync(
      "UPDATE IngresosConceptos SET concepto = ? WHERE id = ?",
      [concepto, existente.id]
    );
  } else {
    // Si no existe, insertamos un nuevo registro*/
  await db.runAsync("INSERT INTO IngresosConceptos (concepto) VALUES (?)", [
    concepto,
  ]);
  //}
}

export async function editarConceptoIngreso(concepto: string, id: number) {
  await db.runAsync("UPDATE IngresosConceptos SET concepto = ? WHERE id = ?", [
    concepto,
    id,
  ]);
}
export async function eliminarConceptoIngreso(id: number) {
  await db.runAsync("DELETE FROM IngresosConceptos WHERE id = ?", [id]);
}
// Obtener todos los conceptos de ingreso activos
export async function getConceptosIngreso() {
  return await db.getAllAsync(
    "SELECT * FROM IngresosConceptos WHERE activo = 1 ORDER BY concepto ASC"
  );
}
// Obtener todos los conceptos de ingreso activos
export async function eliminarConceptoPorMes(id: number) {
  console.log("Eliminando ingreso con ID:", id);
  return await db.runAsync("DELETE FROM ingresos WHERE id = ?", [id]);
}

// Obtener ingresos por mes
export async function getIngresosPorMes(mes: string) {
  console.log("Obteniendo ingresos para el mes:", mes);
  return await db.getAllAsync(
    "SELECT i.*, ic.concepto as concepto_ingreso FROM ingresos i " +
      "LEFT JOIN IngresosConceptos ic ON i.id_concepto = ic.id " +
      "WHERE strftime('%m-%Y', fecha) = ? ORDER BY id DESC",
    [mes]
  );
}

// Guardar o actualizar gasto mensual
export async function guardarIngresoMensual(
  concepto_id: number,
  monto: number,
  otros: string,
  fecha: string
) {
  // Si no existe, insertamos un nuevo registro
  await db.runAsync(
    "INSERT INTO ingresos (id_concepto, monto, otros, fecha) VALUES (?, ?, ?, ?)",
    [concepto_id, monto, otros, fecha]
  );
}
export async function actualizarIngresoMensual(
  concepto_id: number,
  monto: number,
  otros: string,
  fecha: string,
  id: number
) {
  // Si no existe, insertamos un nuevo registro
  await db.runAsync(
    "UPDATE ingresos set id_concepto = ?, monto = ?, otros = ?, fecha = ? WHERE id = ?",
    [concepto_id, monto, otros, fecha, id]
  );
}
