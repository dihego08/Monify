import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ArrowLeft, Edit2, Plus, Trash2, Wallet } from "lucide-react-native";
import {
    addCuenta,
    Cuenta,
    deleteCuenta,
    getCuentas,
    updateCuenta
} from "../../app/services/movimientosService";

// Paleta de colores predefinidos
const COLORES = [
    "#3b82f6", // Azul
    "#ef4444", // Rojo
    "#10b981", // Verde
    "#f59e0b", // Amarillo/Naranja
    "#8b5cf6", // Morado
    "#ec4899", // Rosa
    "#14b8a6", // Teal
    "#64748b", // Gris
];

export default function CuentasScreen() {
    const router = useRouter();
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Formulario
    const [idCuenta, setIdCuenta] = useState<number | null>(null);
    const [nombre, setNombre] = useState("");
    const [saldoInicial, setSaldoInicial] = useState("");
    const [color, setColor] = useState(COLORES[0]);
    const [esDefaultPagos, setEsDefaultPagos] = useState(false);
    const [esDefaultHormiga, setEsDefaultHormiga] = useState(false);

    useFocusEffect(
        useCallback(() => {
            cargarCuentas();
        }, [])
    );

    const cargarCuentas = async () => {
        try {
            const lista = await getCuentas();
            setCuentas(lista);
        } catch (error) {
            console.error("Error al cargar cuentas:", error);
        }
    };

    const limpiarFormulario = () => {
        setIdCuenta(null);
        setNombre("");
        setSaldoInicial("");
        setColor(COLORES[0]);
        setEsDefaultPagos(false);
        setEsDefaultHormiga(false);
    };

    const abrirModalNuevo = () => {
        limpiarFormulario();
        setModalVisible(true);
    };

    const abrirModalEditar = (cuenta: Cuenta) => {
        setIdCuenta(cuenta.id);
        setNombre(cuenta.nombre);
        setSaldoInicial(String(cuenta.saldo_inicial));
        setColor(cuenta.color || COLORES[0]);
        setEsDefaultPagos(cuenta.es_default_pagos === 1);
        setEsDefaultHormiga(cuenta.es_default_hormiga === 1);
        setModalVisible(true);
    };

    const guardar = async () => {
        if (!nombre.trim()) {
            Alert.alert("Error", "El nombre de la cuenta es obligatorio");
            return;
        }

        const saldoNum = saldoInicial ? parseFloat(saldoInicial) : 0;

        try {
            if (idCuenta) {
                await updateCuenta(idCuenta, nombre, saldoNum, color, esDefaultPagos ? 1 : 0, esDefaultHormiga ? 1 : 0);
                Alert.alert("Éxito", "Cuenta actualizada");
            } else {
                await addCuenta(nombre, saldoNum, color, esDefaultPagos ? 1 : 0, esDefaultHormiga ? 1 : 0);
                Alert.alert("Éxito", "Cuenta creada");
            }
            setModalVisible(false);
            cargarCuentas();
        } catch (error) {
            console.error("Error al guardar cuenta:", error);
            Alert.alert("Error", "No se pudo guardar la cuenta");
        }
    };

    const eliminar = (cuenta: Cuenta) => {
        if (cuenta.id === 1) {
            Alert.alert("Error", "No puedes eliminar la Billetera Principal");
            return;
        }

        Alert.alert(
            "Confirmar",
            `¿Eliminar la cuenta "${cuenta.nombre}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteCuenta(cuenta.id);
                            cargarCuentas();
                        } catch (error) {
                            console.error("Error al eliminar cuenta:", error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#1f2937" size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Mis Cuentas</Text>
                    <Text style={styles.subtitle}>Administra tus billeteras</Text>
                </View>
            </View>

            <FlatList
                data={cuentas}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={[styles.colorIndicator, { backgroundColor: item.color || '#3b82f6' }]} />
                        
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.nombre}</Text>
                            <Text style={styles.cardSub}>
                                Saldo inicial: S/. {item.saldo_inicial.toFixed(2)}
                            </Text>
                            <View style={styles.badges}>
                                {item.es_default_pagos === 1 && (
                                    <View style={styles.badgePagos}>
                                        <Text style={styles.badgeText}>Def. Pagos</Text>
                                    </View>
                                )}
                                {item.es_default_hormiga === 1 && (
                                    <View style={styles.badgeHormiga}>
                                        <Text style={styles.badgeText}>Def. Hormiga</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => abrirModalEditar(item)} style={styles.actionBtn}>
                                <Edit2 color="#3b82f6" size={20} />
                            </TouchableOpacity>
                            {item.id !== 1 && (
                                <TouchableOpacity onPress={() => eliminar(item)} style={styles.actionBtn}>
                                    <Trash2 color="#ef4444" size={20} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={abrirModalNuevo} activeOpacity={0.8}>
                <Plus color="white" size={28} />
            </TouchableOpacity>

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
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <Wallet color="#8b5cf6" size={28} />
                                    <Text style={styles.modalTitle}>
                                        {idCuenta ? "Editar Cuenta" : "Nueva Cuenta"}
                                    </Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Nombre de la cuenta *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej. BCP, Interbank, Efectivo..."
                                        value={nombre}
                                        onChangeText={setNombre}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Saldo Inicial (S/.)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="decimal-pad"
                                        value={saldoInicial}
                                        onChangeText={setSaldoInicial}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Color Identificador</Text>
                                    <View style={styles.colorPalette}>
                                        {COLORES.map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                style={[
                                                    styles.colorCircle,
                                                    { backgroundColor: c },
                                                    color === c && styles.colorSelected
                                                ]}
                                                onPress={() => setColor(c)}
                                            />
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.switchGroup}>
                                    <View style={styles.switchInfo}>
                                        <Text style={styles.switchTitle}>Cuenta por defecto para Pagos</Text>
                                        <Text style={styles.switchDesc}>Se seleccionará automáticamente al registrar un pago.</Text>
                                    </View>
                                    <Switch
                                        value={esDefaultPagos}
                                        onValueChange={setEsDefaultPagos}
                                        trackColor={{ false: "#d1d5db", true: "#8b5cf6" }}
                                    />
                                </View>

                                <View style={styles.switchGroup}>
                                    <View style={styles.switchInfo}>
                                        <Text style={styles.switchTitle}>Cuenta por defecto para Hormiga</Text>
                                        <Text style={styles.switchDesc}>Se seleccionará automáticamente para los gastos hormiga.</Text>
                                    </View>
                                    <Switch
                                        value={esDefaultHormiga}
                                        onValueChange={setEsDefaultHormiga}
                                        trackColor={{ false: "#d1d5db", true: "#8b5cf6" }}
                                    />
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.btnText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.saveBtn} onPress={guardar}>
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
    container: { flex: 1, backgroundColor: "#f9fafb" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    backButton: { marginRight: 16, padding: 4 },
    title: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
    subtitle: { fontSize: 14, color: "#6b7280" },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    colorIndicator: { width: 16, height: 40, borderRadius: 8, marginRight: 12 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
    cardSub: { fontSize: 14, color: "#6b7280" },
    badges: { flexDirection: "row", marginTop: 8, gap: 8 },
    badgePagos: { backgroundColor: "#e0e7ff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeHormiga: { backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: "600", color: "#374151" },
    actions: { flexDirection: "row", gap: 12 },
    actionBtn: { padding: 8, backgroundColor: "#f3f4f6", borderRadius: 8 },
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
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    modalContainer: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
    modalTitle: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: "#f9fafb",
    },
    colorPalette: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    colorCircle: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: "#1f2937" },
    switchGroup: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
    switchInfo: { flex: 1, paddingRight: 16 },
    switchTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 4 },
    switchDesc: { fontSize: 12, color: "#6b7280" },
    modalButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
    cancelBtn: { flex: 1, backgroundColor: "#6b7280", padding: 16, borderRadius: 12 },
    saveBtn: { flex: 1, backgroundColor: "#8b5cf6", padding: 16, borderRadius: 12 },
    btnText: { textAlign: "center", color: "#fff", fontWeight: "bold", fontSize: 16 },
});
