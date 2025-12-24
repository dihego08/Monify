import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { initDB } from "../database/database";
import {
    actualizarCategoriaCompra,
    eliminarCategoriaCompra,
    getTodasCategoriasCompras,
    guardarCategoriaCompra,
    toggleActivoCategoria,
} from "../services/categoriasComprasService";

interface Categoria {
    id: number;
    nombre: string;
    icono: string;
    activo: number;
}

export default function CategoriasCompras() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(false);
    const [categoriaActual, setCategoriaActual] = useState<Categoria | null>(null);
    const [nombre, setNombre] = useState("");
    const [icono, setIcono] = useState("");

    useEffect(() => {
        initDB();
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        const _categorias = await getTodasCategoriasCompras();
        setCategorias(_categorias as Categoria[]);
    };

    const abrirModalNuevo = () => {
        setEditando(false);
        setCategoriaActual(null);
        setNombre("");
        setIcono("");
        setModalVisible(true);
    };

    const abrirModalEditar = (categoria: Categoria) => {
        setEditando(true);
        setCategoriaActual(categoria);
        setNombre(categoria.nombre);
        setIcono(categoria.icono);
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setModalVisible(false);
        setNombre("");
        setIcono("");
        setCategoriaActual(null);
    };

    const guardarCambios = async () => {
        if (nombre.trim() === "") {
            Alert.alert("Error", "Por favor, ingrese un nombre para la categoría");
            return;
        }

        if (icono.trim() === "") {
            Alert.alert("Error", "Por favor, ingrese un icono para la categoría");
            return;
        }

        try {
            if (editando && categoriaActual) {
                await actualizarCategoriaCompra(categoriaActual.id, nombre, icono);
                Alert.alert("Éxito", "Categoría actualizada correctamente ✅");
            } else {
                await guardarCategoriaCompra(nombre, icono);
                Alert.alert("Éxito", "Categoría guardada correctamente ✅");
            }
            cerrarModal();
            cargarDatos();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al guardar la categoría");
        }
    };

    const confirmarEliminar = (categoria: Categoria) => {
        Alert.alert(
            "Confirmar eliminación",
            `¿Está seguro de eliminar la categoría "${categoria.nombre}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => eliminar(categoria.id),
                },
            ]
        );
    };

    const eliminar = async (id: number) => {
        try {
            await eliminarCategoriaCompra(id);
            Alert.alert("Éxito", "Categoría eliminada correctamente ✅");
            cargarDatos();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al eliminar la categoría");
        }
    };

    const toggleActivo = async (id: number) => {
        try {
            await toggleActivoCategoria(id);
            cargarDatos();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error al cambiar el estado");
        }
    };

    const iconosSugeridos = ["🍎", "🥛", "🥩", "🍞", "🥤", "🧹", "🏠", "🧼", "💊", "📦", "🛒", "🍕", "🥗", "🍰", "🧃"];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Categorías de Compras</Text>
            <Text style={styles.subtitle}>Gestiona las categorías de tus listas de compras</Text>

            <TouchableOpacity style={styles.addButton} onPress={abrirModalNuevo}>
                <Text style={styles.addButtonText}>➕ Nueva Categoría</Text>
            </TouchableOpacity>

            <FlatList
                style={styles.lista}
                data={categorias}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <View style={styles.infoContainer}>
                            <Text style={styles.icono}>{item.icono}</Text>
                            <View style={styles.textoContainer}>
                                <Text style={styles.nombre}>{item.nombre}</Text>
                                <Text style={[styles.estado, item.activo ? styles.activo : styles.inactivo]}>
                                    {item.activo ? "Activo" : "Inactivo"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.botonesContainer}>
                            <TouchableOpacity
                                style={styles.botonToggle}
                                onPress={() => toggleActivo(item.id)}
                            >
                                <Text style={styles.botonTexto}>{item.activo ? "🔴" : "🟢"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.botonEditar}
                                onPress={() => abrirModalEditar(item)}
                            >
                                <Text style={styles.botonTexto}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.botonEliminar}
                                onPress={() => confirmarEliminar(item)}
                            >
                                <Text style={styles.botonTexto}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                        No hay categorías registradas
                    </Text>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            />

            {/* Modal para agregar/editar */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={cerrarModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editando ? "Editar Categoría" : "Nueva Categoría"}
                        </Text>

                        <Text style={styles.label}>Nombre:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Frutas y Verduras"
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        <Text style={styles.label}>Icono:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 🍎"
                            value={icono}
                            onChangeText={setIcono}
                            maxLength={2}
                        />

                        <Text style={styles.label}>Iconos sugeridos:</Text>
                        <View style={styles.iconosContainer}>
                            {iconosSugeridos.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.iconoSugerido}
                                    onPress={() => setIcono(emoji)}
                                >
                                    <Text style={styles.iconoTexto}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalBotones}>
                            <TouchableOpacity
                                style={[styles.modalBoton, styles.botonCancelar]}
                                onPress={cerrarModal}
                            >
                                <Text style={styles.modalBotonTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBoton, styles.botonGuardar]}
                                onPress={guardarCambios}
                            >
                                <Text style={styles.modalBotonTexto}>
                                    {editando ? "Actualizar" : "Guardar"}
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
        backgroundColor: "#fff",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: "#16a34a",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    addButtonText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "bold",
    },
    lista: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
        marginBottom: 8,
        borderRadius: 8,
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    icono: {
        fontSize: 32,
        marginRight: 12,
    },
    textoContainer: {
        flex: 1,
    },
    nombre: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    estado: {
        fontSize: 12,
        fontWeight: "500",
    },
    activo: {
        color: "#16a34a",
    },
    inactivo: {
        color: "#dc2626",
    },
    botonesContainer: {
        flexDirection: "row",
        gap: 8,
    },
    botonToggle: {
        padding: 8,
    },
    botonEditar: {
        padding: 8,
    },
    botonEliminar: {
        padding: 8,
    },
    botonTexto: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        width: "90%",
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: "#374151",
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    iconosContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    iconoSugerido: {
        padding: 8,
        backgroundColor: "#f3f4f6",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    iconoTexto: {
        fontSize: 24,
    },
    modalBotones: {
        flexDirection: "row",
        gap: 12,
    },
    modalBoton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    botonCancelar: {
        backgroundColor: "#6b7280",
    },
    botonGuardar: {
        backgroundColor: "#16a34a",
    },
    modalBotonTexto: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
