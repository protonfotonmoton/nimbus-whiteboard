"use client";

import { useState, useEffect } from "react";

export type DeviceClass = "phone" | "tablet" | "desktop";

export function useDevice(): DeviceClass {
  const [device, setDevice] = useState<DeviceClass>("desktop");

  useEffect(() => {
    function detect() {
      const w = window.innerWidth;
      if (w < 640) return "phone";
      if (w < 1024) return "tablet";
      return "desktop";
    }

    setDevice(detect());

    function handleResize() {
      setDevice(detect());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return device;
}
