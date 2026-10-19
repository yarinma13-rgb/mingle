import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand, scoreTone } from "@/src/theme/tokens";

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: 16,
          padding: 16,
          // web: --mingle-shadow 0 8px 30px rgba(28,27,46,.06)
          shadowColor: "#1C1B2E",
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontFamily: "Figtree_700Bold",
        fontSize: 28,
        color: colors.text,
        letterSpacing: -0.5,
      }}
    >
      {children}
    </Text>
  );
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontFamily: "Figtree_400Regular",
        fontSize: 15,
        lineHeight: 22,
        color: colors.textSecondary,
        marginTop: 8,
      }}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontFamily: "Figtree_400Regular",
        fontSize: 14,
        lineHeight: 20,
        color: muted ? colors.textMuted : colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontFamily: "Figtree_600SemiBold",
        fontSize: 12,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: colors.textMuted,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";

  const content = loading ? (
    <ActivityIndicator color={isPrimary || isDanger ? "#fff" : brand.cta} />
  ) : (
    <Text
      style={{
        fontFamily: "Figtree_600SemiBold",
        fontSize: 15,
        color:
          isPrimary || isDanger
            ? "#FFFFFF"
            : isGhost
              ? colors.text
              : brand.cta,
      }}
    >
      {label}
    </Text>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        backgroundColor: isPrimary
          ? colors.primary
          : isDanger
            ? brand.error
            : isGhost
              ? "transparent"
              : colors.surface,
        borderWidth: isGhost || isPrimary ? 0 : StyleSheet.hairlineWidth,
        borderColor: colors.border,
      })}
    >
      {content}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { colors } = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...rest}
        style={[
          {
            fontFamily: "Figtree_400Regular",
            fontSize: 16,
            color: colors.text,
            backgroundColor: colors.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
          },
          style,
        ]}
      />
    </View>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card style={{ alignItems: "center", gap: 8, paddingVertical: 28 }}>
      <Text
        style={{
          fontFamily: "Figtree_700Bold",
          fontSize: 18,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Figtree_400Regular",
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {body}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 12, alignSelf: "stretch" }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  const { colors } = useTheme();
  const map = {
    success: brand.success,
    warning: brand.warning,
    danger: brand.error,
    info: brand.blue,
    neutral: colors.textMuted,
  } as const;
  const color = map[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        backgroundColor: `${color}22`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 99,
          backgroundColor: color,
        }}
      />
      <Text
        style={{
          fontFamily: "Figtree_500Medium",
          fontSize: 12,
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function LoadingBlock() {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 32, alignItems: "center" }}>
      <ActivityIndicator color={brand.cta} />
      <Text
        style={{
          marginTop: 12,
          fontFamily: "Figtree_400Regular",
          color: colors.textMuted,
        }}
      >
        Loading…
      </Text>
    </View>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();
  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityLabel="Toggle theme"
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Text
        style={{
          fontFamily: "Figtree_500Medium",
          fontSize: 12,
          color: colors.text,
        }}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </Text>
    </Pressable>
  );
}

/** Circular match indicator from the Discover mockups: tone-coloured ring
 *  with the percentage centred. (Full progress arc would need SVG; a solid
 *  ring keeps this dependency-free.) */
export function ScoreRing({
  score,
  size = 52,
  color,
}: {
  score: number;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const tone = color ?? scoreTone(score);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 4,
        borderColor: tone,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <Text
        style={{
          fontFamily: "Figtree_700Bold",
          fontSize: size * 0.27,
          color: colors.text,
        }}
      >
        {score}%
      </Text>
    </View>
  );
}

/** Alias used by screens */



/** Multi-select chips (mockups: "What drives you?" / "How I work"). */
export function ChipPicker({
  options,
  selected,
  onChange,
  max,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) onChange(selected.filter((s) => s !== option));
              else if (!max || selected.length < max) onChange([...selected, option]);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: on ? colors.primary : colors.border,
              backgroundColor: on ? colors.primary : colors.surfaceElevated,
            }}
          >
            <Text
              style={{
                fontFamily: "Figtree_500Medium",
                fontSize: 13,
                color: on ? colors.onPrimary : colors.text,
              }}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 1–5 star input (mockups: "How did it feel?"). Read-only when no onChange. */
export function StarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color={brand.accentPink}
          />
        );
        return onChange ? (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
            hitSlop={4}
          >
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}

/** Dashboard stat card: coloured icon tile + big number + label, like the
 *  KPI row on the web dashboard. */
export function KpiTile({
  label,
  value,
  icon,
  tint,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flex: 1,
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
        padding: 14,
        gap: 8,
        shadowColor: "#1C1B2E",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={{ fontFamily: "Figtree_700Bold", fontSize: 24, color: colors.text }}>
        {value}
      </Text>
      <Text style={{ fontFamily: "Figtree_400Regular", fontSize: 12, color: colors.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}
