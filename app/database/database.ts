import * as SQLite from "expo-sqlite";
export const db = SQLite.openDatabaseSync("finanzas.db");

export function initDB() {
    db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_concepto TEXT NOT NULL,
      monto REAL NOT NULL,
      otros TEXT default NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS GastosConceptos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concepto TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      );

    CREATE TABLE IF NOT EXISTS IngresosConceptos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concepto TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      );

    CREATE TABLE IF NOT EXISTS GastosMensuales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        concepto_id INTEGER,
        mes TEXT,
        monto REAL,
        fecha_registro TEXT,
        pagado INTEGER DEFAULT 0,
        fecha_limite TEXT,
        FOREIGN KEY(concepto_id) REFERENCES GastosConceptos(id)
      );

    -- ⭐ NUEVA TABLA: Lista de Compras
    CREATE TABLE IF NOT EXISTS ListaCompras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT,
        nombre TEXT,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
      );

    CREATE TABLE IF NOT EXISTS ItemsCompras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        id_lista INTEGER,
        comprado INTEGER DEFAULT 0,
        precio REAL,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime')),
        fecha_compra TEXT,
        notas TEXT
      );

    -- ⭐ NUEVA TABLA: Categorías de Compras
    CREATE TABLE IF NOT EXISTS CategoriasCompras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        icono TEXT,
        activo INTEGER DEFAULT 1
      );

    -- Insertar categorías por defecto si no existen
    INSERT OR IGNORE INTO CategoriasCompras (id, nombre, icono) VALUES
        (1, 'Alimentos', '🍎'),
        (2, 'Lácteos', '🥛'),
        (3, 'Carnes', '🥩'),
        (4, 'Panadería', '🍞'),
        (5, 'Bebidas', '🥤'),
        (6, 'Limpieza', '🧹'),
        (7, 'Hogar', '🏠'),
        (8, 'Higiene', '🧼'),
        (9, 'Farmacia', '💊'),
        (10, 'Otros', '📦');
  `);
}
