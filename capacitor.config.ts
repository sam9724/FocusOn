import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "org.onethingfocus.app",
  appName: "One Thing Focus",
  webDir: "dist",
  server: { androidScheme: "https" },
  plugins: {
    LocalNotifications: { smallIcon: "ic_stat_focus", iconColor: "#305b49" },
  },
};
export default config;
