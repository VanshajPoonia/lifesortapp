import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.kreativvantage.lifesort",
  appName: "LifeSort",
  webDir: "capacitor-www",
  server: {
    url: "https://lifesort.vercel.app",
    cleartext: false,
  },
  ios: {
    scheme: "LifeSort",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#8b5cf6",
      showSpinner: false,
    },
  },
}

export default config
