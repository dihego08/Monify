import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Componente selector de Mes y Año para React Native
 * @param {Object} props
 * @param {number} props.mes - Mes seleccionado (1-12)
 * @param {number} props.anio - Año seleccionado
 * @param {Function} props.onMesChange - Callback cuando cambia el mes
 * @param {Function} props.onAnioChange - Callback cuando cambia el año
 */
export default function SelectMesAnio({ mes, anio, onMesChange, onAnioChange }) {
    const meses = [
        { value: 1, label: "Enero" },
        { value: 2, label: "Febrero" },
        { value: 3, label: "Marzo" },
        { value: 4, label: "Abril" },
        { value: 5, label: "Mayo" },
        { value: 6, label: "Junio" },
        { value: 7, label: "Julio" },
        { value: 8, label: "Agosto" },
        { value: 9, label: "Septiembre" },
        { value: 10, label: "Octubre" },
        { value: 11, label: "Noviembre" },
        { value: 12, label: "Diciembre" },
    ];

    // Generar array de años (últimos 5 años + próximos 2)
    const generarAnios = () => {
        const anioActual = new Date().getFullYear();
        const anios = [];
        for (let i = anioActual - 5; i <= anioActual + 2; i++) {
            anios.push(i);
        }
        return anios;
    };

    return (
        <View style={styles.mesAnioContainer}>
            {/* Selector de Mes */}
            <Picker
                selectedValue={mes}
                style={styles.picker}
                onValueChange={(itemValue) => onMesChange(itemValue)}
            >
                {meses.map((m) => (
                    <Picker.Item 
                        key={m.value} 
                        label={m.label} 
                        value={m.value} 
                    />
                ))}
            </Picker>

            {/* Selector de Año */}
            <Picker
                selectedValue={anio}
                style={styles.picker}
                onValueChange={(itemValue) => onAnioChange(itemValue)}
            >
                {generarAnios().map((year) => (
                    <Picker.Item 
                        key={year} 
                        label={year.toString()} 
                        value={year} 
                    />
                ))}
            </Picker>
        </View>
    );
}

const styles = StyleSheet.create({
    mesAnioContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        gap: 8,
    },
    picker: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        backgroundColor: "#fff",
        height: 50,
    },
});