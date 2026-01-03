import { db } from "../database/database";
import { getCategoriasComprasActivas } from "./categoriasComprasService";

// Obtener todas las categorías activas
export async function getCategoriasCompras() {
  return await getCategoriasComprasActivas();
}

// Obtener todas las listas
export async function getListaCompras() {
  const query = "SELECT * FROM ListaCompras ORDER BY fecha_creacion DESC";
  return await db.getAllAsync(query);
}

// Obtener todos los items de la lista
export async function getItemsCompras(id_lista: string) {
  const query = "SELECT * FROM ItemsCompras WHERE id_lista = ? ORDER BY fecha_creacion DESC";
  return await db.getAllAsync(query, [id_lista]);
}

// Agregar nuevo item a la lista
export async function agregarItemCompra(
  item: string,
  id_lista: string,
  notas: string
) {
  await db.runAsync(
    "INSERT INTO ItemsCompras (item, id_lista, notas) VALUES (?, ?, ?)",
    [item, id_lista, notas || null]
  );
}



// Editar Lista
export async function editarListaCompra(
  id: number,
  nombre: string,
  categoria: string,
  tipo: string
) {
  await db.runAsync(
    "UPDATE ListaCompras SET nombre = ?, categoria = ?, type = ? WHERE id = ?",
    [nombre, categoria, tipo, id]
  );
}
export async function eliminarListaCompra(
  id: number
) {
  await db.runAsync(
    "DELETE FROM ListaCompras WHERE id = ?",
    [id]
  );
  await db.runAsync(
    "DELETE FROM ItemsCompras WHERE id_lista = ?",
    [id]
  );
}
//agregarListaCompra
export async function agregarListaCompra(
  nombre: string,
  categoria: string,
  tipo: string
) {
  await db.runAsync(
    "INSERT INTO ListaCompras (nombre, categoria, type) VALUES (?, ?, ?)",
    [nombre, categoria, tipo]
  );
}

// Marcar item como comprado y registrar precio
export async function marcarComoComprado(
  id: number,
  precio: number,
  comprado: boolean = true
) {
  const fechaCompra = comprado ? new Date().toISOString().split("T")[0] : null;

  await db.runAsync(
    "UPDATE ItemsCompras SET comprado = ?, precio = ?, fecha_compra = ? WHERE id = ?",
    [comprado ? 1 : 0, precio, fechaCompra, id]
  );
}

// Alternar estado de comprado (sin registrar precio)
export async function toggleComprado(id: number) {
  console.log("ENTRO AKI " + id)
  await db.runAsync(
    `UPDATE ItemsCompras 
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
  notas: string,
  id_lista: string,
) {
  await db.runAsync(
    "UPDATE ItemsCompras SET item = ?, notas = ?, id_lista = ? WHERE id = ?",
    [item, notas || null, id_lista, id]
  );
}

// Eliminar item
export async function eliminarItemCompra(id: number) {
  await db.runAsync("DELETE FROM ItemsCompras WHERE id = ?", [id]);
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
        FROM ItemsCompras`
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
