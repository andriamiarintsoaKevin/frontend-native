import Button from "@/components/button";
import ErrorNotice from "@/components/errorNotice";
import Header from "@/components/header";
import Input from "@/components/input";
import LanguageToggle from "@/components/languageToggle";
import MediaBtn from "@/components/mediaBtn";
import TextCustomise from "@/components/textCustomise";
import { useTheme } from "@/components/themeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("12345678");
  const [visibleError, setVisibleError] = useState(false);
  const isLight = theme === "light";
  const [eyes, setEyes] = useState(true);

  useEffect(() => {
    if (error) {
      setVisibleError(true);
    }
  }, [error]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(protected)/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    clearError();
    const ok = await login(email.trim(), password);

    if (ok) {
      router.replace("/(protected)/dashboard");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.themeToggleRow}>
            <Pressable
              onPress={toggleTheme}
              style={[styles.themeButton, { backgroundColor: colors.surface }]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name={isLight ? "moon" : "sunny"}
                  size={20}
                  color={isLight ? "#333" : "#fff"}
                />
                <TextCustomise typeText="normal">
                  {isLight ? t("common.darkMode") : t("common.lightMode")}
                </TextCustomise>
              </View>
            </Pressable>
            <LanguageToggle />
          </View>

          <View style={styles.firstChild}>
            <View
              style={{
                gap: 26,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("@/assets/images/logo.svg")}
                style={styles.logo}
              />
              <Header title={t("login.welcome")} txt={t("login.subtitle")} />
            </View>
            <View style={styles.inputGroup}>
              <View style={{ gap: 16 }}>
                <View>
                  <TextCustomise typeText="normal">
                    {t("login.email")}
                  </TextCustomise>
                  <Input
                    imageSrc={require("@/assets/images/mail.svg")}
                    placeholder="sarah.chen@design.co"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View>
                  <TextCustomise typeText="normal">
                    {t("login.password")}
                  </TextCustomise>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Input
                      imageSrc={require("@/assets/images/lock.svg")}
                      placeholder="password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={eyes}
                    />

                    <Pressable
                      onPress={() => setEyes((prev) => !prev)}
                      style={{ position: "relative", right: 30 }}
                    >
                      <Ionicons
                        name={eyes ? "eye-off" : "eye"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Link
                href={"/"}
                style={{ color: colors.primary, textAlign: "right" }}
              >
                <TextCustomise typeText="normal">
                  {t("login.forgotPassword")}
                </TextCustomise>
              </Link>
            </View>
            <View style={styles.card3}>
              <Button
                txt={isLoading ? t("common.loading") : t("login.login")}
                onPress={handleLogin}
                disabled={isLoading}
              />
              {visibleError && error ? (
                <ErrorNotice
                  message={error}
                  onDismiss={() => {
                    setVisibleError(false);
                    clearError();
                  }}
                />
              ) : null}
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null}
              <View style={styles.LineCard}>
                <View style={[styles.line, { backgroundColor: colors.line }]} />
                <TextCustomise
                  typeText="default"
                  style={{ textAlign: "center", textTransform: "uppercase" }}
                >
                  {t("login.continueWith")}
                </TextCustomise>
                <View style={[styles.line, { backgroundColor: colors.line }]} />
              </View>
              <View style={styles.mediaLogin}>
                <MediaBtn
                  txt="Google"
                  imgsrc={require("@/assets/images/google.svg")}
                />
                <MediaBtn
                  txt="Apple"
                  imgsrc={require("@/assets/images/apple.svg")}
                />
              </View>
            </View>
          </View>

          <View style={styles.secondChild}>
            <TextCustomise typeText="txtMedium">
              {t("login.noAccount")}
            </TextCustomise>
            <Link href={"/auth"} style={{ color: colors.primary }}>
              <TextCustomise typeText="txtBack">
                {" "}
                {t("login.signUp")}
              </TextCustomise>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
  },
  themeToggleRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    paddingRight: 18,
    paddingTop: 18,
  },
  themeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  firstChild: {
    width: 346,
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 40,
  },
  inputGroup: {
    minHeight: 200,
    justifyContent: "space-between",
  },
  secondChild: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 12,
    marginBottom: 16,
  },
  logo: {
    width: 59.92,
    height: 59.92,
  },
  card3: {
    gap: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  LineCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  line: {
    width: 98.5,
    height: 2,
  },
  mediaLogin: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
  },
});
