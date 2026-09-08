import { create } from "zustand";
import {
    loadSettings,
    saveSettings,
    type PersistedSettings,
} from "@/utils/settingsStorage";

type SettingsState = Omit<PersistedSettings, "version">;

interface SettingsActions {
    setStrokeWidth: (value: number) => void;
    setStrokeColor: (value: string) => void;
    setStrokePattern: (value: "solid" | "dashed" | "dotted") => void;
    setFillColor: (value?: string) => void;
    setOpacity: (value: number) => void;
    setCornerRadius: (value: number) => void;
}

const initialState = loadSettings();

export const useSettingsStore = create<SettingsState & SettingsActions>(
    set => ({
        ...initialState,
        setStrokeWidth: value => set({ strokeWidth: value }),
        setStrokeColor: value => set({ strokeColor: value }),
        setStrokePattern: value => set({ strokePattern: value }),
        setFillColor: value => set({ fillColor: value ?? "transparent" }),
        setOpacity: value => set({ opacity: value }),
        setCornerRadius: value => set({ cornerRadius: value }),
    })
);

useSettingsStore.subscribe(state => {
    saveSettings(state);
});
