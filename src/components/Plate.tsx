import { Text, View } from "react-native";

/** Number plate chip: light ground, black mono characters, in both themes, like a real plate. */
export function Plate({ province, plate, small = false }: { province?: string; plate: string; small?: boolean }) {
  return (
    <View
      className={`flex-row items-center self-start rounded-[6px] border-[1.5px] border-plate-ink bg-plate-bg ${
        small ? "h-[22px] px-1.5" : "h-[26px] px-2"
      }`}
    >
      {province ? (
        <Text className="mr-1.5 border-r border-plate-ink pr-1.5 font-mono text-[10px] text-plate-ink">
          {province}
        </Text>
      ) : null}
      <Text className={`font-mono-bold tracking-wide text-plate-ink ${small ? "text-[12px]" : "text-[14px]"}`}>
        {plate}
      </Text>
    </View>
  );
}
