import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "./themeProvider";

interface ErrorNoticeProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorNotice({ message, onDismiss }: ErrorNoticeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${colors.stitchError}1A`,
          borderColor: `${colors.stitchError}66`,
        },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle" size={22} color={colors.stitchError} />
      <Text style={[styles.message, { color: colors.stitchError }]}>
        {message}
      </Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Fermer">
          <Ionicons name="close" size={18} color={colors.stitchError} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
