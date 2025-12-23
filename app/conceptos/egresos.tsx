import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { initDB } from "../database/database";
import {
    editarConceptoGasto,
    eliminarConceptoGasto,
    getConceptosGasto,
    guardarConceptoGasto
} from "../services/gastosService";

export const options = {
    headerShown: false,
};

export default function ConceptosGastos() {
    const [conceptoGasto, setConceptoGasto] = useState("");
    const [conceptos, setConceptos] = useState<{ id: number; concepto: string; activo: number }[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [conceptoSeleccionado, setConceptoSeleccionado] = useState<any>(null);

    useEffect(() => {
        initDB();
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        const _conceptos = await getConceptosGasto();
        setConceptos(_conceptos as { id: number; concepto: string; activo: number }[]);
    };

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setConceptoGasto("");
        setConceptoSeleccionado(null);
        setModalVisible(true);
    };

    const abrirModalEditar = (item: any) => {
        setModoEdicion(true);
        setConceptoSeleccionado(item);
        setConceptoGasto(item.concepto);
        setModalVisible(true);
    };

    const guardarCambios = async () => {
        if (conceptoGasto.trim() === "") {
            Alert.alert("Error", "Por favor, ingrese un concepto de Gasto");
            return;
        }

        try {
            if (modoEdicion && conceptoSeleccionado) {
                await editarConceptoGasto(conceptoGasto, conceptoSeleccionado.id);
                Alert.alert("Éxito", "Concepto actualizado correctamente ✅");
            } else {
                await guardarConceptoGasto(conceptoGasto);
                Alert.alert("Éxito", "Concepto guardado correctamente ✅");
            }

            limpiarCampo();
            setModalVisible(false);
            await cargarDatos();
        } catch (error) {
            Alert.alert("Error", "No se pudo guardar el concepto");
            console.error(error);
        }
    };

    const handleEliminar = (item: any) => {
        Alert.alert(
            "Confirmar eliminación",
            `¿Estás seguro de eliminar "${item.concepto}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarConceptoGasto(item.id);
                            Alert.alert("Éxito", "Concepto eliminado correctamente");
                            await cargarDatos();
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar el concepto");
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const limpiarCampo = () => {
        setConceptoGasto("");
        setConceptoSeleccionado(null);
        setModoEdicion(false);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                    <Text style={styles.nombre}>{item.concepto}</Text>
                    <Text style={[
                        styles.estado,
                        item.activo ? styles.estadoActivo : styles.estadoInactivo
                    ]}>
                        {item.activo ? "● Activo" : "○ Inactivo"}
                    </Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => abrirModalEditar(item)}
                    >
                        <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleEliminar(item)}
                    >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Conceptos de Gastos</Text>
                <Text style={styles.subtitle}>Gestiona los conceptos de tus gastos mensuales</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={abrirModalNuevo}>
                <Text style={styles.addButtonText}>+ Nuevo Concepto</Text>
            </TouchableOpacity>

            <FlatList
                style={styles.lista}
                data={conceptos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No hay conceptos registrados</Text>
                        <Text style={styles.emptySubtext}>Presiona "Nuevo Concepto" para comenzar</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            />

            {/* Modal Crear/Editar */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {modoEdicion ? "Editar Concepto" : "Nuevo Concepto"}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Descripción del concepto *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Alquiler, Servicios, Alimentación..."
                                value={conceptoGasto}
                                onChangeText={setConceptoGasto}
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setModalVisible(false);
                                    limpiarCampo();
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={guardarCambios}
                            >
                                <Text style={styles.saveBtnText}>
                                    {modoEdicion ? "Actualizar" : "Guardar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    header: {
        backgroundColor: "#dc3545",
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
    },
    addButton: {
        backgroundColor: "#dc3545",
        padding: 16,
        borderRadius: 12,
        margin: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    lista: {
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: "#dc3545",
    },
    cardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardInfo: {
        flex: 1,
    },
    nombre: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 4,
    },
    estado: {
        fontSize: 14,
        fontWeight: "500",
    },
    estadoActivo: {
        color: "#dc3545",
    },
    estadoInactivo: {
        color: "#9ca3af",
    },
    cardActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    editButton: {
        backgroundColor: "#dbeafe",
    },
    deleteButton: {
        backgroundColor: "#fee2e2",
    },
    actionButtonText: {
        fontSize: 18,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#6b7280",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#9ca3af",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 14,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#f3f4f6",
        padding: 16,
        borderRadius: 12,
    },
    cancelBtnText: {
        textAlign: "center",
        color: "#374151",
        fontWeight: "600",
        fontSize: 16,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#dc3545",
        padding: 16,
        borderRadius: 12,
    },
    saveBtnText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});