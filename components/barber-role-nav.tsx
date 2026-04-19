import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type OwnerTab = "dashboard" | "agenda" | "barberos" | "servicios" | "mas";
type BarberTab = "agenda" | "historial" | "clientes" | "perfil";

type OwnerNavProps = {
  mode: "owner";
  current: OwnerTab;
};

type BarberNavProps = {
  mode: "barber";
  current: BarberTab;
};

type Props = OwnerNavProps | BarberNavProps;

export function BarberRoleNav(props: Props) {
  if (props.mode === "owner") {
    const tabs: Array<{
      key: OwnerTab;
      label: string;
      icon: keyof typeof MaterialIcons.glyphMap;
      route: string;
    }> = [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: "dashboard",
        route: "/barber/dashboard-owner",
      },
      {
        key: "agenda",
        label: "Agenda",
        icon: "event-note",
        route: "/barber/owner-agenda",
      },
      {
        key: "barberos",
        label: "Barberos",
        icon: "content-cut",
        route: "/barber/barbers-management",
      },
      {
        key: "servicios",
        label: "Servicios",
        icon: "design-services",
        route: "/barber/edit-service",
      },
      {
        key: "mas",
        label: "Mas",
        icon: "menu",
        route: "/barber/owner-more-settings",
      },
    ];

    return (
      <View style={styles.wrap}>
        {tabs.map((tab) => {
          const active = props.current === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.item}
              onPress={() => router.replace(tab.route)}
            >
              <MaterialIcons
                name={tab.icon}
                size={20}
                color={active ? "#d4af37" : "#7f7766"}
              />
              <Text style={active ? styles.textActive : styles.text}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const tabs: Array<{
    key: BarberTab;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route: string;
  }> = [
    {
      key: "agenda",
      label: "Agenda",
      icon: "event-note",
      route: "/barber/barber-my-agenda",
    },
    {
      key: "historial",
      label: "Historial",
      icon: "history",
      route: "/barber/barber-history",
    },
    {
      key: "clientes",
      label: "Clientes",
      icon: "groups",
      route: "/barber/clients-management",
    },
    {
      key: "perfil",
      label: "Perfil",
      icon: "person",
      route: "/barber/barber-profile",
    },
  ];

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = props.current === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.item}
            onPress={() => router.replace(tab.route)}
          >
            <MaterialIcons
              name={tab.icon}
              size={20}
              color={active ? "#d4af37" : "#7f7766"}
            />
            <Text style={active ? styles.textActive : styles.text}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 74,
    backgroundColor: "rgba(14,14,14,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(77,70,53,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 10,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  text: {
    color: "#7f7766",
    fontSize: 10,
    fontWeight: "600",
  },
  textActive: {
    color: "#d4af37",
    fontSize: 10,
    fontWeight: "800",
  },
});
