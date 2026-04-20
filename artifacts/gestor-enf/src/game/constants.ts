export const TILE_SIZE = 32;
export const MAP_COLS = 76;
export const MAP_ROWS = 50;
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const CAMERA_ZOOM = 1.5;

export const TILE_ID = {
  GARDEN:     0,
  WALL:       1,
  CORRIDOR:   2,
  ICU:        3,
  PHARMACY:   4,
  ADMIN:      5,
  WARD:       6,
  BREAK:      7,
  NURSING:    8,
  RECEPTION:  9,
  EMERGENCY:  10,
  LAB:        11,
  RADIOLOGY:  12,
  CME:        13,
  MATERNITY:  14,
  ONCOLOGY:   15,
  REHAB:      16,
  OUTPATIENT: 17,
  PSYCH:      18,
} as const;

export const NUM_TILES = 19;

export type TileId = typeof TILE_ID[keyof typeof TILE_ID];

export const ROOM_FLOOR_COLORS: Record<number, number> = {
  [TILE_ID.GARDEN]:     0x5aa96a,
  [TILE_ID.WALL]:       0xd4cfc0,
  [TILE_ID.CORRIDOR]:   0xf0ebd8,
  [TILE_ID.ICU]:        0xaee8ee,
  [TILE_ID.PHARMACY]:   0xd8b4fe,
  [TILE_ID.ADMIN]:      0xfcd88a,
  [TILE_ID.WARD]:       0xddd4f4,
  [TILE_ID.BREAK]:      0xfde68a,
  [TILE_ID.NURSING]:    0xa7f3d0,
  [TILE_ID.RECEPTION]:  0xfef3c7,
  [TILE_ID.EMERGENCY]:  0xfca5a5,
  [TILE_ID.LAB]:        0xbfdbfe,
  [TILE_ID.RADIOLOGY]:  0xc7d2fe,
  [TILE_ID.CME]:        0xe2e8f0,
  [TILE_ID.MATERNITY]:  0xfecdd3,
  [TILE_ID.ONCOLOGY]:   0xd1fae5,
  [TILE_ID.REHAB]:      0xfef9c3,
  [TILE_ID.OUTPATIENT]: 0xe0f2fe,
  [TILE_ID.PSYCH]:      0xf3e8ff,
};

export const ROOM_NAMES: Record<number, string> = {
  [TILE_ID.ICU]:        'UTI Adulto',
  [TILE_ID.PHARMACY]:   'Farmácia Hospitalar',
  [TILE_ID.ADMIN]:      'Diretoria de Enfermagem',
  [TILE_ID.WARD]:       'Enfermaria Clínica',
  [TILE_ID.BREAK]:      'Copa & Nutrição',
  [TILE_ID.NURSING]:    'Posto de Enfermagem Central',
  [TILE_ID.RECEPTION]:  'Recepção / Triagem',
  [TILE_ID.EMERGENCY]:  'Pronto-Socorro',
  [TILE_ID.LAB]:        'Laboratório de Análises',
  [TILE_ID.RADIOLOGY]:  'Diagnóstico por Imagem',
  [TILE_ID.CME]:        'Central de Material Esterilizado',
  [TILE_ID.MATERNITY]:  'Maternidade / Banco de Leite',
  [TILE_ID.ONCOLOGY]:   'Oncologia / Hematologia',
  [TILE_ID.REHAB]:      'Reabilitação',
  [TILE_ID.OUTPATIENT]: 'Ambulatório',
  [TILE_ID.PSYCH]:      'Saúde Psicossocial',
  [TILE_ID.CORRIDOR]:   'Corredor',
  [TILE_ID.GARDEN]:     'Área Externa',
};

export const PLAYER_SPEED = 160;
export const PLAYER_SPRINT_SPEED = 260;
export const INTERACTION_DISTANCE = 56;
export const GAME_MINUTES_PER_SECOND = 3;
export const SHIFT_DURATION_MINUTES = 480;

export const CAREER_LEVELS = [
  { title: 'Estagiária',            minPrestige: 0    },
  { title: 'Técnica de Enfermagem', minPrestige: 100  },
  { title: 'Enfermeira',            minPrestige: 300  },
  { title: 'Enfermeira Sênior',     minPrestige: 600  },
  { title: 'Coordenadora',          minPrestige: 1000 },
  { title: 'Gerente de Enfermagem', minPrestige: 1500 },
  { title: 'Diretora de Cuidado',   minPrestige: 2200 },
];

export const SCENES = {
  BOOT:   'BootScene',
  MENU:   'MenuScene',
  GAME:   'GameScene',
  HUD:    'HUDScene',
  DIALOG: 'DialogScene',
} as const;

export const EVENTS = {
  HUD_UPDATE:        'hud-update',
  OPEN_DIALOG:       'open-dialog',
  CLOSE_DIALOG:      'close-dialog',
  MISSION_COMPLETE:  'mission-complete',
  INTERACTION_HINT:  'interaction-hint',
  ROOM_CHANGE:       'room-change',
  CRISIS_ALERT:      'crisis-alert',
  CRISIS_RESOLVED:   'crisis-resolved',
} as const;

export type Direction = 'up' | 'down' | 'left' | 'right';
