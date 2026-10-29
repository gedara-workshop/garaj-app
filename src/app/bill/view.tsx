import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Txt } from "@/components/Txt";
import { signBill } from "@/data/photos";
import { useT } from "@/i18n";

/** Full-screen bill photo for an entry read with Snap a bill (?path= is the object path). */
export default function BillViewer() {
  const { path } = useLocalSearchParams<{ path: string }>();
  const { t } = useT();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  // Signed links last a day, so keep one for an hour rather than signing on every open.
  const link = useQuery({
    queryKey: ["bill-link", path],
    queryFn: () => signBill(path!),
    enabled: !!path,
    staleTime: 60 * 60 * 1000,
  });

  return (
    // Black like a photo viewer in both themes, so the bill is the only thing to look at.
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#000000" }}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("billView.close")}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <X size={24} color="#ffffff" />
        </Pressable>
        <Txt variant="heading" className="text-white">
          {t("billView.title")}
        </Txt>
        <View className="w-11" />
      </View>

      {link.data ? (
        <Image
          source={{ uri: link.data, cacheKey: path }}
          contentFit="contain"
          style={{ flex: 1 }}
          accessibilityLabel={t("billView.title")}
        />
      ) : link.isError || !path ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Txt className="text-center text-white">{t("billView.couldntLoad")}</Txt>
          {path ? <Button title={t("common.tryAgain")} kind="secondary" onPress={() => link.refetch()} /> : null}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ffffff" />
        </View>
      )}
    </SafeAreaView>
  );
}
