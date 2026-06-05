import * as SQLite from "expo-sqlite";
export const db = SQLite.openDatabaseSync("db_finanzas.db");

export async function initDB() {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingresos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_concepto TEXT NOT NULL,
      monto REAL NOT NULL,
      otros TEXT default NULL,
      fecha TEXT NOT NULL,
      cuenta_id INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Cuentas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        saldo_inicial REAL DEFAULT 0,
        color TEXT,
        es_default_pagos INTEGER DEFAULT 0,
        es_default_hormiga INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO Cuentas (id, nombre, saldo_inicial, color, es_default_pagos, es_default_hormiga) 
    VALUES (1, 'Billetera Principal', 0, '#3b82f6', 1, 1);

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
        descripcion TEXT,
        FOREIGN KEY(concepto_id) REFERENCES GastosConceptos(id)
      );

    -- ⭐ NUEVA TABLA: Gastos Hormiga
    CREATE TABLE IF NOT EXISTS GastosHormiga (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monto REAL NOT NULL,
        descripcion TEXT,
        fecha TEXT DEFAULT (datetime('now', 'localtime'))
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

    // Migraciones seguras para agregar cuenta_id a tablas existentes si ya estaban creadas
    try { await db.execAsync("ALTER TABLE ingresos ADD COLUMN cuenta_id INTEGER DEFAULT 1;"); } catch (e) {}
    try { await db.execAsync("ALTER TABLE GastosMensuales ADD COLUMN cuenta_id INTEGER DEFAULT 1;"); } catch (e) {}
    try { await db.execAsync("ALTER TABLE GastosHormiga ADD COLUMN cuenta_id INTEGER DEFAULT 1;"); } catch (e) {}
}
