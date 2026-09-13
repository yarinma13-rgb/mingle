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
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/providers/ThemeProvider";
import { brand } from "@/src/theme/tokens";

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
        fontFamily: "Poppins_700Bold",
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
        fontFamily: "Poppins_400Regular",
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
        fontFamily: "Poppins_400Regular",
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
        fontFamily: "Poppins_600SemiBold",
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
        fontFamily: "Poppins_600SemiBold",
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

  if (isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => ({
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          borderRadius: 999,
          overflow: "hidden",
        })}
      >
        <LinearGradient
          colors={[brand.accentPink, brand.accentPurple, brand.accentBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        backgroundColor: isDanger
          ? brand.error
          : isGhost
            ? "transparent"
            : colors.surface,
        borderWidth: isGhost ? 0 : StyleSheet.hairlineWidth,
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
        {...rest}
        style={[
          {
            fontFamily: "Poppins_400Regular",
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
          fontFamily: "Poppins_700Bold",
          fontSize: 18,
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Poppins_400Regular",
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
          fontFamily: "Poppins_500Medium",
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
          fontFamily: "Poppins_400Regular",
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
          fontFamily: "Poppins_500Medium",
          fontSize: 12,
          color: colors.text,
        }}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
});

/** Alias used by screens */


