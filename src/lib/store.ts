import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Firmware, PathId, PlanFor, ReleaseId, RootState } from "@/lib/plan";

type Persisted = {
  step: number;
  planFor: PlanFor;
  root: RootState;
  dataCable: boolean;
  otgStick: boolean;
  release: ReleaseId;
  firmware: Firmware;
  override: PathId | null;
  brand: string;
  checks: Record<string, boolean>;
};

type WorkshopState = Persisted & {
  patch: (partial: Partial<Persisted>) => void;
  toggleCheck: (id: string) => void;
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useWorkshop = create<WorkshopState>()(
  persist(
    (set) => ({
      step: 0,
      planFor: "auto",
      root: "unsure",
      dataCable: true,
      otgStick: false,
      release: "win11",
      firmware: "uefi",
      override: null,
      brand: "dell",
      checks: {},
      patch: (partial) => set(partial),
      toggleCheck: (id) =>
        set((state) => ({
          checks: { ...state.checks, [id]: !state.checks[id] },
        })),
    }),
    {
      name: "sideboot",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        step: state.step,
        planFor: state.planFor,
        root: state.root,
        dataCable: state.dataCable,
        otgStick: state.otgStick,
        release: state.release,
        firmware: state.firmware,
        override: state.override,
        brand: state.brand,
        checks: state.checks,
      }),
    },
  ),
);
