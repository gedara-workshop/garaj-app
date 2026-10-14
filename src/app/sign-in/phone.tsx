import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Txt } from "@/components/Txt";
import { authErrorMessage } from "@/data/authErrors";
import { toLkMobile } from "@/data/format";
import { supabase } from "@/data/supabase";
import { useTheme } from "@/theme/ThemeProvider";

export default function PhoneSignIn() {
  const { colors } = useTheme();
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function sendCode() {
    const phone = toLkMobile(number);
    if (!phone) return setError("Enter a mobile number, like 077 123 4567.");

    setError("");
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setSending(false);
    if (error) return setError(authErrorMessage(error));

    router.push({ pathname: "/sign-in/code", params: { phone } });
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
          Your phone number
        </Txt>
        <Txt className="mt-2 text-ink-muted">
          We'll text you a 6-digit code. New to Garaj? The same code sets up your account.
        </Txt>

        <View className="mt-7 flex-row gap-2">
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
            onSubmitEditing={sendCode}
            placeholder="77 123 4567"
            placeholderTextColor="#8a8f8c"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            autoFocus
            maxLength={16}
            accessibilityLabel="Mobile number"
            className="h-14 flex-1 rounded-md border border-line bg-surface-200 px-4 font-mono text-[18px] text-ink"
          />
        </View>

        {error ? (
          <Txt accessibilityRole="alert" className="mt-3 font-inter-medium text-[13px] text-due">
            {error}
          </Txt>
        ) : null}

        <View className="mt-auto pt-6">
          <Button title={sending ? "Sending code..." : "Send code"} onPress={sendCode} disabled={sending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
