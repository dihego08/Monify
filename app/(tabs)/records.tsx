import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import { Calendar, Edit2, MoreVertical, Plus, Search, Trash2, TrendingDown } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import SelectMesAnio from "../componentes/SelectMesAnio";
import { actualizarEstadoGasto, actualizarGastoMensual, eliminarGastoPorMes, getConceptosGastoActivos, getGastosPorMes, guardarGastoMensual } from "../services/gastosService";

export default function RecordsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [conceptos, setConceptos] = useState<any[]>([]);
    const [gastos, setGastos] = useState<any[]>([]);
    const [conceptoSeleccionado, setConceptoSeleccionado] = useState<number | null>(null);
    const [monto, setMonto] = useState<string>("");
    const [descripcion, setDescripcion] = useState<string>("");
    const [fechaLimite, setFechaLimite] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [mesFiltro, setMesFiltro] = useState(new Date().getMonth() + 1);
    const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());
    const [refreshing, setRefreshing] = useState(false);

    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
    const [modoEdicion, setModoEdicion] = useState(false);

    // ⭐ CAMBIO CLAVE: Guardar el ID del item cuyo menú está abierto
    const [menuVisibleId, setMenuVisibleId] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            cargarDatos();
        }, [])
    );

    const togglePago = (item: any) => {
        const actualizados = gastos.map((g) =>
            g.id === item.id ? { ...g, pagado: !g.pagado } : g
        );
        actualizarEstadoGasto(item.id, !item.pagado);
        setGastos(actualizados);
    };

    async function filtrarDatos() {
        console.log('Filtrando datos para:', `${String(mesFiltro).padStart(2, '0')}-${anioFiltro}`);
        const listaGastos = await getGastosPorMes(`${String(mesFiltro).padStart(2, '0')}-${anioFiltro}`);
        setGastos(listaGastos);
    }

    async function cargarDatos() {
        const listaConceptos = await getConceptosGastoActivos();
        setConceptos(listaConceptos);

        const mesFormateado = String(mesFiltro).padStart(2, '0');
        console.log(`Filtrando: ${mesFormateado}-${anioFiltro}`);
        const listaGastos = await getGastosPorMes(`${mesFormateado}-${anioFiltro}`);
        console.log('Gastos obtenidos:', listaGastos);
        setGastos(listaGastos);
    }

    const guardarGasto = async () => {
        if (!conceptoSeleccionado || !monto) {
            Alert.alert("Error", "Selecciona un concepto y monto válido");
            return;
        }
        const fechaISO = formatearFechaISO(fechaLimite);
        const mesFormateado = `${String(mes).padStart(2, '0')}-${anio}`;

        if (modoEdicion) {
            await actualizarGastoMensual(conceptoSeleccionado, mesFormateado, parseFloat(monto), fechaISO, descripcion, itemSeleccionado.id);
            Alert.alert("Éxito", "Gasto actualizado correctamente");
            setModoEdicion(false);
            setItemSeleccionado(null);
        } else {
            await guardarGastoMensual(conceptoSeleccionado, mesFormateado, parseFloat(monto), fechaISO, descripcion);
            Alert.alert("Éxito", "Gasto registrado correctamente");
        }

        setModalVisible(false);
        limpiarFormulario();
        cargarDatos();
    };

    const formatearFechaLegible = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatearFechaISO = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const calcularTotalGastos = (): number => {
        return gastos.reduce((sum, gasto) => sum + parseFloat(gasto.monto), 0);
    };
    // ⭐ FUNCIÓN CORREGIDA: Recibe el item específico
    const handleEliminar = (item: any) => {
        setMenuVisibleId(null); // Cerrar menú
        Alert.alert(
            "Confirmar eliminación",
            `¿Estás seguro de eliminar el gasto "${item.concepto}" de S/ ${item.monto.toFixed(2)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await eliminarGastoPorMes(item.id);
                            Alert.alert("Éxito", "Gasto eliminado correctamente");
                            await cargarDatos();
                        } catch (error) {
                            console.error('Error al eliminar:', error);
                            Alert.alert("Error", "No se pudo eliminar el gasto");
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
        setConceptoSeleccionado(Number(item.concepto_id));
        setFechaLimite(new Date(item.fecha_limite));
        setDescripcion(item.descripcion);

        const [mesItem, anioItem] = item.mes.split("-");
        setMes(Number(mesItem));
        setAnio(Number(anioItem));

        setModalVisible(true); // 👈 AL FINAL
    };
    const limpiarFormulario = () => {
        setMonto("");
        setConceptoSeleccionado(null);
        setFechaLimite(new Date());
        setDescripcion("");
    }
    const handleCancelar = () => {
        limpiarFormulario();
        setModalVisible(false);
        setModoEdicion(false);
        setItemSeleccionado(null);
    }
    const onRefresh = async () => {
        setRefreshing(true);
        await cargarDatos();
        setRefreshing(false);
    };
    const renderItem = ({ item }: { item: any }) => (
        <View style={[item.pagado == 1 ? styles.ingresoCardPagado : styles.ingresoCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <TrendingDown color="#dc3545" size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardConcepto}>
                        {item.concepto || 'Sin concepto'}
                    </Text>
                    <View style={styles.cardMeta}>
                        <Calendar color="#9ca3af" size={14} />
                        <Text style={styles.cardFecha}>
                            Vence: {item.fecha_formato || item.fecha_limite}
                        </Text>
                    </View>
                    {item.descripcion && (
                        <Text style={styles.cardDescripcion} numberOfLines={2}>
                            {item.descripcion}
                        </Text>
                    )}
                </View>
                <Switch
                    value={item.pagado === 1}
                    onValueChange={() => togglePago(item)}
                    thumbColor={item.pagado ? "#16a34a" : "#f4f3f4"}
                    trackColor={{ false: "#ddd", true: "#86efac" }}
                />
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
                <Text
                    style={[
                        styles.estado,
                        { color: item.pagado ? "#16a34a" : "#dc2626" },
                    ]}
                >
                    {item.pagado ? "✓ Pagado" : "✗ Pendiente"}
                </Text>
            </View>

            {/* ⭐ Modal solo visible si menuVisibleId === item.id */}
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
                                //setModalVisible(true);
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
                <Text style={styles.title}>Gastos Mensuales</Text>
                {gastos.length > 0 && (
                    <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>Total del período</Text>
                        <Text style={styles.totalMonto}>
                            S/ {calcularTotalGastos().toFixed(2)}
                        </Text>
                        <Text style={styles.totalCount}>
                            {gastos.length} gasto{gastos.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </View>

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

            <FlatList
                data={gastos}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#dc3545"]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <TrendingDown color="#d1d5db" size={64} />
                        <Text style={styles.emptyTitle}>Sin ingresos registrados</Text>
                        <Text style={styles.emptyText}>
                            Presiona el botón + para agregar tu primer ingreso
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
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
                                    <TrendingDown color="#dc3545" size={28} />
                                    <Text style={styles.modalTitle}>{modoEdicion ? "Editar Gasto" : "Registrar Gasto"}</Text>
                                </View>
                                <Picker
                                    selectedValue={conceptoSeleccionado}
                                    onValueChange={(value) => setConceptoSeleccionado(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Selecciona un concepto" value={null} />
                                    {conceptos.map((c) => (
                                        <Picker.Item key={c.id} label={c.concepto} value={Number(c.id)} />
                                    ))}
                                </Picker>

                                <SelectMesAnio
                                    mes={mes}
                                    anio={anio}
                                    onMesChange={setMes}
                                    onAnioChange={setAnio}
                                />

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
                                        value={descripcion}
                                        onChangeText={setDescripcion}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={styles.dateButton}
                                >
                                    <Text style={styles.dateLabel}>
                                        📅 Fecha límite: {formatearFechaLegible(fechaLimite)}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={fechaLimite}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) setFechaLimite(selectedDate);
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

                                    <TouchableOpacity style={styles.saveBtn} onPress={guardarGasto}>
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
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 16,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#bb2d3b",
        borderRadius: 30,
        padding: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 5,
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
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: "#1f2937",
    },
    dateButton: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "#f9f9f9",
    },
    dateLabel: {
        fontSize: 16,
        color: "#333",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#6b7280",
        padding: 12,
        borderRadius: 10,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#bb2d3b",
        padding: 12,
        borderRadius: 10,
    },
    btnText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    pagado: {
        opacity: 0.7,
        backgroundColor: "#f0fdf4",
    },
    info: {
        flex: 1,
    },
    nombre: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    monto: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#bb2d3b",
        marginTop: 4,
    },
    fecha: {
        fontSize: 13,
        color: "#777",
        marginTop: 4,
    },
    estado: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: "600",
    },
    empty: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#999",
    },
    saveText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: "#bb2d3b",
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    menuButton: {
        padding: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    menuContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    menuOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: "500",
    },

    header: {
        backgroundColor: "#dc3545",
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
        backgroundColor: "#dc3545",
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
        borderLeftColor: "#dc3545",
    },
    ingresoCardPagado: {
        //backgroundColor: "#fff",
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

        backgroundColor: "#f0fdf4",
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
    }, cardHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ffbbba",
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
        color: "#dc3545",
    },
    menuSeparator: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginVertical: 4,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    }, inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
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
        color: "#dc3545",
        marginRight: 8,
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        //padding: 14,
        height: 100,
        textAlignVertical: "top",
    },
    picker: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "#f9fafb",
    },
});