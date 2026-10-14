import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { cn } from "@/components/cn";
import { Txt } from "@/components/Txt";
import { authErrorMessage } from "@/data/authErrors";
import { formatPhone } from "@/data/format";
import { supabase } from "@/data/supabase";
import { useTheme } from "@/theme/ThemeProvider";

const CODE_LENGTH = 6;
// Supabase lets a number ask for a new code once every 60 seconds.
const RESEND_AFTER = 60;

export default function CodeSignIn() {
  const { colors } = useTheme();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function verify(token: string) {
    if (token.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    // On success the sign-in gate swaps these screens for the app, so there's nothing else to do.
    if (error) {
      setBusy(false);
      setCode("");
      setError(authErrorMessage(error));
    }
  }

  async function resend() {
    setError("");
    setWait(RESEND_AFTER);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) setError(authErrorMessage(error));
  }

  function onChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError("");
    verify(digits);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pb-8 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="-ml-2.5 h-11 w-11 items-center justify-center rounded-full"
        >
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>

        <Txt variant="display" accessibilityRole="header" className="mt-6 text-[28px] leading-[34px]">
          Enter the code
        </Txt>
        <Txt className="mt-2 text-ink-muted">
          We sent a 6-digit code by SMS to{" "}
          <Txt variant="number" className="text-[15px]">
            {formatPhone(phone)}
          </Txt>
        </Txt>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-1 min-h-[44px] justify-center self-start"
        >
          <Txt className="font-inter-semibold text-[14px] text-brand">Change number</Txt>
        </Pressable>

        {/* One real input under six boxes, so paste and SMS autofill fill the whole code at once. */}
        <View className="mt-5">
          <View className="flex-row gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <View
                key={i}
                className={cn(
                  "h-[60px] flex-1 items-center justify-center rounded-md border border-line bg-surface-200",
                  i === Math.min(code.length, CODE_LENGTH - 1) && !busy && "border-2 border-brand"
                )}
              >
                <Txt variant="stat" className="text-[24px] leading-[30px]">
                  {code[i] ?? ""}
                </Txt>
              </View>
            ))}
          </View>
          <TextInput
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            maxLength={CODE_LENGTH}
            editable={!busy}
            caretHidden
            accessibilityLabel="6-digit code"
            className="absolute inset-0 text-transparent opacity-0"
          />
        </View>

        {error ? (
          <Txt accessibilityRole="alert" className="mt-3 font-inter-medium text-[13px] text-due">
            {error}
          </Txt>
        ) : null}

        {wait > 0 ? (
          <Txt className="mt-4 text-[14px] text-ink-muted">
            Didn't get it? Resend in{" "}
            <Txt variant="number" className="text-ink">
              0:{String(wait).padStart(2, "0")}
            </Txt>
          </Txt>
        ) : (
          <Pressable accessibilityRole="button" onPress={resend} className="mt-2 min-h-[44px] justify-center self-start">
            <Txt className="font-inter-semibold text-[14px] text-brand">Send a new code</Txt>
          </Pressable>
        )}

        <View className="mt-auto pt-6">
          <Button
            title={busy ? "Checking..." : "Verify"}
            onPress={() => verify(code)}
            disabled={busy || code.length !== CODE_LENGTH}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
