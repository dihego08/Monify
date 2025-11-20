import { db } from "../database/database";

// Ingresos
export async function addIngreso(concepto: string, monto: number) {
  const fecha = new Date().toISOString().split("T")[0];
  await db.runAsync(
    "INSERT INTO ingresos (concepto, monto, fecha) VALUES (?, ?, ?)",
    [concepto, monto, fecha]
  );
}

export async function getIngresos() {
  return await db.getAllAsync("SELECT * FROM ingresos ORDER BY id DESC");
}

// Saldo total
/*export async function getSaldoActual() {
  const ingresos = await db.getFirstAsync("SELECT SUM(monto) as total FROM ingresos");
  const gastos = await db.getFirstAsync("SELECT SUM(monto) as total FROM GastosMensuales where pagado = 1");
  const total = (ingresos?.total || 0) - (gastos?.total || 0);
  return total;
}*/

export function getMesActual(): string {
    const fecha = new Date();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${mes}-${anio}`; // "11-2025"
}

/*********************************************** */

/**
 * Obtener estadísticas del mes actual
 */
/**
 * Obtener saldo actual (ingresos - gastos)
 */
export async function getSaldoActual(): Promise<number> {
    const ingresos = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(monto) as total FROM ingresos"
    );
    const gastos = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(monto) as total FROM GastosMensuales WHERE pagado = 1"
    );
    console.log("Ingresos __:");
    console.log(ingresos);
    console.log("Gastos Pagados__:");
    console.log(gastos);
    console.log("_________");
    const total = (ingresos?.total || 0) - (gastos?.total || 0);
    return total;
}

/**
 * Obtener estadísticas del mes actual
 */
export async function getEstadisticasMensuales(): Promise<{
    totalPagados: number;
    montoPagado: number;
    totalPendientes: number;
    montoPendiente: number;
    totalIngresos: number;
    montoIngresos: number;
}> {
    const mesActual = getMesActual(); // "11-2025" // "2025-11"
    console.log("Mes Actual:");
    console.log(mesActual);
    // Gastos pagados
    const pagados = await db.getFirstAsync<{ total: number; monto: number }>(
        `SELECT COUNT(*) as total, COALESCE(SUM(monto), 0) as monto
         FROM GastosMensuales 
         WHERE pagado = 1 AND mes = ?`,
        [mesActual]
    );
    
    // Gastos pendientes
    const pendientes = await db.getFirstAsync<{ total: number; monto: number }>(
        `SELECT COUNT(*) as total, COALESCE(SUM(monto), 0) as monto
         FROM GastosMensuales 
         WHERE pagado = 0 AND mes = ?`,
        [mesActual]
    );
    
    // Ingresos del mes
    const ingresos = await db.getFirstAsync<{ total: number; monto: number }>(
        `SELECT COUNT(*) as total, COALESCE(SUM(monto), 0) as monto
         FROM ingresos 
         WHERE strftime('%Y-%m', fecha) = ?`,
        [new Date().toISOString().slice(0, 7)]
    );
    console.log("Ingresos:");
    console.log(ingresos);
    console.log("Gastos Pagados:");
    console.log(pagados);
    console.log("Gastos Pendientes:");
    console.log(pendientes);
    return {
        totalPagados: pagados?.total || 0,
        montoPagado: pagados?.monto || 0,
        totalPendientes: pendientes?.total || 0,
        montoPendiente: pendientes?.monto || 0,
        totalIngresos: ingresos?.total || 0,
        montoIngresos: ingresos?.monto || 0,
    };
}

/**
 * Obtener gastos próximos a vencer o vencidos
 */
export async function getGastosProximosVencer(): Promise<Array<{
    id: number;
    concepto: string;
    monto: number;
    fecha_limite: string;
    dias_restantes: number;
    estado: 'vencido' | 'proximo' | 'normal';
}>> {
    const gastos = await db.getAllAsync<{
        id: number;
        concepto: string;
        monto: number;
        fecha_limite: string;
        dias_restantes: number;
    }>(
        `SELECT 
            gm.id,
            gc.concepto,
            gm.monto,
            gm.fecha_limite,
            CAST(julianday(gm.fecha_limite) - julianday('now') AS INTEGER) as dias_restantes
        FROM GastosMensuales gm
        JOIN GastosConceptos gc ON gm.concepto_id = gc.id
        WHERE gm.pagado = 0 
          AND gm.fecha_limite IS NOT NULL
          AND gm.fecha_limite != ''
        ORDER BY gm.fecha_limite ASC
        LIMIT 10`
    );
    
    return gastos.map(gasto => {
        let estado: 'vencido' | 'proximo' | 'normal';
        
        if (gasto.dias_restantes < 0) {
            estado = 'vencido';
        } else if (gasto.dias_restantes <= 3) {
            estado = 'proximo';
        } else {
            estado = 'normal';
        }
        
        return {
            ...gasto,
            estado
        };
    });
}

/**
 * Obtener resumen por categoría
 */
export async function getResumenPorCategoria(): Promise<Array<{
    concepto: string;
    cantidad: number;
    total: number;
    pagado: number;
    pendiente: number;
}>> {
    const mesActual = getMesActual(); // "11-2025"
    
    const resumen = await db.getAllAsync<{
        concepto: string;
        cantidad: number;
        total: number;
        pagado: number;
        pendiente: number;
    }>(
        `SELECT 
            gc.concepto,
            COUNT(*) as cantidad,
            SUM(gm.monto) as total,
            SUM(CASE WHEN gm.pagado = 1 THEN gm.monto ELSE 0 END) as pagado,
            SUM(CASE WHEN gm.pagado = 0 THEN gm.monto ELSE 0 END) as pendiente
        FROM GastosMensuales gm
        JOIN GastosConceptos gc ON gm.concepto_id = gc.id
        WHERE gm.mes = ?
        GROUP BY gc.concepto
        ORDER BY total DESC`,
        [mesActual]
    );
    
    return resumen;
}

/**
 * Obtener historial de saldos (últimos 6 meses)
 */
export async function getHistorialSaldos(): Promise<Array<{
    mes: string;
    ingresos: number;
    gastos: number;
    saldo: number;
}>> {
    const historial = await db.getAllAsync<{
        mes: string;
        ingresos: number;
        gastos: number;
    }>(
        `WITH RECURSIVE meses(mes) AS (
            SELECT date('now', 'start of month', '-5 months')
            UNION ALL
            SELECT date(mes, '+1 month')
            FROM meses
            WHERE mes < date('now', 'start of month')
        )
        SELECT 
            strftime('%Y-%m', meses.mes) as mes,
            COALESCE(SUM(i.monto), 0) as ingresos,
            COALESCE(SUM(gm.monto), 0) as gastos
        FROM meses
        LEFT JOIN ingresos i ON strftime('%Y-%m', i.fecha) = strftime('%Y-%m', meses.mes)
        LEFT JOIN GastosMensuales gm ON gm.mes = strftime('%Y-%m', meses.mes) AND gm.pagado = 1
        GROUP BY strftime('%Y-%m', meses.mes)
        ORDER BY mes`
    );
    
    return historial.map(item => ({
        ...item,
        saldo: item.ingresos - item.gastos
    }));
}

/**
 * Obtener gastos del mes actual
 */
export async function getGastosMesActual(): Promise<Array<{
    id: number;
    concepto: string;
    monto: number;
    pagado: number;
    fecha_limite: string;
}>> {
    const mesActual = getMesActual(); // "11-2025"
    
    const gastos = await db.getAllAsync<{
        id: number;
        concepto: string;
        monto: number;
        pagado: number;
        fecha_limite: string;
    }>(
        `SELECT 
            gm.id,
            gc.concepto,
            gm.monto,
            gm.pagado,
            gm.fecha_limite
        FROM GastosMensuales gm
        JOIN GastosConceptos gc ON gm.concepto_id = gc.id
        WHERE gm.mes = ?
        ORDER BY gm.pagado ASC, gm.fecha_limite ASC`,
        [mesActual]
    );
    
    return gastos;
}

/**
 * Obtener ingresos del mes actual
 */
export async function getIngresosMesActual(): Promise<Array<{
    id: number;
    concepto: string;
    monto: number;
    fecha: string;
    otros: string;
}>> {
    const mesActual = getMesActual(); // "11-2025"
    
    const ingresos = await db.getAllAsync<{
        id: number;
        concepto: string;
        monto: number;
        fecha: string;
        otros: string;
    }>(
        `SELECT 
            i.id,
            ic.concepto,
            i.monto,
            i.fecha,
            i.otros
        FROM ingresos i
        JOIN IngresosConceptos ic ON i.id_concepto = ic.id
        WHERE strftime('%Y-%m', i.fecha) = ?
        ORDER BY i.fecha DESC`,
        [mesActual]
    );
    
    return ingresos;
}

/**
 * Marcar gasto como pagado/no pagado
 */
export async function togglePagadoGasto(id: number, pagado: boolean): Promise<void> {
    await db.runAsync(
        'UPDATE GastosMensuales SET pagado = ? WHERE id = ?',
        [pagado ? 1 : 0, id]
    );
}

/**
 * Eliminar un gasto
 */
export async function eliminarGasto(id: number): Promise<void> {
    await db.runAsync(
        'DELETE FROM GastosMensuales WHERE id = ?',
        [id]
    );
}

/**
 * Eliminar un ingreso
 */
export async function eliminarIngreso(id: number): Promise<void> {
    await db.runAsync(
        'DELETE FROM ingresos WHERE id = ?',
        [id]
    );
}

/**
 * Obtener estadísticas generales
 */
export async function getEstadisticasGenerales(): Promise<{
    totalIngresos: number;
    totalGastos: number;
    saldoTotal: number;
    promedioIngresosMensual: number;
    promedioGastosMensual: number;
}> {
    const stats = await db.getFirstAsync<{
        total_ingresos: number;
        total_gastos: number;
        meses_con_ingresos: number;
        meses_con_gastos: number;
    }>(
        `SELECT 
            COALESCE(SUM(i.monto), 0) as total_ingresos,
            COALESCE(SUM(gm.monto), 0) as total_gastos,
            COUNT(DISTINCT strftime('%Y-%m', i.fecha)) as meses_con_ingresos,
            COUNT(DISTINCT gm.mes) as meses_con_gastos
        FROM ingresos i
        LEFT JOIN GastosMensuales gm ON gm.pagado = 1`
    );
    
    return {
        totalIngresos: stats?.total_ingresos || 0,
        totalGastos: stats?.total_gastos || 0,
        saldoTotal: (stats?.total_ingresos || 0) - (stats?.total_gastos || 0),
        promedioIngresosMensual: stats?.meses_con_ingresos 
            ? (stats.total_ingresos / stats.meses_con_ingresos) 
            : 0,
        promedioGastosMensual: stats?.meses_con_gastos 
            ? (stats.total_gastos / stats.meses_con_gastos) 
            : 0,
    };
}