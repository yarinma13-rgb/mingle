"use client";

import { createContext, useContext } from "react";
import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoPlaybackState = {
  sceneId: DemoSceneId;
  elapsedMs: number;
  playing: boolean;
  reducedMotion: boolean;
};

const DemoPlaybackContext = createContext<DemoPlaybackState>({
  sceneId: "opening",
  elapsedMs: 0,
  playing: false,
  reducedMotion: false,
});

export function DemoPlaybackProvider({
  value,
  children,
}: {
  value: DemoPlaybackState;
  children: React.ReactNode;
}) {
  return (
    <DemoPlaybackContext.Provider value={value}>
      {children}
    </DemoPlaybackContext.Provider>
  );
}

export function useDemoPlayback(): DemoPlaybackState {
  return useContext(DemoPlaybackContext);
}
