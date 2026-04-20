export interface PlayerProgress {
  totalPoints: number;
  level: number;
  completedCases: string[];
  correctAnswers: number;
  totalAttempted: number;
  achievements: string[];
  currentStreak: number;
  maxStreak: number;
}

export const LEVELS = [
  { level: 1, title: "Estagiária", minPoints: 0, maxPoints: 199, description: "Iniciando a jornada gerencial" },
  { level: 2, title: "Técnica Sênior", minPoints: 200, maxPoints: 499, description: "Conhecendo os fundamentos" },
  { level: 3, title: "Enfermeira Assistencial", minPoints: 500, maxPoints: 899, description: "Aplicando os conhecimentos" },
  { level: 4, title: "Enfermeira Especialista", minPoints: 900, maxPoints: 1399, description: "Dominando a prática gerencial" },
  { level: 5, title: "Gestora de Referência", minPoints: 1400, maxPoints: 1999, description: "Liderando com excelência" },
  { level: 6, title: "Diretora de Enfermagem", minPoints: 2000, maxPoints: Infinity, description: "Mestre em Gerência de Enfermagem" },
];

export const ACHIEVEMENTS = [
  { id: "first-case", title: "Primeira Decisão", description: "Completou o primeiro caso", icon: "🎯" },
  { id: "perfect-score", title: "Decisão Perfeita", description: "Obteve 100 pontos em um caso", icon: "⭐" },
  { id: "streak-3", title: "Em Sequência", description: "3 respostas corretas seguidas", icon: "🔥" },
  { id: "streak-5", title: "Imparável", description: "5 respostas corretas seguidas", icon: "🚀" },
  { id: "all-categories", title: "Visão Integral", description: "Respondeu casos de todas as categorias", icon: "🌐" },
  { id: "halfway", title: "Na Metade", description: "Completou metade dos casos", icon: "🏃" },
  { id: "all-cases", title: "Gestora Completa", description: "Completou todos os casos", icon: "🏆" },
  { id: "level-up", title: "Evolução", description: "Subiu de nível", icon: "⬆️" },
];

export function getLevelForPoints(points: number) {
  return LEVELS.find((l) => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
}

export function getNextLevel(points: number) {
  const current = getLevelForPoints(points);
  return LEVELS[current.level] || null;
}

export const INITIAL_PROGRESS: PlayerProgress = {
  totalPoints: 0,
  level: 1,
  completedCases: [],
  correctAnswers: 0,
  totalAttempted: 0,
  achievements: [],
  currentStreak: 0,
  maxStreak: 0,
};

const STORAGE_KEY = "gestorEnf_progress";

export function loadProgress(): PlayerProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_PROGRESS;
}

export function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
