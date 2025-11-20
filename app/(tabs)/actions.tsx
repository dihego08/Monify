import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ActionsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    // Cada vez que el tab gana foco, mostramos el modal
    useFocusEffect(
        useCallback(() => {
            setModalVisible(true);
        }, [])
    );

    // Función para cerrar el modal y volver al dashboard
    const handleClose = () => {
        setModalVisible(false);
        router.push("/(tabs)");
    };

    return (
        <View style={styles.container}>
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Acciones disponibles</Text>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                setModalVisible(false);
                                router.push("/conceptos/ingresos");
                            }}
                        >
                            <Text style={styles.actionText}>Conceptos de ingresos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                setModalVisible(false);
                                router.push("/conceptos/egresos");
                            }}
                        >
                            <Text style={styles.actionText}>Conceptos de Gastos</Text>
                        </TouchableOpacity>
                        {/*<TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                setModalVisible(false);
                                router.push("/records");
                            }}
                        >
                            <Text style={styles.actionText}>Gastos del Mes</Text>
                        </TouchableOpacity>*/}

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: "#ccc" }]}
                            onPress={handleClose}
                        >
                            <Text style={[styles.actionText, { color: "#333" }]}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "transparent" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        width: "80%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    actionButton: {
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 8,
        marginVertical: 6,
    },
    actionText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
