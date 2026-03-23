// theme.ts
import { StyleSheet } from "react-native";

export const colors = {
  bg:       "#11111a",
  card:     "#1a1a27",
  accent:   "#4affa0",
  accent2:  "#1e7a4e",
  danger:   "#ff5555",
  warning:  "#ffaa33",
  text:     "#f0f0f0",
  sub:      "#8888a0",
  inputBg:  "#22223a",
  border:   "#33334a",
  purple:   "#7777cc",
};

export const t = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.sub,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.sub,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
  successText: {
    color: colors.accent,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
});
