import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get('window');

export default function ActionsScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0.9));
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            setModalVisible(true);
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7
            }).start();
        }, [])
    );

    const handleClose = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            setModalVisible(false);
            router.push("/(tabs)");
        });
    };

    const handleNavigation = (route: string) => {
        Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true
        }).start(() => {
            setModalVisible(false);
            router.push(route);
        });
    };

    return (
        <View style={styles.container}>
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdropTouchable}
                        activeOpacity={1}
                        onPress={handleClose}
                    />

                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.handleBar} />
                            <Text style={styles.modalTitle}>Gestión de Conceptos</Text>
                            <Text style={styles.modalSubtitle}>
                                Selecciona una opción para continuar
                            </Text>
                        </View>

                        {/* Cards de opciones */}
                        <View style={styles.cardsContainer}>
                            {/* Card Ingresos */}
                            <TouchableOpacity
                                style={[styles.card, styles.cardIngresos]}
                                onPress={() => handleNavigation("/conceptos/ingresos")}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconContainer, styles.iconIngresos]}>
                                    <Text style={styles.icon}>💰</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>Conceptos de Ingresos</Text>
                                    <Text style={styles.cardDescription}>
                                        Administra las categorías de tus ingresos
                                    </Text>
                                </View>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>

                            {/* Card Gastos */}
                            <TouchableOpacity
                                style={[styles.card, styles.cardGastos]}
                                onPress={() => handleNavigation("/conceptos/egresos")}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconContainer, styles.iconGastos]}>
                                    <Text style={styles.icon}>💸</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>Conceptos de Gastos</Text>
                                    <Text style={styles.cardDescription}>
                                        Administra las categorías de tus gastos
                                    </Text>
                                </View>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Botón cerrar */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent"
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    backdropTouchable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: width * 0.9,
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 10,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: "#e5e7eb",
        borderRadius: 2,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 8,
        textAlign: "center",
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
    cardsContainer: {
        gap: 16,
        marginBottom: 20,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    cardIngresos: {
        backgroundColor: "#ecfdf5",
        borderLeftWidth: 4,
        borderLeftColor: "#10b981",
    },
    cardGastos: {
        backgroundColor: "#fef2f2",
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    iconIngresos: {
        backgroundColor: "#d1fae5",
    },
    iconGastos: {
        backgroundColor: "#fee2e2",
    },
    icon: {
        fontSize: 28,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 18,
    },
    arrow: {
        fontSize: 20,
        color: "#9ca3af",
        marginLeft: 8,
    },
    closeButton: {
        backgroundColor: "#f3f4f6",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    closeButtonText: {
        color: "#4b5563",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
    },
});