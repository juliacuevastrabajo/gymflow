import type { ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { RutinaAsignadaApp } from "../../features/routines/types";
import { mezclarColores } from "../../theme/colorUtils";
import {
  Avatar,
  Card,
  EmptyState,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type RoutineStudent = {
  id: number;
  name: string;
  email?: string | null;
  photoUri?: string | null;
  initials: string;
};

type AssignedRoutineStudent = RoutineStudent & {
  assignment: RutinaAsignadaApp;
};

export default function TrainerRoutineAssignments({
  theme,
  primaryColor,
  secondaryColor,
  routineName,
  feedback,
  assignedStudents,
  availableStudents,
  activeClientCount,
  selectedStudentIds,
  search,
  saving,
  onBack,
  onRemoveAssignment,
  onSearchChange,
  onToggleStudent,
  onSave,
}: {
  theme: GymFlowTheme;
  primaryColor: string;
  secondaryColor: string;
  routineName: string;
  feedback?: ReactNode;
  assignedStudents: AssignedRoutineStudent[];
  availableStudents: RoutineStudent[];
  activeClientCount: number;
  selectedStudentIds: number[];
  search: string;
  saving: boolean;
  onBack: () => void;
  onRemoveAssignment: (assignment: RutinaAsignadaApp) => void;
  onSearchChange: (value: string) => void;
  onToggleStudent: (studentId: number) => void;
  onSave: () => void;
}) {
  return (
    <ScreenContainer theme={theme}>
      <View style={styles.topBar}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={onBack}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.text}
          />
        </Pressable>
        <View style={styles.topCopy}>
          <Text style={[styles.eyebrow, { color: secondaryColor }]}>
            Entrenamiento
          </Text>
          <Text
            style={[styles.topTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            Asignar alumnos
          </Text>
        </View>
      </View>

      {feedback}

      <Card theme={theme} style={styles.summary}>
        <Text
          style={[styles.summaryTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {routineName}
        </Text>
        <Text style={[styles.summaryMeta, { color: theme.muted }]}>
          {assignedStudents.length} alumno(s) con esta rutina
        </Text>
      </Card>

      <SectionHeader title="Ya asignada" theme={theme} />
      {assignedStudents.length === 0 ? (
        <EmptyState
          icon="account-off-outline"
          title="Sin alumnos asignados"
          text="Selecciona alumnos disponibles para asignar la rutina."
          theme={theme}
        />
      ) : (
        <View style={styles.studentList}>
          {assignedStudents.map((student) => (
            <Card
              key={student.assignment.id}
              theme={theme}
              style={styles.studentCard}
            >
              <Avatar
                uri={student.photoUri}
                initials={student.initials}
                size={42}
                theme={theme}
              />
              <View style={styles.studentCopy}>
                <Text
                  style={[styles.studentName, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {student.name}
                </Text>
                <Text
                  style={[styles.studentMeta, { color: theme.muted }]}
                  numberOfLines={1}
                >
                  {student.email || "Rutina activa"}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.removeStudent,
                  { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
                ]}
                onPress={() => onRemoveAssignment(student.assignment)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color="#B91C1C"
                />
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <SectionHeader
        title="Alumnos disponibles"
        actionLabel={
          selectedStudentIds.length > 0
            ? `${selectedStudentIds.length} seleccionados`
            : undefined
        }
        theme={theme}
      />

      <View
        style={[
          styles.search,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={22} color={theme.muted} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Buscar alumno..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
        />
      </View>

      {availableStudents.length === 0 ? (
        <EmptyState
          icon="account-check-outline"
          title="Sin alumnos disponibles"
          text={
            activeClientCount === 0
              ? "No hay clientes activos en este gimnasio."
              : "Todos los alumnos que coinciden ya tienen esta rutina."
          }
          theme={theme}
        />
      ) : (
        <View style={styles.studentList}>
          {availableStudents.map((student) => {
            const selected = selectedStudentIds.includes(student.id);

            return (
              <Pressable
                key={student.id}
                onPress={() => onToggleStudent(student.id)}
              >
                <Card
                  theme={theme}
                  style={[
                    styles.studentCard,
                    selected && {
                      borderColor: primaryColor,
                      backgroundColor: mezclarColores(
                        primaryColor,
                        theme.surface,
                        0.9,
                      ),
                    },
                  ]}
                >
                  <Avatar
                    uri={student.photoUri}
                    initials={student.initials}
                    size={42}
                    theme={theme}
                  />
                  <View style={styles.studentCopy}>
                    <Text
                      style={[styles.studentName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {student.name}
                    </Text>
                    <Text
                      style={[styles.studentMeta, { color: theme.muted }]}
                      numberOfLines={1}
                    >
                      {student.email || "Cliente activo"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? "check-circle" : "circle-outline"}
                    size={24}
                    color={selected ? primaryColor : theme.muted}
                  />
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <PrimaryButton
        label={
          selectedStudentIds.length > 0
            ? `Asignar a ${selectedStudentIds.length} alumno${
                selectedStudentIds.length === 1 ? "" : "s"
              }`
            : "Selecciona alumnos"
        }
        icon="account-plus-outline"
        theme={theme}
        onPress={onSave}
        loading={saving}
        disabled={selectedStudentIds.length === 0}
        style={styles.stickyAction}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  topCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  topTitle: { fontSize: 24, fontWeight: "900", lineHeight: 29 },
  summary: { padding: 16, marginBottom: 4 },
  summaryTitle: { fontSize: 19, fontWeight: "900", lineHeight: 24 },
  summaryMeta: { fontSize: 13, fontWeight: "800", marginTop: 5 },
  search: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  studentList: { gap: 10 },
  studentCard: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  studentCopy: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  studentMeta: { fontSize: 12, fontWeight: "800", marginTop: 3 },
  removeStudent: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyAction: { marginTop: 14, marginBottom: 4 },
});
