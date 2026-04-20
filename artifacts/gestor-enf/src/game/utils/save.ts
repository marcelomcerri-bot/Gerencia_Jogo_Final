import type { GameState } from '../data/gameData';

const SAVE_KEY = 'gestorEnf_huap_v3';

export const DEFAULT_STATE: GameState = {
  prestige: 0,
  energy: 100,
  stress: 0,
  completedMissions: [],
  missionProgress: {},
  relationships: {},
  gameTime: 480,
  day: 1,
  crisisCount: 0,
  decisionLog: [],
  unlockedSectors: ['RECEPTION', 'CORRIDOR', 'EMERGENCY', 'PHARMACY'],
};

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (_) {}
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch (_) {
    return { ...DEFAULT_STATE };
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
