import { useStore } from "@xyflow/react";

export function useFlowZoom(): number {
  return useStore((s) => s.transform[2]);
}
