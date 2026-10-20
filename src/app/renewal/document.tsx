import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Txt } from "@/components/Txt";
import { useGarage } from "@/data/GarageProvider";
import { renewalLabel } from "@/data/rules";
import { useT } from "@/i18n";

/** Full-screen document copy, for showing at a checkpoint or an insurance office. */
export default function DocumentViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { renewals } = useGarage();
  const { t } = useT();
  const renewal = renewals.find((r) => r.id === id);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    // Black like a photo viewer in both themes, so the document is the only thing to look at.
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#000000" }}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("document.close")}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={24} color="#ffffff" />
        </Pressable>
        <Txt variant="heading" className="text-white">
          {renewal ? renewalLabel[renewal.kind] : t("document.title")}
        </Txt>
        <View className="w-11" />
      </View>
      {renewal?.document ? (
        <Image
          source={renewal.document}
          contentFit="contain"
          style={{ flex: 1 }}
          accessibilityLabel={t("document.title")}
        />
      ) : (
        <View className="flex-1" />
      )}
      <Txt variant="caption" className="px-4 py-3 text-center text-white/70">
        {t("document.note")}
      </Txt>
    </SafeAreaView>
  );
}
