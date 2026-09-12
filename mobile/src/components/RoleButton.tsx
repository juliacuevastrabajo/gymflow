import { Pressable, StyleSheet, Text } from "react-native";

export default function RoleButton({ title, subtitle, onPress }: any) {
  return (
    <Pressable style={styles.roleButton} onPress={onPress}>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roleButton: {
    backgroundColor: "#111722",
    borderRadius: 8,
    padding: 22,
    borderWidth: 1,
    borderColor: "#263241",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 4,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  roleSubtitle: {
    fontSize: 15,
    color: "#A7B0BD",
    lineHeight: 22,
  },
});
