import { StyleSheet, Text, View } from "react-native";

export default function ClassCard({
  clase,
  reservas = [],
  colorSecundario = "#0B6DAE",
}: any) {
  const reservasDeClase = reservas.filter(
    (reserva: any) =>
      reserva.claseId === clase.id && reserva.estado === "RESERVADA",
  );

  return (
    <View
      style={[
        styles.classCard,
        {
          backgroundColor: "#111722",
          borderColor: `${colorSecundario}44`,
          borderTopColor: colorSecundario,
        },
      ]}
    >
      <Text style={styles.className}>{clase.nombre}</Text>
      <Text style={styles.classDescription}>{clase.descripcion}</Text>

      <View style={styles.classFooter}>
        <Text style={styles.classMeta}>
          Entrenador: {clase.nombreEntrenador}
        </Text>
        <Text style={styles.classMeta}>
          Duración: {clase.duracionMinutos} min
        </Text>
        <Text style={styles.classMeta}>
          Reservas: {reservasDeClase.length} / {clase.capacidadMaxima}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  classCard: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderTopWidth: 4,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  className: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  classDescription: {
    marginTop: 8,
    fontSize: 15,
    color: "#A7B0BD",
    lineHeight: 22,
  },
  classFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#263241",
    paddingTop: 12,
  },
  classMeta: {
    fontSize: 14,
    color: "#A7B0BD",
    marginBottom: 4,
  },
});
