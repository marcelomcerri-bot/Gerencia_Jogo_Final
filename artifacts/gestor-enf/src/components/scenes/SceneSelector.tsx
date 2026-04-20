import React from "react";
import { type Category } from "@/data/cases";
import {
  Case001Scene, Case002Scene, Case003Scene, Case004Scene, Case005Scene,
  Case006Scene, Case007Scene, Case008Scene, Case009Scene, Case010Scene,
} from "./CaseScenes";
// Fallback category scenes
import { HospitalCorridorScene } from "./HospitalCorridorScene";
import { MeetingRoomScene } from "./MeetingRoomScene";
import { ICUScene } from "./ICUScene";
import { PlanningScene } from "./PlanningScene";
import { EthicsScene } from "./EthicsScene";
import { FinancialScene } from "./FinancialScene";

interface SceneSelectorProps {
  caseId?: string;
  category?: Category;
}

const CASE_SCENES: Record<string, () => React.ReactElement> = {
  "case-001": Case001Scene,
  "case-002": Case002Scene,
  "case-003": Case003Scene,
  "case-004": Case004Scene,
  "case-005": Case005Scene,
  "case-006": Case006Scene,
  "case-007": Case007Scene,
  "case-008": Case008Scene,
  "case-009": Case009Scene,
  "case-010": Case010Scene,
};

const CATEGORY_SCENES: Record<string, () => React.ReactElement> = {
  "recursos-humanos": HospitalCorridorScene,
  "lideranca": MeetingRoomScene,
  "qualidade": ICUScene,
  "planejamento": PlanningScene,
  "etica": EthicsScene,
  "financeiro": FinancialScene,
};

export function SceneSelector({ caseId, category }: SceneSelectorProps) {
  if (caseId && CASE_SCENES[caseId]) {
    const Scene = CASE_SCENES[caseId];
    return <Scene />;
  }
  if (category && CATEGORY_SCENES[category]) {
    const Scene = CATEGORY_SCENES[category];
    return <Scene />;
  }
  return <HospitalCorridorScene />;
}
