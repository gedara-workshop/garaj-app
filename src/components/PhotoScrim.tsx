import { View } from "react-native";

/**
 * Bottom-to-top darkening over vehicle photos so white text stays readable on any photo.
 * Built from stacked translucent bands to avoid adding a gradient native module.
 */
export function PhotoScrim({ height = 96 }: { height?: number }) {
  const bands = 8;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height }}>
      {Array.from({ length: bands }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(0,0,0,${((i + 1) / bands) * 0.62})` }} />
      ))}
    </View>
  );
}
