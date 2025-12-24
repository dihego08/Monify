import { Picker } from "@react-native-picker/picker";
import { router, useFocusEffect } from "expo-router";
import {
    Check,
    Edit2,
    List,
    MoreVertical,
    Plus,
    Settings,
    ShoppingCart,
    Trash2
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList, // ← Agregar
    KeyboardAvoidingView,
    Modal, // ← Agregar
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { initDB } from "../database/database";
import {
    agregarItemCompra,
    agregarListaCompra,
    editarItemCompra,
    editarListaCompra,
    eliminarItemCompra,
    eliminarListaCompra,
    getCategoriasCompras,
    getEstadisticasCompras,
    getItemsCompras,
    getListaCompras,
    marcarComoComprado,
    toggleComprado
} from "../services/comprasService";

export default function ShoppingScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalCompraVisible, setModalCompraVisible] = useState(false);
    const [modalVisibleLista, setModalVisibleLista] = useState(false);
    const [modalCompraListaVisible, setModalCompraListaVisible] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [listas, setListas] = useState<any[]>([]);
    const [itemsLista, setItemsLista] = useState<any[]>([]);
    const [estadisticas, setEstadisticas] = useState<any>({});

    // Estados para el formulario
    const [itemNombre, setItemNombre] = useState("");

    const [notas, setNotas] = useState("");
    const [precio, setPrecio] = useState("");
    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
    const [modoEdicion, setModoEdicion] = useState(false);

    //formulario nueva lista
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
    const [nombreLista, setNombreLista] = useState("");
    const [listaSeleccionada, setListaSeleccionada] = useState<any>(null);

    const [refreshing, setRefreshing] = useState(false);
    const [menuVisibleId, setMenuVisibleId] = useState<number | null>(null);
    const [soloNoComprados, setSoloNoComprados] = useState(false);

    useFocusEffect(
        useCallback(() => {
            initDB();
            cargarDatos();
        }, [soloNoComprados])
    );

    const cargarDatos = async () => {
        try {
            const listaCategorias = await getCategoriasCompras();
            setCategorias(listaCategorias);

            const listaCompras = await getListaCompras();
            setListas(listaCompras);

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

    const abrirModalNuevaLista = () => {
        setCategoriaSeleccionada("");
        setNombreLista("");
        setModoEdicion(false);
        setListaSeleccionada(null);
        setModalVisibleLista(true);
    };

    const abrirModalEditar = (item: any) => {
        setModoEdicion(true);
        setItemSeleccionado(item);
        setItemNombre(item.item);
        setNotas(item.notas || "");
        setMenuVisibleId(null);
    };
    const abrirModalEditarLista = (item: any) => {
        setModoEdicion(true);
        setListaSeleccionada(item);
        setNombreLista(item.nombre);
        setCategoriaSeleccionada(item.categoria);
        setMenuVisibleId(null);
        setModalVisibleLista(true);
    };
    const limpiarFormularioItem = () => {
        setItemNombre("");
        setNotas("");
        setPrecio("");
        setItemSeleccionado(null);
        setModoEdicion(false);
        setMenuVisibleId(null);
    }
    const guardarItem = async () => {
        if (!itemNombre.trim()) {
            Alert.alert("Error", "Completa el nombre del item.");
            return;
        }

        try {
            if (modoEdicion && itemSeleccionado) {
                await editarItemCompra(itemSeleccionado.id, itemNombre, notas, listaSeleccionada.id);
                Alert.alert("Éxito", "Item actualizado correctamente");

                const listaItems = await getItemsCompras(listaSeleccionada.id);
                setItemsLista(listaItems);
            } else {
                await agregarItemCompra(itemNombre, listaSeleccionada.id, notas);
                Alert.alert("Éxito", "Item agregado a la lista");
                const listaItems = await getItemsCompras(listaSeleccionada.id);
                setItemsLista(listaItems);
            }
            limpiarFormularioItem();
            await cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            Alert.alert("Error", "No se pudo guardar el item");
        }
    };

    const guardarLista = async () => {
        if (!nombreLista.trim() || !categoriaSeleccionada) {
            Alert.alert("Error", "Completa el nombre del item y categoría");
            return;
        }

        try {
            if (modoEdicion && listaSeleccionada) {
                await editarListaCompra(listaSeleccionada.id, nombreLista, categoriaSeleccionada);
                Alert.alert("Éxito", "Lista actualizada correctamente");
                setModoEdicion(false);
                setListaSeleccionada(null);
                setCategoriaSeleccionada('');
            } else {
                await agregarListaCompra(nombreLista, categoriaSeleccionada);
                Alert.alert("Éxito", "Lista agregada");
            }
            setNombreLista("");
            setModalVisibleLista(false);
            await cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            Alert.alert("Error", "No se pudo guardar la lista");
        }
    };

    const handleToggleComprado = async (item: any) => {
        if (!item.comprado) {
            setItemSeleccionado(item);
            setPrecio("");
            setModalCompraVisible(true);
        } else {
            await toggleComprado(item.id);
            await cargarDatos();
        }
    };

    const handleToggleLista = async (item: any) => {
        limpiarFormularioItem();
        setItemSeleccionado(item);
        const listaItems = await getItemsCompras(item.id);
        setItemsLista(listaItems);
        if (!item.comprado) {
            setListaSeleccionada(item);
            setModalCompraListaVisible(true);
        } else {
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
            const listaItems = await getItemsCompras(listaSeleccionada.id);
            setItemsLista(listaItems);
        } catch (error) {
            console.error('Error:', error);
            Alert.alert("Error", "No se pudo registrar la compra");
        }
    };

    const handleEliminarItem = (item: any) => {
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
                            const listaItems = await getItemsCompras(item.id);
                            setItemsLista(listaItems);
                        } catch (error) {
                            Alert.alert("Error", "No se pudo eliminar el item");
                        }
                    }
                }
            ]
        );
    };
    const handleEliminarCompra = (item: any) => {
        setMenuVisibleId(null);
        Alert.alert(
            "Confirmar eliminación",
            `¿Eliminar "${item.nombre}" de la lista?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarListaCompra(item.id);
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
    const renderItemElemento = ({ item }: { item: any }) => (
        <View style={[styles.itemCard, item.comprado === 1 && styles.itemCardComprado]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <ShoppingCart color={item.comprado ? "#10b981" : "#459c4f"} size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[
                        styles.cardNombre,
                        item.comprado === 1 && styles.cardNombreComprado
                    ]}>
                        {item.item}
                    </Text>
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
                            onPress={() => handleEliminarItem(item)}
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

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.itemCard, item.comprado === 1 && styles.itemCardComprado]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <ShoppingCart color={item.comprado ? "#10b981" : "#459c4f"} size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[
                        styles.cardNombre
                    ]}>
                        {item.nombre}
                    </Text>
                    <Text style={styles.cardCategoria}>{item.categoria}</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={() => handleToggleLista(item)}
                >
                    <List color="#dc2626" size={24} />
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
                            onPress={() => abrirModalEditarLista(item)}
                        >
                            <Edit2 color="#3b82f6" size={20} />
                            <Text style={[styles.menuText, { color: "#3b82f6" }]}>
                                Editar
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.menuSeparator} />

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => handleEliminarCompra(item)}
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
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Lista de Compras</Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/conceptos/categorias-compras')}
                    >
                        <Settings color="#fff" size={24} />
                    </TouchableOpacity>
                </View>
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
                data={listas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#459c4f"]} />
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
            <TouchableOpacity style={styles.fab} onPress={abrirModalNuevaLista}>
                <Plus color="white" size={28} />
            </TouchableOpacity>

            {/* Modal Nueva Lista */}
            <Modal visible={modalVisibleLista} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalOverlay}
                        onPress={() => setModalVisibleLista(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.modalContainer}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style={styles.modalTitle}>
                                    {modoEdicion ? "Editar Lista de Compras" : "Nueva Lista de Compras"}
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Nombre de la Lista *</Text>
                                    <TextInput
                                        placeholder="Ej: Lista de alimentos."
                                        style={styles.input}
                                        value={nombreLista}
                                        onChangeText={setNombreLista}
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

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setModalVisibleLista(false)}
                                    >
                                        <Text style={styles.btnText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.saveBtn} onPress={guardarLista}>
                                        <Text style={styles.btnText}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal Nuevo Elemento */}
            <Modal visible={modalCompraListaVisible} transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            Elementos de la Lista
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Ítem de la Lista *</Text>
                            <TextInput
                                placeholder="Ej: Arroz, Azúcar."
                                style={styles.input}
                                value={itemNombre}
                                onChangeText={setItemNombre}
                            />
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

                        {/* Lista */}
                        <FlatList
                            data={itemsLista}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderItemElemento}
                            contentContainerStyle={styles.listContainer}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#459c4f"]} />
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

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalCompraListaVisible(false)}
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
        backgroundColor: "#459c4f",
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    settingsButton: {
        padding: 8,
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
        backgroundColor: "#459c4f",
        borderColor: "#459c4f",
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
        borderLeftColor: "#459c4f",
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
        backgroundColor: "#459c4f",
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#459c4f",
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
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        backgroundColor: "#fff",
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
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
        color: "#459c4f",
        marginRight: 8,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#dc3545",
        padding: 16,
        borderRadius: 12,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#459c4f",
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
