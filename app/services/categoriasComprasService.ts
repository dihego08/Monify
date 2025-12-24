import { db } from "../database/database";

// Obtener todas las categorías (activas e inactivas)
export async function getTodasCategoriasCompras() {
    return await db.getAllAsync(
        "SELECT * FROM CategoriasCompras ORDER BY nombre ASC"
    );
}

// Obtener solo categorías activas
export async function getCategoriasComprasActivas() {
    return await db.getAllAsync(
        "SELECT * FROM CategoriasCompras WHERE activo = 1 ORDER BY nombre ASC"
    );
}

// Guardar nueva categoría
export async function guardarCategoriaCompra(nombre: string, icono: string) {
    // Verificar si ya existe una categoría con ese nombre
    const existente = await db.getFirstAsync(
        "SELECT id FROM CategoriasCompras WHERE nombre = ?",
        [nombre]
    );

    if (existente) {
        throw new Error("Ya existe una categoría con ese nombre");
    }

    await db.runAsync(
        "INSERT INTO CategoriasCompras (nombre, icono) VALUES (?, ?)",
        [nombre, icono]
    );
}

// Actualizar categoría existente
export async function actualizarCategoriaCompra(
    id: number,
    nombre: string,
    icono: string
) {
    // Verificar si existe otra categoría con el mismo nombre (excluyendo la actual)
    const existente = await db.getFirstAsync(
        "SELECT id FROM CategoriasCompras WHERE nombre = ? AND id != ?",
        [nombre, id]
    );

    if (existente) {
        throw new Error("Ya existe otra categoría con ese nombre");
    }

    await db.runAsync(
        "UPDATE CategoriasCompras SET nombre = ?, icono = ? WHERE id = ?",
        [nombre, icono, id]
    );
}

// Eliminar categoría (eliminación física)
export async function eliminarCategoriaCompra(id: number) {
    await db.runAsync("DELETE FROM CategoriasCompras WHERE id = ?", [id]);
}

// Activar/Desactivar categoría (eliminación lógica)
export async function toggleActivoCategoria(id: number) {
    await db.runAsync(
        `UPDATE CategoriasCompras 
     SET activo = CASE WHEN activo = 0 THEN 1 ELSE 0 END
     WHERE id = ?`,
        [id]
    );
}
