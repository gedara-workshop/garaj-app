import { TextInput, View } from "react-native";
import { useT } from "@/i18n";
import { cn } from "./cn";
import { Txt } from "./Txt";

export const CODE_LENGTH = 6;

/** Six boxes over one real input, so paste and SMS autofill fill the whole code at once. */
export function CodeInput({
  value,
  onChange,
  busy = false,
}: {
  value: string;
  /** Gets digits only, at most six. */
  onChange: (digits: string) => void;
  busy?: boolean;
}) {
  const { t } = useT();
  return (
    <View>
      <View className="flex-row gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            className={cn(
              "h-[60px] flex-1 items-center justify-center rounded-md border border-line bg-surface-200",
              i === Math.min(value.length, CODE_LENGTH - 1) && !busy && "border-2 border-brand"
            )}
          >
            <Txt variant="stat" className="text-[24px] leading-[30px]">
              {value[i] ?? ""}
            </Txt>
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        maxLength={CODE_LENGTH}
        editable={!busy}
        caretHidden
        accessibilityLabel={t("signIn.codeLabel")}
        className="absolute inset-0 text-transparent opacity-0"
      />
    </View>
  );
}
