import { Image, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

import { gymFlowAccessTheme as theme } from "../../theme/gymflowAccessTheme";

type GymFlowBrandProps = {
  variant?: "color" | "white";
  markSize?: number;
  wordmarkSize?: number;
  compact?: boolean;
  wordmarkStyle?: StyleProp<TextStyle>;
  onMarkReady?: () => void;
};

const BRAND_MARKS = {
  color: require("../../../assets/images/gymflow-mark-color.png"),
  white: require("../../../assets/images/gymflow-mark-white.png"),
};

export default function GymFlowBrand({
  variant = "color",
  markSize = 92,
  wordmarkSize = 27,
  compact = false,
  wordmarkStyle,
  onMarkReady,
}: GymFlowBrandProps) {
  const white = variant === "white";

  return (
    <View
      style={[styles.container, compact && styles.containerCompact]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="GymFlow"
    >
      <Image
        source={BRAND_MARKS[variant]}
        style={{ width: markSize, height: markSize }}
        resizeMode="contain"
        onLoad={onMarkReady}
        onError={onMarkReady}
        accessible={false}
      />
      <Text
        style={[
          styles.wordmark,
          { fontSize: wordmarkSize, lineHeight: Math.round(wordmarkSize * 1.22) },
          wordmarkStyle,
        ]}
        accessible={false}
      >
        <Text style={white ? styles.wordWhite : styles.wordNavy}>GYM</Text>
        <Text style={white ? styles.wordWhite : styles.wordBlue}>FL</Text>
        <Text style={white ? styles.wordWhite : styles.wordFlow}>OW</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
  },
  containerCompact: {
    gap: 5,
  },
  wordmark: {
    fontFamily: theme.fonts.extraBold,
    letterSpacing: 1.4,
  },
  wordNavy: {
    color: theme.primary,
  },
  wordBlue: {
    color: theme.blue,
  },
  wordFlow: {
    color: theme.violet,
  },
  wordWhite: {
    color: "#FFFFFF",
  },
});
