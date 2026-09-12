import { StyleSheet, Text, View } from "react-native";

export default function StatCard({
  label,
  value,
  colorSecundario = "#0B6DAE",
}: any) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: "#111722",
          borderColor: `${colorSecundario}44`,
        },
      ]}
    >
      <View style={[styles.statAccent, { backgroundColor: colorSecundario }]} />
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: "47%",
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  statAccent: {
    width: 34,
    height: 4,
    borderRadius: 999,
    marginBottom: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A7B0BD",
    marginTop: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: "#F8FAFC",
  },
});
