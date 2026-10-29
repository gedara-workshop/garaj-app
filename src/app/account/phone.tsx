import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { CODE_LENGTH, CodeInput } from "@/components/CodeInput";
import { Txt } from "@/components/Txt";
import { authErrorMessage } from "@/data/authErrors";
import { formatPhone, toLkMobile } from "@/data/format";
import { supabase } from "@/data/supabase";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

// Supabase lets a number ask for a new code once every 60 seconds.
const RESEND_AFTER = 60;

/**
 * Adds a phone number to the signed-in account (one that started with Google), so either
 * way opens the same garage. Supabase texts a code to the new number before it's added.
 */
export default function AddPhone() {
  const { colors } = useTheme();
  const { t } = useT();
  const [number, setNumber] = useState("");
  const [phone, setPhone] = useState(""); // set once a code is on its way
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/me"));

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function sendCode(to: string) {
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ phone: to });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    setPhone(to);
    setWait(RESEND_AFTER);
  }

  async function verify(token: string) {
    if (token.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "phone_change" });
    if (error) {
      setBusy(false);
      setCode("");
      return setError(authErrorMessage(error));
    }
    // The session now carries the number, so Me shows it straight away.
    close();
  }

  function submitNumber() {
    const to = toLkMobile(number);
    if (!to) return setError(t("signIn.phoneInvalid"));
    sendCode(to);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={22} color={colors.ink} />
        </Pressable>
        <Txt variant="heading">{t("addPhone.title")}</Txt>
        <View className="w-11" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pb-8 pt-4">
        {!phone ? (
          <>
            <Txt className="text-ink-muted">{t("addPhone.body")}</Txt>
            <View className="mt-6 flex-row gap-2">
              <View className="h-14 items-center justify-center rounded-md border border-line bg-surface-300 px-4">
                <Txt variant="number" className="text-[18px] leading-[24px]">
                  +94
                </Txt>
              </View>
              <TextInput
                value={number}
                onChangeText={(text) => {
                  setNumber(text);
                  if (error) setError("");
                }}
                onSubmitEditing={submitNumber}
                placeholder="77 123 4567"
                placeholderTextColor="#8a8f8c"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                autoFocus
                maxLength={16}
                accessibilityLabel={t("signIn.mobileNumber")}
                className="h-14 flex-1 rounded-md border border-line bg-surface-200 px-4 font-mono text-[18px] text-ink"
              />
            </View>
          </>
        ) : (
          <>
            <Txt className="text-ink-muted">
              {t("signIn.codeSentTo")}{" "}
              <Txt variant="number" className="text-[15px]">
                {formatPhone(phone)}
              </Txt>
            </Txt>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPhone("");
                setCode("");
                setError("");
              }}
              className="mt-1 min-h-[44px] justify-center self-start"
            >
              <Txt className="font-inter-semibold text-[14px] text-brand">{t("signIn.changeNumber")}</Txt>
            </Pressable>
            <View className="mt-4">
              <CodeInput
                value={code}
                onChange={(digits) => {
                  setCode(digits);
                  if (error) setError("");
                  verify(digits);
                }}
                busy={busy}
              />
            </View>
            {wait > 0 ? (
              <Txt className="mt-4 text-[14px] text-ink-muted">
                {t("signIn.resendIn")}{" "}
                <Txt variant="number" className="text-ink">
                  0:{String(wait).padStart(2, "0")}
                </Txt>
              </Txt>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => sendCode(phone)}
                className="mt-2 min-h-[44px] justify-center self-start"
              >
                <Txt className="font-inter-semibold text-[14px] text-brand">{t("signIn.sendNew")}</Txt>
              </Pressable>
            )}
          </>
        )}

        {error ? (
          <Txt accessibilityRole="alert" className="mt-3 font-inter-medium text-[13px] text-due">
            {error}
          </Txt>
        ) : null}

        <View className="mt-auto pt-6">
          {!phone ? (
            <Button title={busy ? t("signIn.sending") : t("signIn.send")} onPress={submitNumber} disabled={busy} />
          ) : (
            <Button
              title={busy ? t("signIn.checking") : t("signIn.verify")}
              onPress={() => verify(code)}
              disabled={busy || code.length !== CODE_LENGTH}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
