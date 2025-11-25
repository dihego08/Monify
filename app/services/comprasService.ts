import { db } from "../database/database";

// Obtener todas las categorías activas
export async function getCategoriasCompras() {
    return await db.getAllAsync(
        "SELECT * FROM CategoriasCompras WHERE activo = 1 ORDER BY nombre ASC"
    );
}

// Obtener todos los items de la lista
export async function getListaCompras(soloNoComprados: boolean = false) {
    const query = soloNoComprados
        ? "SELECT * FROM ListaCompras WHERE comprado = 0 ORDER BY fecha_creacion DESC"
        : "SELECT * FROM ListaCompras ORDER BY comprado ASC, fecha_creacion DESC";
    
    return await db.getAllAsync(query);
}

// Agregar nuevo item a la lista
export async function agregarItemCompra(
    item: string,
    categoria: string,
    notas?: string
) {
    await db.runAsync(
        "INSERT INTO ListaCompras (item, categoria, notas) VALUES (?, ?, ?)",
        [item, categoria, notas || null]
    );
}

// Marcar item como comprado y registrar precio
export async function marcarComoComprado(
    id: number,
    precio: number,
    comprado: boolean = true
) {
    const fechaCompra = comprado ? new Date().toISOString().split('T')[0] : null;
    
    await db.runAsync(
        "UPDATE ListaCompras SET comprado = ?, precio = ?, fecha_compra = ? WHERE id = ?",
        [comprado ? 1 : 0, precio, fechaCompra, id]
    );
}

// Alternar estado de comprado (sin registrar precio)
export async function toggleComprado(id: number) {
    await db.runAsync(
        `UPDATE ListaCompras 
         SET comprado = CASE WHEN comprado = 0 THEN 1 ELSE 0 END,
             fecha_compra = CASE WHEN comprado = 0 THEN datetime('now', 'localtime') ELSE NULL END
         WHERE id = ?`,
        [id]
    );
}

// Editar item
export async function editarItemCompra(
    id: number,
    item: string,
    categoria: string,
    notas?: string
) {
    await db.runAsync(
        "UPDATE ListaCompras SET item = ?, categoria = ?, notas = ? WHERE id = ?",
        [item, categoria, notas || null, id]
    );
}

// Eliminar item
export async function eliminarItemCompra(id: number) {
    await db.runAsync(
        "DELETE FROM ListaCompras WHERE id = ?",
        [id]
    );
}

// Obtener estadísticas
export async function getEstadisticasCompras() {
    const stats = await db.getFirstAsync<{
        total: number;
        comprados: number;
        pendientes: number;
        total_gastado: number;
    }>(
        `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN comprado = 1 THEN 1 ELSE 0 END) as comprados,
            SUM(CASE WHEN comprado = 0 THEN 1 ELSE 0 END) as pendientes,
            COALESCE(SUM(CASE WHEN comprado = 1 THEN precio ELSE 0 END), 0) as total_gastado
        FROM ListaCompras`
    );
    
    return stats;
}

// Obtener compras por categoría
export async function getComprasPorCategoria() {
    return await db.getAllAsync<{
        categoria: string;
        cantidad: number;
        total_gastado: number;
    }>(
        `SELECT 
            categoria,
            COUNT(*) as cantidad,
            COALESCE(SUM(precio), 0) as total_gastado
        FROM ListaCompras
        WHERE comprado = 1
        GROUP BY categoria
        ORDER BY total_gastado DESC`
    );
}

// Limpiar items comprados antiguos (más de 30 días)
export async function limpiarComprasAntiguas() {
    await db.runAsync(
        `DELETE FROM ListaCompras 
         WHERE comprado = 1 
         AND fecha_compra < date('now', '-30 days')`
    );
}
