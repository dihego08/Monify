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
  `);
}
