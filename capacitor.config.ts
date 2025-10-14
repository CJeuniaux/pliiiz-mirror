import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a1fb286c2fe048369fffdce422f3e4bb',
  appName: 'PLIIIZ - Partage de préférences cadeaux',
  webDir: 'dist',
  server: {
    url: 'https://a1fb286c-2fe0-4836-9fff-dce422f3e4bb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  }
};

export default config;