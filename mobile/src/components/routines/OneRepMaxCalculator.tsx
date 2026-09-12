import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  findNodeHandle,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  calculatePercentageLoad,
  formatKg,
  ONE_RM_PERCENTAGES,
  ONE_RM_REPS_BY_PERCENTAGE,
  validateOneRepMaxInputs,
  type OneRepMaxResult,
} from "../../features/routines/oneRepMax";
import {
  Avatar,
  Card,
  PrimaryButton,
  ScreenContainer,
  SecondaryButton,
  type GymFlowTheme,
} from "../GymFlowDesignSystem";

type OneRepMaxColors = {
  primary: string;
  secondary: string;
  accessIconBackground: string;
  resultBackground: string;
  resultBorder: string;
  resultNoticeBackground: string;
  percentagePillBackground: string;
};

export function OneRepMaxAccessCard({
  theme,
  secondaryColor,
  iconBackgroundColor,
  onPress,
}: {
  theme: GymFlowTheme;
  secondaryColor: string;
  iconBackgroundColor: string;
  onPress: () => void;
}) {
  return (
    <Card theme={theme} style={styles.oneRmAccessCard} onPress={onPress}>
      <View
        style={[
          styles.oneRmAccessIcon,
          { backgroundColor: iconBackgroundColor },
        ]}
      >
        <MaterialCommunityIcons
          name="weight-lifter"
          size={24}
          color={secondaryColor}
        />
      </View>
      <View style={styles.oneRmAccessCopy}>
        <Text style={[styles.oneRmAccessTitle, { color: theme.text }]}>
          Calculadora 1RM
        </Text>
        <Text style={[styles.oneRmAccessText, { color: theme.muted }]}>
          Calcula tus cargas según tu rendimiento
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={theme.muted}
      />
    </Card>
  );
}

function OneRepMaxInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  unit,
  error,
  secondaryColor,
  theme,
  onSubmit,
  onInputFocus,
}: {
  label: string;
  icon: "weight-kilogram" | "repeat-variant";
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  unit?: string;
  error?: string;
  secondaryColor: string;
  theme: GymFlowTheme;
  onSubmit: () => void;
  onInputFocus?: (target: number | null) => void;
}) {
  return (
    <View style={styles.oneRmInputGroup}>
      <Text style={[styles.oneRmInputLabel, { color: theme.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.oneRmInputShell,
          {
            backgroundColor: theme.surfaceSoft,
            borderColor: error ? "#FCA5A5" : theme.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={secondaryColor}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          style={[styles.oneRmInput, { color: theme.text }]}
          keyboardType={unit === "kg" ? "decimal-pad" : "number-pad"}
          inputMode={unit === "kg" ? "decimal" : "numeric"}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          onFocus={(event) =>
            onInputFocus?.(findNodeHandle(event.target as any))
          }
        />
        {!!unit && (
          <Text style={[styles.oneRmInputUnit, { color: theme.muted }]}>
            {unit}
          </Text>
        )}
      </View>
      {!!error && <Text style={styles.oneRmInputError}>{error}</Text>}
    </View>
  );
}

export default function OneRepMaxCalculator({
  theme,
  colors,
  weight,
  repetitions,
  showErrors,
  result,
  avatarUri,
  avatarInitials,
  onWeightChange,
  onRepetitionsChange,
  onCalculate,
  onClear,
  onBack,
  onAvatarPress,
  onInputFocus,
}: {
  theme: GymFlowTheme;
  colors: OneRepMaxColors;
  weight: string;
  repetitions: string;
  showErrors: boolean;
  result: OneRepMaxResult | null;
  avatarUri?: string | null;
  avatarInitials: string;
  onWeightChange: (text: string) => void;
  onRepetitionsChange: (text: string) => void;
  onCalculate: () => void;
  onClear: () => void;
  onBack: () => void;
  onAvatarPress: () => void;
  onInputFocus?: (target: number | null) => void;
}) {
  const validation = validateOneRepMaxInputs(weight, repetitions);
  const errors = showErrors ? validation.errors : {};

  return (
    <ScreenContainer theme={theme}>
      <View style={styles.header}>
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.text}
          />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>
            Entrenamiento
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Calculadora 1RM
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Estima tu repetición máxima y consulta cargas orientativas.
          </Text>
        </View>
        <Avatar
          uri={avatarUri}
          initials={avatarInitials}
          size={52}
          theme={theme}
          onPress={onAvatarPress}
        />
      </View>

      <Card theme={theme} style={styles.oneRmFormCard}>
        <View style={styles.oneRmFormHeader}>
          <View
            style={[
              styles.oneRmFormIcon,
              { backgroundColor: colors.resultBackground },
            ]}
          >
            <MaterialCommunityIcons
              name="calculator-variant-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.oneRmFormCopy}>
            <Text style={[styles.oneRmFormTitle, { color: theme.text }]}>
              Datos de tu serie
            </Text>
            <Text style={[styles.oneRmFormSubtitle, { color: theme.muted }]}>
              Usa una serie exigente de 1 a 12 repeticiones.
            </Text>
          </View>
        </View>

        <OneRepMaxInput
          label="Peso levantado"
          icon="weight-kilogram"
          value={weight}
          onChangeText={onWeightChange}
          placeholder="60"
          unit="kg"
          error={errors.peso}
          secondaryColor={colors.secondary}
          theme={theme}
          onSubmit={onCalculate}
          onInputFocus={onInputFocus}
        />

        <OneRepMaxInput
          label="Repeticiones realizadas"
          icon="repeat-variant"
          value={repetitions}
          onChangeText={onRepetitionsChange}
          placeholder="8"
          error={errors.repeticiones}
          secondaryColor={colors.secondary}
          theme={theme}
          onSubmit={onCalculate}
          onInputFocus={onInputFocus}
        />

        <View style={styles.oneRmActions}>
          <PrimaryButton
            label="Calcular 1RM"
            icon="calculator-variant"
            theme={theme}
            onPress={onCalculate}
          />
          <SecondaryButton
            label="Limpiar"
            icon="broom"
            theme={theme}
            onPress={onClear}
            disabled={!weight && !repetitions && !result}
          />
        </View>
      </Card>

      {!!result && (
        <>
          <Card
            theme={theme}
            style={[
              styles.oneRmResultCard,
              {
                backgroundColor: colors.resultBackground,
                borderColor: colors.resultBorder,
              },
            ]}
          >
            <Text style={[styles.oneRmResultEyebrow, { color: colors.primary }]}>
              Tu 1RM estimado
            </Text>
            <Text style={[styles.oneRmResultValue, { color: theme.text }]}>
              {formatKg(result.oneRepMax)} kg
            </Text>
            <Text style={[styles.oneRmResultFormula, { color: theme.text }]}>
              Estimación basada en {formatKg(result.peso)} kg ×{" "}
              {result.repeticiones} repeticiones
            </Text>
            <View
              style={[
                styles.oneRmDisclaimerRow,
                {
                  backgroundColor: colors.resultNoticeBackground,
                  borderColor: colors.resultBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={17}
                color={theme.muted}
              />
              <Text style={[styles.oneRmDisclaimer, { color: theme.muted }]}>
                Es una estimación orientativa, no una recomendación para intentar
                este peso sin supervisión.
              </Text>
            </View>
          </Card>

          <Card theme={theme} style={styles.oneRmLoadsCard}>
            <Text style={[styles.oneRmSectionTitle, { color: theme.text }]}>
              Cargas estimadas
            </Text>
            <View style={styles.oneRmTableHeader}>
              <Text style={[styles.oneRmTableHeaderPercent, { color: theme.muted }]}>
                % 1RM
              </Text>
              <Text style={[styles.oneRmTableHeaderWeight, { color: theme.muted }]}>
                Peso
              </Text>
              <Text style={[styles.oneRmTableHeaderReps, { color: theme.muted }]}>
                Reps
              </Text>
            </View>
            <View style={styles.oneRmLoadRows}>
              {ONE_RM_PERCENTAGES.map((percentage) => (
                <View key={percentage} style={styles.oneRmLoadRow}>
                  <View
                    style={[
                      styles.oneRmPercentPill,
                      { backgroundColor: colors.percentagePillBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.oneRmPercentText,
                        { color: colors.secondary },
                      ]}
                    >
                      {percentage} %
                    </Text>
                  </View>
                  <Text style={[styles.oneRmLoadValue, { color: theme.text }]}>
                    {formatKg(calculatePercentageLoad(result.oneRepMax, percentage))} kg
                  </Text>
                  <Text style={[styles.oneRmLoadReps, { color: theme.muted }]}>
                    {ONE_RM_REPS_BY_PERCENTAGE[percentage]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.oneRmTableNote, { color: theme.muted }]}>
              Las repeticiones son orientativas y pueden variar según el ejercicio,
              experiencia, técnica y nivel de esfuerzo.
            </Text>
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 4,
  },
  oneRmAccessCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  oneRmAccessIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  oneRmAccessCopy: {
    flex: 1,
    minWidth: 0,
  },
  oneRmAccessTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 22,
  },
  oneRmAccessText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  oneRmFormCard: {
    padding: 18,
    gap: 15,
  },
  oneRmFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  oneRmFormIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  oneRmFormCopy: {
    flex: 1,
    minWidth: 0,
  },
  oneRmFormTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  oneRmFormSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3,
  },
  oneRmInputGroup: {
    gap: 7,
  },
  oneRmInputLabel: {
    fontSize: 13,
    fontWeight: "900",
  },
  oneRmInputShell: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  oneRmInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: "900",
    paddingVertical: 0,
  },
  oneRmInputUnit: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: "900",
  },
  oneRmInputError: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  oneRmActions: {
    gap: 10,
    marginTop: 2,
  },
  oneRmResultCard: {
    padding: 20,
    gap: 9,
    marginTop: 16,
  },
  oneRmResultEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  oneRmResultValue: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 50,
  },
  oneRmResultFormula: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
  },
  oneRmDisclaimerRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  oneRmDisclaimer: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  oneRmLoadsCard: {
    padding: 16,
    gap: 10,
    marginTop: 14,
  },
  oneRmSectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
  },
  oneRmTableHeader: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 2,
  },
  oneRmTableHeaderPercent: {
    width: 66,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  oneRmTableHeaderWeight: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  oneRmTableHeaderReps: {
    width: 62,
    textAlign: "right",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  oneRmLoadRows: {
    gap: 2,
  },
  oneRmLoadRow: {
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  oneRmPercentPill: {
    width: 66,
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  oneRmPercentText: {
    fontSize: 11,
    fontWeight: "900",
  },
  oneRmLoadValue: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "900",
  },
  oneRmLoadReps: {
    width: 62,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "800",
  },
  oneRmTableNote: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 4,
  },
});
