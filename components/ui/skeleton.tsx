import { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    type StyleProp,
    type ViewStyle
} from "react-native";

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

export function Skeleton({ style, borderRadius = 10 }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <Animated.View
      style={[styles.base, { borderRadius, opacity: pulse }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#2c2b29",
  },
});
