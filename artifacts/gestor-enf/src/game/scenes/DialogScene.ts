import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../constants';
import type { DialogueDef, GameState, NPCDef } from '../data/gameData';
import { MISSIONS } from '../data/gameData';
import { playSound } from '../utils/audio';

const BOX_H = 200;
const BOX_Y = GAME_HEIGHT - BOX_H - 24;
const CHAR_INTERVAL = 22;

interface DialogData {
  npcDef: NPCDef;
  dialogue: DialogueDef;
  state: GameState;
  onClose: (s: Partial<GameState>) => void;
}

export class DialogScene extends Phaser.Scene {
  private boxContainer!: Phaser.GameObjects.Container;
  private choiceArea!: Phaser.GameObjects.Container;
  private bodyText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private npcDef!: NPCDef;
  private dialogue!: DialogueDef;
  private state!: GameState;
  private lines: string[] = [];
  private lineIdx = 0;
  private charIdx = 0;
  private charTimer = 0;
  private isTyping = false;
  private showingChoices = false;
  private overlay!: Phaser.GameObjects.Rectangle;
  private onClose!: (s: Partial<GameState>) => void;

  constructor() { super({ key: SCENES.DIALOG, active: false }); }

  init(data: DialogData) {
    this.npcDef = data.npcDef;
    this.dialogue = data.dialogue;
    this.state = { ...data.state };
    this.onClose = data.onClose;
    this.lines = [...data.dialogue.text];
    this.lineIdx = 0;
    this.charIdx = 0;
    this.isTyping = false;
    this.showingChoices = false;
    this.choiceButtons = [];
  }

  create() {
    // Dimmer overlay
    this.overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45);

    const W = GAME_WIDTH - 60;
    const boxX = GAME_WIDTH / 2, boxY = BOX_Y + BOX_H / 2;

    this.boxContainer = this.add.container(0, 0);

    // ── Shadow + main box
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(boxX - W / 2 + 8, boxY - BOX_H / 2 + 8, W, BOX_H, 20);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1f35, 1);
    bg.fillRoundedRect(boxX - W / 2, boxY - BOX_H / 2, W, BOX_H, 20);

    // Header accent
    const header = this.add.graphics();
    header.fillStyle(0x152840, 1);
    header.fillRoundedRect(boxX - W / 2, boxY - BOX_H / 2, W, 42, { tl: 20, tr: 20, bl: 0, br: 0 });

    // Border
    const border = this.add.graphics();
    border.lineStyle(3, 0x1abc9c, 1);
    border.strokeRoundedRect(boxX - W / 2, boxY - BOX_H / 2, W, BOX_H, 20);
    // Accent line under header
    border.lineStyle(2, 0x1abc9c, 0.4);
    border.lineBetween(boxX - W / 2 + 20, boxY - BOX_H / 2 + 42, boxX + W / 2 - 20, boxY - BOX_H / 2 + 42);

    // ── Portrait
    const pSize = 72;
    const px = boxX - W / 2 + 46;
    const py = boxY;

    const pBg = this.add.graphics();
    pBg.fillStyle(0x152840, 1);
    pBg.fillRoundedRect(px - pSize / 2 - 4, py - pSize / 2 - 4, pSize + 8, pSize + 8, 12);
    pBg.lineStyle(2, 0x1abc9c, 0.8);
    pBg.strokeRoundedRect(px - pSize / 2 - 4, py - pSize / 2 - 4, pSize + 8, pSize + 8, 12);

    const portrait = this.add.image(px, py, 'portrait_' + this.npcDef.id).setDisplaySize(pSize, pSize);

    // ── Name tag in header
    const nameX = boxX - W / 2 + 106;
    const nameY = boxY - BOX_H / 2 + 21;

    const roleColors: Record<string, string> = {
      doctor: '#3498db', nurse: '#2ecc71', technician: '#9b59b6',
      admin: '#f39c12', receptionist: '#1abc9c', other: '#bdc3c7',
    };
    const roleColor = roleColors[this.npcDef.role] || '#ffffff';

    const nameTxt = this.add.text(nameX, nameY, this.npcDef.name, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: roleColor,
    }).setOrigin(0, 0.5);

    const titleTxt = this.add.text(nameX + nameTxt.width + 16, nameY, `· ${this.npcDef.title}`, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#7f8c8d',
    }).setOrigin(0, 0.5);

    // Close hint
    const closeHint = this.add.text(boxX + W / 2 - 16, nameY, '[ESC] Fechar', {
      fontFamily: 'monospace', fontSize: '9px', color: '#7f8c8d',
    }).setOrigin(1, 0.5);

    // ── Body text
    const textX = nameX;
    const textY = boxY - BOX_H / 2 + 56;
    const textMaxW = W - 160;

    this.bodyText = this.add.text(textX, textY, '', {
      fontFamily: "'VT323', monospace",
      fontSize: '26px',
      color: '#ecf0f1',
      wordWrap: { width: textMaxW },
      lineSpacing: 4,
    });

    // Cursor
    this.cursor = this.add.text(0, 0, '▼', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '10px',
      color: '#1abc9c',
    }).setVisible(false);
    this.tweens.add({ targets: this.cursor, alpha: 0, duration: 350, yoyo: true, repeat: -1 });

    this.boxContainer.add([shadow, bg, header, border, pBg, portrait, nameTxt, titleTxt, closeHint, this.bodyText, this.cursor]);

    // Choice area (rendered separately, on top)
    this.choiceArea = this.add.container(0, 0).setDepth(10);

    // Input
    this.input.keyboard?.on('keydown-E', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-ESC', this.handleEsc, this);
    this.input.on('pointerdown', this.handleAdvance, this);

    // Animate in
    this.boxContainer.setAlpha(0).setY(30);
    this.tweens.add({ targets: this.boxContainer, alpha: 1, y: 0, duration: 300, ease: 'Back.easeOut' });

    this.startLine(0);
  }

  private startLine(idx: number) {
    this.lineIdx = idx;
    this.charIdx = 0;
    this.charTimer = 0;
    this.isTyping = true;
    this.bodyText.setText('');
    this.cursor.setVisible(false);
    this.showingChoices = false;
  }

  update(_t: number, delta: number) {
    if (!this.isTyping) {
      if (!this.showingChoices && this.cursor.visible) {
        const bRect = this.bodyText.getBounds();
        this.cursor.setPosition(bRect.right + 4, bRect.bottom - 14);
      }
      return;
    }
    if (this.lineIdx >= this.lines.length) return;

    this.charTimer += delta;
    const currentLine = this.lines[this.lineIdx];

    while (this.charTimer >= CHAR_INTERVAL && this.charIdx <= currentLine.length) {
      this.charTimer -= CHAR_INTERVAL;
      this.bodyText.setText(currentLine.substring(0, this.charIdx));
      this.charIdx++;
    }

    const bRect = this.bodyText.getBounds();
    this.cursor.setPosition(bRect.right + 4, bRect.bottom - 14);
    this.cursor.setVisible(true);

    if (this.charIdx > currentLine.length) {
      this.isTyping = false;
      this.bodyText.setText(currentLine);

      if (this.lineIdx >= this.lines.length - 1) {
        this.cursor.setVisible(false);
        this.time.delayedCall(180, () => this.showChoices());
      }
    }
  }

  private handleAdvance() {
    if (this.showingChoices) return;

    if (this.isTyping) {
      this.bodyText.setText(this.lines[this.lineIdx]);
      this.charIdx = this.lines[this.lineIdx].length + 1;
      this.isTyping = false;
      if (this.lineIdx >= this.lines.length - 1) {
        this.cursor.setVisible(false);
        this.time.delayedCall(180, () => this.showChoices());
      } else {
        this.cursor.setVisible(true);
      }
      return;
    }

    if (this.lineIdx < this.lines.length - 1) {
      this.startLine(this.lineIdx + 1);
    }
  }

  private handleEsc() {
    if (this.showingChoices) {
      this.selectChoice(this.dialogue.choices.length - 1);
    }
  }

  private showChoices() {
    this.showingChoices = true;
    this.cursor.setVisible(false);

    const choices = this.dialogue.choices;
    const choiceY = BOX_Y - 16;
    const btnH = 52;
    const gap = 8;

    choices.forEach((choice, i) => {
      const btnW = (GAME_WIDTH - 80) / choices.length - gap;
      const bx = 40 + i * (btnW + gap) + btnW / 2;
      const by = choiceY - i * 0;
      const cy = choiceY - (choices.length - 1 - i) * (btnH + gap);

      const cont = this.add.container(bx, cy);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x0d1f35, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      btnBg.lineStyle(2, 0x1abc9c, 1);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);

      const numTxt = this.add.text(-btnW / 2 + 14, 0, `${i + 1}.`, {
        fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#f39c12',
      }).setOrigin(0, 0.5);

      const choiceTxt = this.add.text(-btnW / 2 + 36, 0, choice.text, {
        fontFamily: "'VT323', monospace",
        fontSize: '21px',
        color: '#ecf0f1',
        wordWrap: { width: btnW - 50 },
      }).setOrigin(0, 0.5);

      // Tooltip
      if (choice.tooltip) {
        const tip = this.add.text(btnW / 2 - 12, -btnH / 2 + 8, `💡 ${choice.tooltip}`, {
          fontFamily: 'monospace', fontSize: '8px', color: '#7f8c8d',
          wordWrap: { width: btnW / 2 },
        }).setOrigin(1, 0);
      }

      const zone = this.add.zone(-btnW / 2, -btnH / 2, btnW, btnH).setOrigin(0).setInteractive({ cursor: 'pointer' });

      zone.on('pointerover', () => {
        playSound('hover');
        btnBg.clear();
        btnBg.fillStyle(0x1e3a5f, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        btnBg.lineStyle(3, 0xf1c40f, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        choiceTxt.setColor('#ffffff');
      });
      zone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x0d1f35, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        btnBg.lineStyle(2, 0x1abc9c, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
        choiceTxt.setColor('#ecf0f1');
      });
      zone.on('pointerdown', () => { playSound('click'); this.selectChoice(i); });
      this.input.keyboard?.once(`keydown-${i + 1}`, () => { playSound('click'); this.selectChoice(i); });

      cont.add([btnBg, numTxt, choiceTxt, zone]);
      cont.setAlpha(0).setY(cy + 16);
      this.tweens.add({ targets: cont, alpha: 1, y: cy, duration: 200, delay: i * 70, ease: 'Back.easeOut' });

      this.choiceArea.add(cont);
      this.choiceButtons.push(cont);
    });
  }

  private selectChoice(idx: number) {
    const choice = this.dialogue.choices[idx];
    let stateUpdate: Partial<GameState> = {};

    if (choice.effect) {
      stateUpdate = choice.effect(this.state);
    }

    if (choice.missionEffect) {
      const [missionId, actionType] = choice.missionEffect.split(':');
      const progress = { ...this.state.missionProgress };
      const completed = [...this.state.completedMissions];

      if (actionType === 'start') {
        progress[missionId] = 1;
      } else if (actionType?.startsWith('step')) {
        progress[missionId] = parseInt(actionType.replace('step', ''), 10);
      } else if (actionType === 'complete') {
        const mission = MISSIONS.find(m => m.id === missionId);
        if (mission && !completed.includes(missionId)) {
          completed.push(missionId);
          const basePrestige = stateUpdate.prestige ?? this.state.prestige;
          stateUpdate.prestige = basePrestige + mission.prestige;
          this.showPedagogyNote(mission.title, mission.pedagogy, mission.pedagogyRef, mission.prestige);
        }
      }

      stateUpdate.missionProgress = progress;
      stateUpdate.completedMissions = completed;
    }

    // Update relationship
    const rel = { ...this.state.relationships };
    rel[this.npcDef.id] = (rel[this.npcDef.id] ?? 0) + 1;
    stateUpdate.relationships = rel;

    // Show feedback line instead of instantly closing
    this.showingChoices = false;
    this.choiceArea.removeAll(true);
    this.choiceButtons = [];
    
    // Choose appropriate feedback line — role-aware so it never feels generic
    const isMission = !!choice.missionEffect;
    const actionType = choice.missionEffect ? choice.missionEffect.split(':')[1] : null;
    const role = (this.npcDef as any).role as string | undefined;

    const fallbackByRole: Record<string, { start: string[]; complete: string[]; idle: string[] }> = {
      doctor: {
        start: ['Conto com a sua liderança, enfermeira.', 'Ótima decisão clínica. Vamos alinhar com a equipe médica.'],
        complete: ['Excelente desfecho — protocolo conduzido com rigor técnico.', 'Resultado bem documentado. A equipe médica agradece.'],
        idle: ['Combinado. Qualquer intercorrência, me chame.', 'Perfeito, sigo confiante no plantão.'],
      },
      nurse: {
        start: ['Vou repassar para a equipe na próxima passagem de plantão.', 'Combinado! Já registro no livro de ocorrências.'],
        complete: ['Atividade concluída e anotada na evolução de enfermagem.', 'Pronto. Equipe alinhada e processo padronizado.'],
        idle: ['Combinado, gerente.', 'Qualquer coisa, eu sinalizo no posto.'],
      },
      technician: {
        start: ['Pode deixar comigo — vou alinhar com a CME.', 'Vou cuidar disso ainda neste turno.'],
        complete: ['Tudo certo, processo padronizado conforme RDC.', 'Material liberado dentro da norma. Obrigado!'],
        idle: ['Tudo certo por aqui.', 'Posso seguir com as rotinas então.'],
      },
      admin: {
        start: ['Excelente. Vou formalizar isso na próxima reunião do colegiado.', 'Ótimo, registro em ata e acompanho o indicador.'],
        complete: ['Resultado registrado nos indicadores institucionais.', 'Decisão alinhada à governança hospitalar. Bom trabalho.'],
        idle: ['Combinado.', 'Mantenha-me informada do progresso.'],
      },
      receptionist: {
        start: ['Anotei aqui na recepção, vou acompanhar.', 'Pode deixar! Já encaminho conforme o fluxo.'],
        complete: ['Pronto, fluxo de atendimento ajustado.', 'Tudo registrado no sistema do HUAP.'],
        idle: ['Combinado.', 'Qualquer dúvida, é só chamar aqui na recepção.'],
      },
      other: {
        start: ['Obrigada pela atenção, gerente.', 'Fico mais tranquila sabendo que vai resolver.'],
        complete: ['Muito obrigada por tudo!', 'Faz diferença ter alguém atento ao nosso cuidado.'],
        idle: ['Tá bem, obrigada.', 'Bom dia, viu?'],
      },
    };

    const bucket = fallbackByRole[role || 'other'] || fallbackByRole.other;
    const pool = isMission
      ? (actionType === 'complete' ? bucket.complete : bucket.start)
      : bucket.idle;
    const pickFromPool = pool[Math.floor(Math.random() * pool.length)];

    let feedbackText = (choice as any).feedback || pickFromPool;

    this.lines = [feedbackText];
    this.startLine(0);
    
    // Wait for the feedback reading, then when E/Space is pressed again, it will end the dialog
    // We override how the end of the line works for this special phase
    
    this.handleAdvance = () => {
      if (this.isTyping) {
        this.bodyText.setText(this.lines[this.lineIdx]);
        this.charIdx = this.lines[this.lineIdx].length + 1;
        this.isTyping = false;
        this.cursor.setVisible(true);
      } else {
        // Actually close
        this.closeDialog(stateUpdate);
      }
    };

    this.input.keyboard?.off('keydown-E');
    this.input.keyboard?.off('keydown-SPACE');
    this.input.keyboard?.off('keydown-ESC');
    this.input.off('pointerdown');
    
    this.input.keyboard?.on('keydown-E', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.on('keydown-ESC', () => this.closeDialog(stateUpdate), this);
    this.input.on('pointerdown', this.handleAdvance, this);

  }

  private showPedagogyNote(missionTitle: string, pedagogy: string, pedagogyRef: string, pts: number) {
    playSound('success');
    const W = 680, H = 160;
    const c = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110).setDepth(200);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-W / 2 + 8, -H / 2 + 8, W, H, 16);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a2015, 1);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 16);
    bg.lineStyle(4, 0x2ecc71, 1);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 16);

    // Gold star header
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x1a4030, 1);
    headerBg.fillRoundedRect(-W / 2, -H / 2, W, 36, { tl: 16, tr: 16, bl: 0, br: 0 });

    const icon = this.add.text(-W / 2 + 20, -H / 2 + 18, '🎓', { fontSize: '20px' }).setOrigin(0, 0.5);
    const titleTxt = this.add.text(-W / 2 + 50, -H / 2 + 18,
      `MISSÃO CONCLUÍDA: ${missionTitle}  (+${pts} pts)`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '10px',
        color: '#2ecc71',
      }).setOrigin(0, 0.5);

    const bodyTxt = this.add.text(-W / 2 + 20, -H / 2 + 52, pedagogy, {
      fontFamily: "'VT323', monospace",
      fontSize: '20px',
      color: '#ecf0f1',
      wordWrap: { width: W - 40 },
    }).setOrigin(0, 0);

    const refTxt = this.add.text(-W / 2 + 20, H / 2 - 22, `📚 ${pedagogyRef}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#27ae60',
    }).setOrigin(0, 1);

    c.add([shadow, bg, headerBg, icon, titleTxt, bodyTxt, refTxt]);
    c.setScale(0.85).setAlpha(0);

    this.tweens.add({
      targets: c, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: c, alpha: 0, y: '-=20', duration: 500, delay: 5000,
          onComplete: () => c.destroy(),
        });
      },
    });
  }

  private closeDialog(stateUpdate: Partial<GameState>) {
    this.input.keyboard?.off('keydown-E', this.handleAdvance, this);
    this.input.keyboard?.off('keydown-SPACE', this.handleAdvance, this);
    this.input.keyboard?.off('keydown-ESC', this.handleEsc, this);
    this.input.off('pointerdown', this.handleAdvance, this);

    this.tweens.add({
      targets: [this.boxContainer, this.overlay, this.choiceArea],
      alpha: 0, y: '+=16', duration: 220,
      onComplete: () => {
        this.scene.stop();
        this.onClose(stateUpdate);
      },
    });
  }
}
