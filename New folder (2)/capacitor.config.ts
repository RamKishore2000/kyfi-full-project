import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kyfi.dealerui",
  appName: "KYFI",
  webDir: "out",
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#F8F7F4",
    },
  },
};

export default config;
