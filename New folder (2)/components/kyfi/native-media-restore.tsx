"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  getActiveNativePicker,
  storePendingNativePhoto,
} from "@/lib/native-media-return";

export function NativeMediaRestore() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let removeListener: (() => Promise<void>) | undefined;

    void App.addListener("appRestoredResult", (event) => {
      if (event.pluginId !== "Camera" || event.methodName !== "getPhoto") {
        return;
      }

      const pickerId = getActiveNativePicker();
      if (!pickerId) {
        return;
      }

      storePendingNativePhoto(pickerId, event.data);
    }).then((listener) => {
      removeListener = () => listener.remove();
    });

    return () => {
      void removeListener?.();
    };
  }, []);

  return null;
}
