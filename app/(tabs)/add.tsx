import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import {
    Calendar,
    Edit2,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    TrendingUp
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal, // ← Agregar
    Platform,
    RefreshControl, // ← Agregar
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import SelectMesAnio from "../componentes/SelectMesAnio";
import {
    actualizarIngresoMensual,
    eliminarConceptoPorMes,
    getConceptosIngresoActivos,
    getIngresosPorMes,
    guardarIngresoMensual
} from "../services/ingresosService";

export default function IngresosScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [conceptos, setConceptos] = useState<any[]>([]);
    const [ingresos, setIngresos] = useState<any[]>([]);
    const [concepto_id, setConcepto_id] = useState<number | null>(null);
    const [monto, setMonto] = useState<string>("");
    const [otros, setOtros] = useState<string>("");
    const [fecha, setFecha] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
    const [refreshing, setRefreshing] = useState(false);

    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    // ⭐ FIX: Estado para el menú individual
    const [menuVisibleId, setMenuVisibleId] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [mesFiltro, anioFiltro])
    );

    const formatearFechaISO = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatearFechaLegible = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const calcularTotalIngresos = (): number => {
        return ingresos.reduce((sum, ingreso) => sum + parseFloat(ingreso.monto), 0);
    };

    async function cargarDatos() {
        try {
            const listaConceptos = await getConceptosIngresoActivos();
            setConceptos(listaConceptos);

            const mesAnioFiltro = `${String(mesFiltro).padStart(2, '0')}-${anioFiltro}`;
            const listaIngresos = await getIngresosPorMes(mesAnioFiltro);
            setIngresos(listaIngresos);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos');
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };

    async function filtrarDatos() {
        try {
            const mesAnioFiltro = `${String(mesFiltro).padStart(2, '0')}-${anioFiltro}`;
            const listaIngresos = await getIngresosPorMes(mesAnioFiltro);
            setIngresos(listaIngresos);
        } catch (error) {
            console.error('Error al filtrar:', error);
            Alert.alert('Error', 'No se pudieron filtrar los datos');
        }
    }

    const handleEliminar = (item: any) => {
        setMenuVisibleId(null);
        Alert.alert(
            "Confirmar eliminación",
            `¿Deseas eliminar el ingreso de "${item.concepto_ingreso}" por S/ ${parseFloat(item.monto).toFixed(2)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarConceptoPorMes(item.id);
                            Alert.alert("Éxito", "Ingreso eliminado correctamente");
                            await cargarDatos();
                        } catch (error) {
                            console.error('Error al eliminar:', error);
                            Alert.alert("Error", "No se pudo eliminar el ingreso");
                        }
                    }
                }
            ]
        );
    };

    const abrirModalEditar = (item: any) => {
        setModoEdicion(true);
        setItemSeleccionado(item);

        setMonto(String(item.monto));
        setConcepto_id(Number(item.id_concepto));
        setFecha(new Date(item.fecha));

        setModalVisible(true); // 👈 AL FINAL
    };
    const guardarIngreso = async () => {
        if (!concepto_id || !monto) {
            Alert.alert("Error", "Completa todos los campos requeridos");
            return;
        }

        if (parseFloat(monto) <= 0) {
            Alert.alert("Error", "El monto debe ser mayor a 0");
            return;
        }

        try {
            const fechaISO = formatearFechaISO(fecha);

            if (modoEdicion) {
                await actualizarIngresoMensual(concepto_id, parseFloat(monto), otros, fechaISO, itemSeleccionado.id);
                Alert.alert("Éxito", "Ingreso actualizado correctamente");
                setModoEdicion(false);
                setItemSeleccionado(null);
            } else {
                await guardarIngresoMensual(concepto_id, parseFloat(monto), otros, fechaISO);
                Alert.alert("Éxito", "Ingreso registrado correctamente");
            }

            setModalVisible(false);


            await cargarDatos();
        } catch (error) {
            console.error('Error al guardar:', error);
            Alert.alert("Error", "No se pudo guardar el ingreso");
        }
    };

    const limpiarFormulario = () => {
        setMonto("");
        setConcepto_id(null);
        setOtros("");
        setFecha(new Date());
    }
    const handleCancelar = () => {
        limpiarFormulario();
        setModalVisible(false);
        setModoEdicion(false);
        setItemSeleccionado(null);
    }
    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.ingresoCard}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <TrendingUp color="#10b981" size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardConcepto}>
                        {item.concepto_ingreso || 'Sin concepto'}
                    </Text>
                    <View style={styles.cardMeta}>
                        <Calendar color="#9ca3af" size={14} />
                        <Text style={styles.cardFecha}>
                            {item.fecha_formato || item.fecha}
                        </Text>
                    </View>
                    {item.otros && (
                        <Text style={styles.cardDescripcion} numberOfLines={2}>
                            {item.otros}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisibleId(item.id)}
                >
                    <MoreVertical color="#9ca3af" size={20} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.montoContainer}>
                    <Text style={styles.cardMonto}>
                        S/ {parseFloat(item.monto).toFixed(2)}
                    </Text>
                </View>
            </View>

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
                            onPress={() => {
                                setMenuVisibleId(null);
                                //Alert.alert("Editar", "Funcionalidad de edición próximamente");                                
                                abrirModalEditar(item);
                            }}
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
            {/* Header con total */}
            <View style={styles.header}>
                <Text style={styles.title}>Ingresos Mensuales</Text>
                {ingresos.length > 0 && (
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total del período</Text>
                        <Text style={styles.totalMonto}>
                            S/ {calcularTotalIngresos().toFixed(2)}
                        </Text>
                        <Text style={styles.totalCount}>
                            {ingresos.length} ingreso{ingresos.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </View>

            {/* Filtros */}
            <View style={styles.filtersContainer}>
                <SelectMesAnio
                    mes={mesFiltro}
                    anio={anioFiltro}
                    onMesChange={setMesFiltro}
                    onAnioChange={setAnioFiltro}
                />

                <TouchableOpacity style={styles.searchButton} onPress={filtrarDatos}>
                    <Search color="white" size={18} />
                    <Text style={styles.searchText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de ingresos */}
            <FlatList
                data={ingresos}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#10b981"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <TrendingUp color="#d1d5db" size={64} />
                        <Text style={styles.emptyTitle}>Sin ingresos registrados</Text>
                        <Text style={styles.emptyText}>
                            Presiona el botón + para agregar tu primer ingreso
                        </Text>
                    </View>
                }
            />

            {/* Botón flotante */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
            >
                <Plus color="white" size={28} />
            </TouchableOpacity>

            {/* Modal de registro */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalOverlay}
                        onPress={() => setModalVisible(false)}
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
                                <View style={styles.modalHeader}>
                                    <TrendingUp color="#10b981" size={28} />
                                    <Text style={styles.modalTitle}>{modoEdicion ? "Editar Ingreso" : "Nuevo Ingreso"}</Text>
                                </View>

                                <Picker
                                    selectedValue={concepto_id}
                                    onValueChange={(value) => setConcepto_id(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Selecciona un concepto" value={null} />
                                    {conceptos.map((c) => (
                                        <Picker.Item key={c.id} label={c.concepto} value={c.id} />
                                    ))}
                                </Picker>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Monto *</Text>
                                    <View style={styles.montoInput}>
                                        <Text style={styles.montoSymbol}>S/</Text>
                                        <TextInput
                                            placeholder="0.00"
                                            style={styles.input}
                                            keyboardType="decimal-pad"
                                            value={monto}
                                            onChangeText={setMonto}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                                    <TextInput
                                        placeholder="Agregar notas..."
                                        style={[styles.textArea]}
                                        value={otros}
                                        onChangeText={setOtros}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Fecha</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        style={styles.dateButton}
                                    >
                                        <Calendar color="#6b7280" size={20} />
                                        <Text style={styles.dateLabel}>
                                            {formatearFechaLegible(fecha)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={fecha}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) setFecha(selectedDate);
                                        }}
                                    />
                                )}

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => handleCancelar()}
                                    >
                                        <Text style={styles.btnText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.saveBtn}
                                        onPress={guardarIngreso}
                                    >
                                        <Text style={styles.btnText}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>

                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
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
        backgroundColor: "#10b981",
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
        marginBottom: 8,
    },
    totalMonto: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    totalCount: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    filtersContainer: {
        padding: 16,
        gap: 12,
    },
    searchButton: {
        backgroundColor: "#10b981",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    searchText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    ingresoCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: "#10b981",
    },
    cardHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#d1fae5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardConcepto: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 4,
    },
    cardMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cardFecha: {
        fontSize: 13,
        color: "#6b7280",
    },
    cardDescripcion: {
        fontSize: 13,
        color: "#9ca3af",
        marginTop: 4,
        fontStyle: "italic",
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    montoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    cardMonto: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#10b981",
    },
    menuButton: {
        padding: 4,
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
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        backgroundColor: "#10b981",
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#10b981",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
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
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
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
    picker: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginBottom: 16,
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
        color: "#10b981",
        marginRight: 8,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: "#1f2937",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 80,
        textAlignVertical: "top",
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
    },
    dateLabel: {
        fontSize: 16,
        color: "#1f2937",
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#6b7280",
        padding: 12,
        borderRadius: 10,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#10b981",
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
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 8,
        minWidth: 200,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    menuOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: "500",
    },
    menuSeparator: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginVertical: 4,
    },
});