import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { initDB } from "../database/database";
import { getConceptosGasto, guardarConceptoGasto } from "../services/gastosService";

export default function ConceptosGastos() {
    const [conceptoGasto, setConceptoGasto] = useState("");
    const [conceptos, setConceptos] = useState<{ id: number; concepto: string; activo: number }[]>([]);
    useEffect(() => {
        initDB();
        cargarDatos();
    }, []);
    const cargarDatos = async () => {
        const _conceptos = await getConceptosGasto();
        setConceptos(_conceptos as { id: number; concepto: string; activo: number }[]);
    };
    const guardarCambios = async () => {
        if (conceptoGasto.trim() === "") {
            alert("Por favor, ingrese un concepto de Gasto");
            return;
        } else {
            // Lógica para guardar el concepto de egreso en la base de datos    
            var res =await guardarConceptoGasto(conceptoGasto);
            limpiarCampo();
            cargarDatos();
        }
        alert("Concepto de Gasto guardado correctamente ✅");
    };
    const limpiarCampo = () => {
        setConceptoGasto("");
    };
    // Lógica para guardar el concepto de Gasto en la base de datos

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registrar Conceptos de Gastos</Text>
            <Text style={styles.subtitle}>Conceptos de los Gastos mensuales</Text>

            <TextInput
                style={styles.input}
                placeholder="Descripción del concepto de Gasto"
                value={conceptoGasto}
                onChangeText={setConceptoGasto}
            />

            <TouchableOpacity style={styles.saveButton} onPress={guardarCambios}>
                <Text style={styles.saveText}>💾 Guardar</Text>
            </TouchableOpacity>

            <FlatList style={styles.lista}
                data={conceptos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <Text style={styles.nombre}>{item.concepto}</Text>
                        <Text style={styles.estado}>
                            {item.activo ? "Activo" : "Inactivo"}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                        No hay conceptos registrados
                    </Text>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );

}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },

    title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    subtitle: { fontSize: 16, color: "#666", marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
    },
    picker: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        marginBottom: 10,
    },
    lista: {
        marginTop: 20,
    },
    tipoContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    label: {
        fontWeight: "500",
        marginBottom: 5,
    },
    saveButton: {
        backgroundColor: "#16a34a",
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    saveText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "bold" },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    nombre: { fontSize: 16 },
    estado: { fontSize: 14, color: "#666" },
});