import { Image } from "expo-image";
import { router } from "expo-router";
import { Bell, Camera, ChartLine, Smartphone, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Txt } from "@/components/Txt";
import { useTheme } from "@/theme/ThemeProvider";

const features: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bell,
    title: "Never miss a renewal",
    body: "Revenue license, insurance and emission test, reminded before they expire.",
  },
  {
    icon: Camera,
    title: "Snap a bill, we fill it in",
    body: "Service, fuel and repairs logged from a photo. You just check and save.",
  },
  {
    icon: ChartLine,
    title: "Know what each vehicle costs",
    body: "Monthly spend and cost per km, for one car or the whole family's.",
  },
];

export default function Welcome() {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-surface-100">
      <View className="flex-1 px-6 pb-8 pt-10">
        <Image
          source={require("../../assets/icon.png")}
          accessibilityLabel="Garaj"
          style={{ width: 56, height: 56, borderRadius: 14 }}
        />

        <Txt variant="display" accessibilityRole="header" className="mt-8">
          Every vehicle, every renewal, one place.
        </Txt>

        <View className="mt-8 gap-5">
          {features.map(({ icon: Icon, title, body }) => (
            <View key={title} className="flex-row items-start gap-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-md bg-brand-tint">
                <Icon size={22} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Txt className="font-inter-semibold">{title}</Txt>
                <Txt variant="label" className="font-inter text-ink-muted">
                  {body}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto gap-3 pt-8">
          <Button title="Continue with phone number" icon={Smartphone} onPress={() => router.push("/sign-in/phone")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
