/**
 * Challenge generator for Flash ID verification methods.
 * TypeScript equivalent of the PHP FlashID_Challenge class.
 */

export interface ChallengeData {
  method: string;
  target?: string;
  grid?: string[];
  targets?: string[];
  sequence?: number[];
  phrase?: string;
  pattern?: number[][];
  sound_id?: string;
  choices?: string[];
  correct_index?: number;
  code?: string;
  shape_template?: string;
}

// --- Data Pools ---

const EMOJIS = [
  '🍎','🍊','🍋','🍇','🍉','🍓','🍑','🍒','🥑','🌽',
  '🌶️','🍄','🌻','🌸','🌺','🦋','🐝','🌙','⭐','🔥',
  '💎','🎯','🎨','🎪','🎭','🎸','🎺','🎲','🎮','🏆',
];

const WORDS = [
  'ocean','bridge','castle','dragon','flame','garden','harbor','island',
  'jungle','knight','lantern','mountain','nebula','orchard','palace',
  'quartz','river','summit','temple','umbrella','violet','whisper',
  'crystal','diamond','eagle','falcon','glacier','horizon','ivory','jasper',
];

const ICONS = [
  '⚡','🔔','📌','🔑','🛡️','⚙️','💡','🔒','📎','✏️',
  '📐','🧲','🔧','⏰','📷','🎵','💬','📊','🌐','🔍',
  '🏠','📁','🗂️','📋','🖊️','📮','🧭','🔗','⚓','🎈',
];

const COLORS = [
  'red','blue','green','yellow','purple','orange',
  'pink','cyan','brown','gray','teal','lime','indigo',
];

const SHAPES = ['●','■','▲','◆','★','⬟','⬠','♥','→','✚'];

const FLAGS = [
  '🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇯🇵','🇧🇷','🇨🇦','🇦🇺',
  '🇮🇹','🇪🇸','🇲🇽','🇰🇷','🇮🇳','🇨🇳','🇷🇺','🇸🇦',
  '🇿🇦','🇳🇬','🇪🇬','🇹🇷','🇦🇷','🇨🇴','🇸🇪','🇳🇴',
  '🇨🇭','🇳🇱','🇧🇪','🇵🇹','🇵🇱','🇹🇭',
];

const ANIMALS = [
  { id: 'dog', emoji: '🐶' }, { id: 'cat', emoji: '🐱' },
  { id: 'cow', emoji: '🐮' }, { id: 'lion', emoji: '🦁' },
  { id: 'bird', emoji: '🐦' }, { id: 'frog', emoji: '🐸' },
  { id: 'horse', emoji: '🐴' }, { id: 'elephant', emoji: '🐘' },
  { id: 'monkey', emoji: '🐵' }, { id: 'pig', emoji: '🐷' },
  { id: 'duck', emoji: '🦆' }, { id: 'wolf', emoji: '🐺' },
  { id: 'rooster', emoji: '🐓' }, { id: 'owl', emoji: '🦉' },
  { id: 'bear', emoji: '🐻' },
];

const PHRASES = [
  'Blue Tiger Seven', 'Open the green door', 'Mountain river sunset',
  'Crystal falcon nine', 'Silver bridge echo', 'Purple ocean thunder',
  'Golden eagle sunrise', 'Frozen harbor twelve', 'Diamond castle north',
  'Amber whisper five', 'Crimson island west', 'Emerald knight echo',
  'Sapphire garden four', 'Ivory summit dawn', 'Copper lantern eight',
  'Scarlet temple rain', 'Bronze horizon south', 'Jade palace three',
  'Ruby crystal moon', 'Onyx dragon fire',
];

const SHAPE_TEMPLATES = [
  'circle', 'triangle', 'square', 'star', 'zigzag',
  'line_h', 'line_v', 'checkmark',
];

export const ALL_METHODS = [
  'type_code', 'select_code', 'voice_phrase', 'emoji_match',
  'number_sequence', 'word_match', 'icon_match', 'color_match',
  'shape_match', 'tap_pattern', 'flag_match', 'shake_verify',
  'draw_match', 'animal_sound',
];

// --- Helpers ---

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Generators ---

function generateGridMatch(pool: string[], method: string): ChallengeData {
  const items = shuffle(pickN(pool, 4));
  const target = items[0];
  const choices = shuffle([...items]);
  return { method, target, choices, correct_index: choices.indexOf(target) };
}

function generateNumberSequence(): ChallengeData {
  const numbers = shuffle([1,2,3,4,5,6,7,8,9]);
  const grid = numbers.map(String);
  const indices = pickN([0,1,2,3,4,5,6,7,8], 3).sort((a,b) => a-b);
  return { method: 'number_sequence', grid, sequence: indices };
}

function generateTypeCode(): ChallengeData {
  const code = String(randomInt(0, 999999)).padStart(6, '0');
  return { method: 'type_code', code };
}

function generateSelectCode(): ChallengeData {
  const correct = String(randomInt(0, 999999)).padStart(6, '0');
  const choices = [correct];
  while (choices.length < 4) {
    const decoy = String(randomInt(0, 999999)).padStart(6, '0');
    if (!choices.includes(decoy)) choices.push(decoy);
  }
  const shuffled = shuffle(choices);
  return {
    method: 'select_code',
    code: correct,
    choices: shuffled,
    correct_index: shuffled.indexOf(correct),
  };
}

function generateVoicePhrase(): ChallengeData {
  return { method: 'voice_phrase', phrase: PHRASES[randomInt(0, PHRASES.length - 1)] };
}

function generateTapPattern(): ChallengeData {
  const pattern: number[][] = [];
  const used = new Set<string>();
  const count = randomInt(3, 5);
  while (pattern.length < count) {
    const cell = [randomInt(0, 2), randomInt(0, 2)];
    const key = `${cell[0]},${cell[1]}`;
    if (!used.has(key)) {
      pattern.push(cell);
      used.add(key);
    }
  }
  return { method: 'tap_pattern', pattern };
}

function generateDrawMatch(): ChallengeData {
  return {
    method: 'draw_match',
    shape_template: SHAPE_TEMPLATES[randomInt(0, SHAPE_TEMPLATES.length - 1)],
  };
}

function generateAnimalSound(): ChallengeData {
  const correctIdx = randomInt(0, ANIMALS.length - 1);
  const correct = ANIMALS[correctIdx];
  const others = ANIMALS.filter((_, i) => i !== correctIdx);
  const gridAnimals = [correct.emoji, ...pickN(others, 5).map(a => a.emoji)];
  return {
    method: 'animal_sound',
    sound_id: correct.id,
    grid: shuffle(gridAnimals),
    targets: [correct.emoji],
  };
}

// --- Main Generator ---

export function generateChallenge(method: string): ChallengeData {
  switch (method) {
    case 'emoji_match': return generateGridMatch(EMOJIS, 'emoji_match');
    case 'word_match': return generateGridMatch(WORDS, 'word_match');
    case 'icon_match': return generateGridMatch(ICONS, 'icon_match');
    case 'color_match': return generateGridMatch(COLORS, 'color_match');
    case 'shape_match': return generateGridMatch(SHAPES, 'shape_match');
    case 'flag_match': return generateGridMatch(FLAGS, 'flag_match');
    case 'number_sequence': return generateNumberSequence();
    case 'type_code': return generateTypeCode();
    case 'select_code': return generateSelectCode();
    case 'voice_phrase': return generateVoicePhrase();
    case 'tap_pattern': return generateTapPattern();
    case 'shake_verify': return { method: 'shake_verify' };
    case 'draw_match': return generateDrawMatch();
    case 'animal_sound': return generateAnimalSound();
    case 'random': {
      const m = ALL_METHODS[randomInt(0, ALL_METHODS.length - 1)];
      return generateChallenge(m);
    }
    default: return { method };
  }
}
