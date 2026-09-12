import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type GymFlowTheme = {
  primary: string;
  secondary: string;
  textOnPrimary: string;
  background: string;
  surface: string;
  surfaceSoft: string;
  text: string;
  muted: string;
  border: string;
};

export function DashboardBackdrop({
  backgroundColor,
}: {
  backgroundColor: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
    />
  );
}

export function DashboardHeroBackground({
  imageUri,
  theme,
  children,
  style,
}: {
  imageUri?: string | null;
  theme: GymFlowTheme;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const hasImage = Boolean(imageUri);

  return (
    <View
      style={[
        styles.dashboardHero,
        hasImage ? styles.dashboardHeroWithImage : styles.dashboardHeroWithoutImage,
        { backgroundColor: theme.background },
        style,
      ]}
    >
      {hasImage && (
        <>
          <Image
            source={{ uri: imageUri! }}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              withAlpha(theme.background, "8C"),
              withAlpha(theme.background, "BD"),
              withAlpha(theme.background, "EB"),
              theme.background,
            ]}
            locations={[0, 0.46, 0.78, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            dither
            style={StyleSheet.absoluteFillObject}
          />
        </>
      )}
      <View style={styles.dashboardHeroContent}>{children}</View>
    </View>
  );
}

function withAlpha(hex: string, alpha: string) {
  const safeHex = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#94A3B8";
  return `${safeHex}${alpha}`;
}

export function ScreenContainer({
  children,
  theme,
  style,
}: {
  children: ReactNode;
  theme: GymFlowTheme;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }, style]}>
      {children}
    </View>
  );
}

export function Header({
  title,
  subtitle,
  theme,
  avatarUri,
  initials,
  onAvatarPress,
}: {
  title: string;
  subtitle?: string;
  theme: GymFlowTheme;
  avatarUri?: string | null;
  initials?: string;
  onAvatarPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.headerSubtitle, { color: theme.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      <Avatar
        uri={avatarUri}
        initials={initials}
        size={48}
        theme={theme}
        onPress={onAvatarPress}
      />
    </View>
  );
}

export function Card({
  children,
  theme,
  style,
  onPress,
}: {
  children: ReactNode;
  theme: GymFlowTheme;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function PrimaryButton({
  label,
  icon,
  theme,
  onPress,
  style,
  disabled,
  loading,
}: {
  label: string;
  icon?: IconName;
  theme: GymFlowTheme;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.primaryButton,
        { backgroundColor: theme.primary },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.textOnPrimary} />
      ) : !!icon && (
        <MaterialCommunityIcons name={icon} size={20} color={theme.textOnPrimary} />
      )}
      <Text style={[styles.primaryButtonText, { color: theme.textOnPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  icon,
  theme,
  onPress,
  style,
  disabled,
}: {
  label: string;
  icon?: IconName;
  theme: GymFlowTheme;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.secondaryButton,
        {
          backgroundColor: withAlpha(theme.secondary, "12"),
          borderColor: withAlpha(theme.secondary, "30"),
        },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {!!icon && <MaterialCommunityIcons name={icon} size={19} color={theme.secondary} />}
      <Text style={[styles.secondaryButtonText, { color: theme.secondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  theme,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  theme: GymFlowTheme;
  accent?: "primary" | "secondary";
}) {
  const color = accent === "primary" ? theme.primary : theme.secondary;

  return (
    <Card theme={theme} style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: withAlpha(color, "14") }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </Card>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  theme,
  style,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: GymFlowTheme;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {!!actionLabel && !!onAction && (
        <Pressable onPress={onAction}>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function FilterChip({
  label,
  active,
  theme,
  onPress,
  stableHeight = false,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  theme: GymFlowTheme;
  onPress?: () => void;
  stableHeight?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.filterChip,
        stableHeight && styles.filterChipStable,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ selected: active, disabled }}
    >
      <Text
        numberOfLines={stableHeight ? 1 : undefined}
        style={[
          styles.filterChipText,
          { color: active ? theme.textOnPrimary : theme.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DaySelector({
  days,
  activeDay,
  theme,
  onSelect,
  weekKey,
}: {
  days: { key: string; label: string; meta?: string; disabled?: boolean }[];
  activeDay: string;
  theme: GymFlowTheme;
  onSelect: (key: string) => void;
  weekKey?: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const itemLayoutsRef = useRef(new Map<string, { x: number; width: number }>());
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  const alignActiveDay = useCallback(() => {
    const layout = itemLayoutsRef.current.get(activeDay);
    if (!layout || viewportWidth <= 0) {
      return;
    }
    const centeredOffset = layout.x + layout.width / 2 - viewportWidth / 2;
    const maxOffset = Math.max(0, contentWidth - viewportWidth);
    scrollRef.current?.scrollTo({
      x: Math.min(Math.max(0, centeredOffset), maxOffset),
      animated: false,
    });
  }, [activeDay, contentWidth, viewportWidth]);

  useEffect(() => {
    alignActiveDay();
  }, [alignActiveDay, weekKey]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dayList}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={(width) => setContentWidth(width)}
    >
      {days.map((day) => {
        const disabled = day.disabled === true;
        const active = activeDay === day.key && !disabled;
        return (
          <Pressable
            key={day.key}
            style={[
              styles.dayTile,
              {
                backgroundColor: disabled
                  ? theme.surfaceSoft
                  : active
                    ? theme.primary
                    : theme.surface,
                borderColor: disabled || !active ? theme.border : theme.primary,
              },
            ]}
            onPress={disabled ? undefined : () => onSelect(day.key)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            onLayout={(event) => {
              itemLayoutsRef.current.set(day.key, event.nativeEvent.layout);
              if (day.key === activeDay) {
                alignActiveDay();
              }
            }}
          >
            <Text
              style={[
                styles.dayLabel,
                {
                  color: disabled
                    ? theme.muted
                    : active
                      ? theme.textOnPrimary
                      : theme.text,
                },
              ]}
            >
              {day.label}
            </Text>
            {!!day.meta && (
              <Text
                style={[
                  styles.dayMeta,
                  { color: active ? theme.textOnPrimary : theme.muted },
                ]}
              >
                {day.meta}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Avatar({
  uri,
  initials = "GF",
  size = 44,
  theme,
  onPress,
}: {
  uri?: string | null;
  initials?: string;
  size?: number;
  theme: GymFlowTheme;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          backgroundColor: withAlpha(theme.primary, "14"),
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} />
      ) : (
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {initials}
        </Text>
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function EmptyState({
  title,
  text,
  icon,
  theme,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  icon: IconName;
  theme: GymFlowTheme;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card theme={theme} style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: withAlpha(theme.primary, "12") }]}>
        <MaterialCommunityIcons name={icon} size={26} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: theme.muted }]}>{text}</Text>
      {!!actionLabel && !!onAction && (
        <PrimaryButton label={actionLabel} theme={theme} onPress={onAction} />
      )}
    </Card>
  );
}

export function ClassCard({
  title,
  subtitle,
  imageUri,
  eyebrow,
  meta,
  statusLabel,
  theme,
  actionLabel,
  onAction,
  onPress,
  placeholderIcon = "dumbbell",
}: {
  title: string;
  subtitle?: string;
  imageUri?: string | null;
  eyebrow?: string;
  meta: { icon: IconName; label: string }[];
  statusLabel?: string;
  theme: GymFlowTheme;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
  placeholderIcon?: IconName;
}) {
  const eyebrowBadge = !!eyebrow && (
    <View style={[styles.classEyebrow, { backgroundColor: theme.primary }]}>
      <Text style={[styles.classEyebrowText, { color: theme.textOnPrimary }]}>
        {eyebrow}
      </Text>
    </View>
  );

  return (
    <Card theme={theme} style={styles.classCard} onPress={onPress}>
      {imageUri ? (
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.classImage}
          imageStyle={styles.classImageStyle}
        >
          <View style={styles.classImageOverlay} />
          {eyebrowBadge}
        </ImageBackground>
      ) : (
        <View style={[styles.classImage, { backgroundColor: theme.surfaceSoft }]}>
          <View style={[styles.classPlaceholderIcon, { backgroundColor: withAlpha(theme.primary, "14") }]}>
            <MaterialCommunityIcons name={placeholderIcon} size={34} color={theme.primary} />
          </View>
          {eyebrowBadge}
        </View>
      )}
      <View style={styles.classBody}>
        <View style={styles.classTitleRow}>
          <View style={styles.classCopy}>
            {!!statusLabel && (
              <Text style={[styles.classStatus, { color: theme.secondary }]}>
                {statusLabel}
              </Text>
            )}
            <Text style={[styles.classTitle, { color: theme.text }]}>{title}</Text>
            {!!subtitle && (
              <Text style={[styles.classSubtitle, { color: theme.muted }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.classMetaGrid}>
          {meta.map((item) => (
            <View key={`${item.icon}-${item.label}`} style={styles.classMetaItem}>
              <MaterialCommunityIcons name={item.icon} size={16} color={theme.muted} />
              <Text style={[styles.classMetaText, { color: theme.muted }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        {!!actionLabel && !!onAction && (
          <PrimaryButton label={actionLabel} icon="calendar-plus" theme={theme} onPress={onAction} />
        )}
      </View>
    </Card>
  );
}

export function ClassMediaPlaceholder({
  theme,
  icon = "dumbbell",
  label = "Clase sin imagen",
  eyebrow,
  title,
  style,
}: {
  theme: GymFlowTheme;
  icon?: IconName;
  label?: string;
  eyebrow?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.classMediaPlaceholder,
        { backgroundColor: theme.surfaceSoft },
        style,
      ]}
    >
      <View style={[styles.classPlaceholderIcon, { backgroundColor: withAlpha(theme.primary, "14") }]}>
        <MaterialCommunityIcons name={icon} size={34} color={theme.primary} />
      </View>
      {title ? (
        <View style={styles.classMediaPlaceholderCopy}>
          {!!eyebrow && (
            <Text style={[styles.classMediaPlaceholderEyebrow, { color: theme.muted }]}>
              {eyebrow}
            </Text>
          )}
          <Text style={[styles.classMediaPlaceholderTitle, { color: theme.text }]}>
            {title}
          </Text>
        </View>
      ) : (
        <Text style={[styles.classMediaPlaceholderText, { color: theme.muted }]}>{label}</Text>
      )}
    </View>
  );
}

export function BottomNavigation({
  items,
  theme,
}: {
  items: {
    key: string;
    label: string;
    icon: IconName;
    active?: boolean;
    badgeCount?: number;
    onPress: () => void;
  }[];
  theme: GymFlowTheme;
}) {
  return (
    <View style={[styles.bottomNavigation, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.bottomItem} onPress={item.onPress}>
          <View style={styles.bottomIconWrap}>
            <MaterialCommunityIcons
              name={item.icon}
              size={23}
              color={item.active ? theme.primary : theme.muted}
            />
            {!!item.badgeCount && item.badgeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.badgeText, { color: theme.textOnPrimary }]}>
                  {item.badgeCount > 99 ? "99+" : item.badgeCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.bottomLabel, { color: item.active ? theme.primary : theme.muted }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardHero: {
    marginHorizontal: -20,
    marginTop: -18,
    paddingHorizontal: 20,
    paddingTop: 18,
    overflow: "hidden",
  },
  dashboardHeroWithImage: {
    paddingBottom: 38,
  },
  dashboardHeroWithoutImage: {
    paddingBottom: 14,
  },
  dashboardHeroContent: {
    zIndex: 1,
  },
  screenContainer: {
    marginHorizontal: -18,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 3,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
  },
  metricCard: {
    flex: 1,
    minHeight: 116,
    padding: 14,
    justifyContent: "space-between",
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 10,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "900",
  },
  filterChip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipStable: {
    height: 40,
    minHeight: 40,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "center",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "900",
  },
  dayList: {
    gap: 10,
    paddingRight: 20,
  },
  dayTile: {
    width: 58,
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "900",
  },
  dayMeta: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  avatar: {
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "900",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  classCard: {
    overflow: "hidden",
  },
  classImage: {
    height: 210,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 16,
  },
  classImageStyle: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  classImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,25,31,0.16)",
  },
  classPlaceholderIcon: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 68,
    height: 68,
    marginLeft: -34,
    marginTop: -34,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  classMediaPlaceholder: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
  },
  classMediaPlaceholderText: {
    marginTop: 78,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  classMediaPlaceholderCopy: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    gap: 6,
  },
  classMediaPlaceholderEyebrow: {
    fontSize: 13,
    fontWeight: "900",
  },
  classMediaPlaceholderTitle: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
  },
  classEyebrow: {
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  classEyebrowText: {
    fontSize: 12,
    fontWeight: "900",
  },
  classBody: {
    padding: 18,
  },
  classTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  classCopy: {
    flex: 1,
    minWidth: 0,
  },
  classStatus: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  classTitle: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30,
  },
  classSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  classMetaGrid: {
    gap: 9,
    marginTop: 16,
    marginBottom: 16,
  },
  classMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  classMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
  },
  bottomNavigation: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    minHeight: 74,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  bottomIconWrap: {
    position: "relative",
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: "900",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 19,
    height: 19,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
  },
});
