import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import {
    Check,
    Edit2,
    MoreVertical,
    Plus,
    ShoppingCart,
    Trash2,
    X
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {
    agregarItemCompra,
    editarItemCompra,
    eliminarItemCompra,
    getCategoriasCompras,
    getEstadisticasCompras,
    getListaCompras,
    marcarComoComprado,
    toggleComprado
} from "../services/comprasService";

export default function ShoppingScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalCompraVisible, setModalCompraVisible] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [estadisticas, setEstadisticas] = useState<any>({});
    
    // Estados para el formulario
    const [itemNombre, setItemNombre] = useState("");
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
    const [notas, setNotas] = useState("");
    const [precio, setPrecio] = useState("");
    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisibleId, setMenuVisibleId] = useState<number | null>(null);
    const [soloNoComprados, setSoloNoComprados] = useState(false);

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [soloNoComprados])
    );

    const cargarDatos = async () => {
        try {
            const listaCategorias = await getCategoriasCompras();
            setCategorias(listaCategorias);

            const listaItems = await getListaCompras(soloNoComprados);
            setItems(listaItems);

            const stats = await getEstadisticasCompras();
            setEstadisticas(stats);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setItemNombre("");
        setCategoriaSeleccionada("");
        setNotas("");
        setModalVisible(true);
    };

    const abrirModalEditar = (item: any) => {
        setModoEdicion(true);
        setItemSeleccionado(item);
        setItemNombre(item.item);
        setCategoriaSeleccionada(item.categoria);
        setNotas(item.notas || "");
        setMenuVisibleId(null);
        setModalVisible(true);
    };

    const guardarItem = async () => {
        if (!itemNombre.trim() || !categoriaSeleccionada) {
            Alert.alert("Error", "Completa el nombre del item y categoría");
            return;
        }

        try {
            if (modoEdicion && itemSeleccionado) {
                await editarItemCompra(itemSeleccionado.id, itemNombre, categoriaSeleccionada, notas);
                Alert.alert("Éxito", "Item actualizado correctamente");
            } else {
                await agregarItemCompra(itemNombre, categoriaSeleccionada, notas);
                Alert.alert("Éxito", "Item agregado a la lista");
            }

            setModalVisible(false);
            await cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            Alert.alert("Error", "No se pudo guardar el item");
        }
    };

    const handleToggleComprado = async (item: any) => {
        if (!item.comprado) {
            // Si va a marcar como comprado, preguntar por el precio
            setItemSeleccionado(item);
            setPrecio("");
            setModalCompraVisible(true);
        } else {
            // Si va a desmarcar, simplemente toggle
            await toggleComprado(item.id);
            await cargarDatos();
        }
    };

    const registrarCompra = async () => {
        if (!precio || parseFloat(precio) <= 0) {
            Alert.alert("Error", "Ingresa un precio válido");
            return;
        }

        try {
            await marcarComoComprado(itemSeleccionado.id, parseFloat(precio), true);
            Alert.alert("Éxito", "Compra registrada");
            setModalCompraVisible(false);
            await cargarDatos();
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "No se pudo registrar la compra");
        }
    };

    const handleEliminar = (item: any) => {
        setMenuVisibleId(null);
        Alert.alert(
            "Confirmar eliminación",
            `¿Eliminar "${item.item}" de la lista?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarItemCompra(item.id);
                            Alert.alert("Éxito", "Item eliminado");
                            await cargarDatos();
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar el item");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.itemCard, item.comprado === 1 && styles.itemCardComprado]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <ShoppingCart color={item.comprado ? "#10b981" : "#8b5cf6"} size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[
                        styles.cardNombre,
                        item.comprado === 1 && styles.cardNombreComprado
                    ]}>
                        {item.item}
                    </Text>
                    <Text style={styles.cardCategoria}>{item.categoria}</Text>
                    {item.notas && (
                        <Text style={styles.cardNotas} numberOfLines={2}>
                            {item.notas}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => handleToggleComprado(item)}
                >
                    {item.comprado === 1 ? (
                        <Check color="#10b981" size={28} />
                    ) : (
                        <View style={styles.uncheckedCircle} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisibleId(item.id)}
                >
                    <MoreVertical color="#9ca3af" size={20} />
                </TouchableOpacity>
            </View>

            {item.comprado === 1 && item.precio && (
                <View style={styles.cardFooter}>
                    <Text style={styles.cardPrecio}>
                        Precio: S/ {parseFloat(item.precio).toFixed(2)}
                    </Text>
                    {item.fecha_compra && (
                        <Text style={styles.cardFecha}>
                            {new Date(item.fecha_compra).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            )}

            {/* Modal del menú */}
            <Modal
                visible={menuVisibleId === item.id}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisibleId(null)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setMenuVisibleId(null)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => abrirModalEditar(item)}
                        >
                            <Edit2 color="#3b82f6" size={20} />
                            <Text style={[styles.menuText, { color: "#3b82f6" }]}>
                                Editar
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.menuSeparator} />

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => handleEliminar(item)}
                        >
                            <Trash2 color="#dc2626" size={20} />
                            <Text style={[styles.menuText, { color: "#dc2626" }]}>
                                Eliminar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header con estadísticas */}
            <View style={styles.header}>
                <Text style={styles.title}>Lista de Compras</Text>
                {estadisticas && (
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>
                            Pendientes: {estadisticas.pendientes || 0} items
                        </Text>
                        <Text style={styles.totalLabel}>
                            Comprados: {estadisticas.comprados || 0} items
                        </Text>
                        <Text style={styles.totalMonto}>
                            Total gastado: S/ {(estadisticas.total_gastado || 0).toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Filtro */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, !soloNoComprados && styles.filterButtonActive]}
                    onPress={() => setSoloNoComprados(false)}
                >
                    <Text style={[styles.filterText, !soloNoComprados && styles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, soloNoComprados && styles.filterButtonActive]}
                    onPress={() => setSoloNoComprados(true)}
                >
                    <Text style={[styles.filterText, soloNoComprados && styles.filterTextActive]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Lista */}
            <FlatList
                data={items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8b5cf6"]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <ShoppingCart color="#d1d5db" size={64} />
                        <Text style={styles.emptyTitle}>Lista vacía</Text>
                        <Text style={styles.emptyText}>
                            Presiona + para agregar tu primer item
                        </Text>
                    </View>
                }
            />

            {/* Botón flotante */}
            <TouchableOpacity style={styles.fab} onPress={abrirModalNuevo}>
                <Plus color="white" size={28} />
            </TouchableOpacity>

            {/* Modal agregar/editar */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {modoEdicion ? "Editar Item" : "Nuevo Item"}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre del item *</Text>
                            <TextInput
                                placeholder="Ej: Leche, Pan, etc."
                                style={styles.input}
                                value={itemNombre}
                                onChangeText={setItemNombre}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Categoría *</Text>
                            <Picker
                                selectedValue={categoriaSeleccionada}
                                onValueChange={(value) => setCategoriaSeleccionada(value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Selecciona una categoría" value="" />
                                {categorias.map((cat) => (
                                    <Picker.Item key={cat.id} label={`${cat.icono} ${cat.nombre}`} value={cat.nombre} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Notas (opcional)</Text>
                            <TextInput
                                placeholder="Agregar detalles..."
                                style={[styles.input, styles.textArea]}
                                value={notas}
                                onChangeText={setNotas}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveBtn} onPress={guardarItem}>
                                <Text style={styles.btnText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal registrar compra */}
            <Modal visible={modalCompraVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Registrar Compra</Text>
                        <Text style={styles.modalSubtitle}>
                            {itemSeleccionado?.item}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Precio pagado *</Text>
                            <View style={styles.montoInput}>
                                <Text style={styles.montoSymbol}>S/</Text>
                                <TextInput
                                    placeholder="0.00"
                                    style={styles.input}
                                    keyboardType="decimal-pad"
                                    value={precio}
                                    onChangeText={setPrecio}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalCompraVisible(false)}
                            >
                                <Text style={styles.btnText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveBtn} onPress={registrarCompra}>
                                <Text style={styles.btnText}>Registrar</Text>
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
        backgroundColor: "#8b5cf6",
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
        marginBottom: 16,
    },
    totalCard: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    totalLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 4,
    },
    totalMonto: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 8,
    },
    filterContainer: {
        flexDirection: "row",
        padding: 16,
        gap: 12,
    },
    filterButton: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#e5e7eb",
    },
    filterButtonActive: {
        backgroundColor: "#8b5cf6",
        borderColor: "#8b5cf6",
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6b7280",
    },
    filterTextActive: {
        color: "#fff",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: "#8b5cf6",
    },
    itemCardComprado: {
        backgroundColor: "#f0fdf4",
        borderLeftColor: "#10b981",
        opacity: 0.8,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ede9fe",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardNombre: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 4,
    },
    cardNombreComprado: {
        textDecorationLine: "line-through",
        color: "#6b7280",
    },
    cardCategoria: {
        fontSize: 13,
        color: "#9ca3af",
    },
    cardNotas: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 4,
        fontStyle: "italic",
    },
    checkButton: {
        padding: 8,
        marginRight: 4,
    },
    uncheckedCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#d1d5db",
    },
    menuButton: {
        padding: 4,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    cardPrecio: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#10b981",
    },
    cardFecha: {
        fontSize: 13,
        color: "#6b7280",
    },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        backgroundColor: "#8b5cf6",
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#8b5cf6",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#6b7280",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#9ca3af",
        textAlign: "center",
        paddingHorizontal: 32,
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
        maxHeight: "90%",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: "#1f2937",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        backgroundColor: "#fff",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    picker: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        backgroundColor: "#f9fafb",
    },
    montoInput: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
    },
    montoSymbol: {
        fontSize: 18,
        fontWeight: "600",
        color: "#8b5cf6",
        marginRight: 8,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#f3f4f6",
        padding: 16,
        borderRadius: 12,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#8b5cf6",
        padding: 16,
        borderRadius: 12,
    },
    btnText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
   menuContainer: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 4,
    elevation: 10,
},
menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
},
menuText: {
    fontSize: 15,
    fontWeight: "600",
},
menuSeparator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 2,
},
});
