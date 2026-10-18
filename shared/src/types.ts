export type GameMode = "random_deal" | "timeline";

export const MODE_NAMES: Record<GameMode, string> = {
  random_deal: "Choose game (card type)",
  timeline: "Collaborative Timeline",
};

/** Only active modes — "timeline" is defined in the type but not yet enabled. */
export const MODES: GameMode[] = ["random_deal"];

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
}

/** A player connected to a room. No personal data is persisted. */
export interface Player {
  id: string;
  name: string;
  connected: boolean;
  hand: Card[];
  /**
   * Browser-level id stored in localStorage (shared across tabs) to prevent
   * one person from occupying multiple seats by opening new tabs — unlike the
   * session id in sessionStorage, which is unique per tab.
   * Never broadcast: the public state builds the player list field by field
   * and this one is excluded. It identifies the device, not the game entity.
   */
  deviceId?: string;
}

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
  cards: Card[];
}

/** How cards are dealt: to each player individually or to groups. */
export type DealMode = "individual" | "groups";

/** Identifies which rule set governs a game session. */
export type GameType = "topics_white" | "objects_blue";

export interface GameDefinition {
  id: GameType;
  name: string;
  color: "white" | "blue";
  totalCards: number;
  description: string;
  cardsVisibleToAll: boolean;
}

export const GAME_TYPES: Record<GameType, GameDefinition> = {
  topics_white: {
    id: "topics_white",
    name: "Topic Debate (White Cards)",
    color: "white",
    totalCards: 7,
    description:
      "Each player or group receives topic cards without knowing what the others have. The presenter poses a scenario and each must argue why their topic is the most critical to resolve it.",
    cardsVisibleToAll: false,
  },
  objects_blue: {
    id: "objects_blue",
    name: "Creative Objects (Blue Cards)",
    color: "blue",
    totalCards: 42,
    description:
      "Each player or group receives object cards and proposes what product or service could be developed from the image.",
    cardsVisibleToAll: true,
  },
};

export const GAME_TYPE_LIST: GameType[] = ["topics_white", "objects_blue"];

/**
 * A deck created by the presenter (persisted in Postgres).
 * The presenter picks which game type governs the deck's rules.
 * The cover is either an uploaded image or a solid color.
 */
export interface Deck {
  id: string;
  name: string;
  gameType: GameType;
  imageUrl: string | null;
  color: string | null;
  createdAt: string;
  cardCount: number;
  /** System decks can be edited and recolored but not deleted. */
  isSystem: boolean;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}

/** A "number of groups" option offered to the presenter. */
export interface GroupOption {
  groupCount: number;
  baseSize: number;
  /** True if one random group will have baseSize + 1 players. */
  hasRemainder: boolean;
}

export interface DealModeAvailability {
  enabled: boolean;
  reason?: string;
}

/** Computed from the current locked player count. */
export interface DealModeOptions {
  individual: DealModeAvailability;
  groups: DealModeAvailability & { options: GroupOption[] };
  noneAvailable: boolean;
  noneReason?: string;
}

export type TurnPhase = "place" | "present";

/**
 * Both sides need these values: the server counts down and the client draws
 * the progress bar. Duplicating them would let the bar desync silently.
 */
export const PHASE_DURATION_S: Record<TurnPhase, number> = {
  place: 90,
  present: 300,
};

/** Raw turn-engine state (server-only, never broadcast directly). */
export interface TurnState {
  order: string[];
  currentIndex: number;
  round: number;
  totalRounds: number;
  phase: TurnPhase;
  turnTarget: number;
  placedThisTurn: number;
  secondsRemaining: number;
  paused: boolean;
  finished: boolean;
}

export interface CardOnTable {
  card: Card;
  byId: string;
  byName: string;
  round: number;
}

/** Public turn info broadcast to all players. */
export interface PublicTurn {
  currentId: string;
  currentName: string;
  phase: TurnPhase;
  round: number;
  totalRounds: number;
  remainingRounds: number;
  cardsToPlace: number;
  secondsRemaining: number;
  paused: boolean;
  finished: boolean;
}

/** Complete room state. Lives in server memory, never sent to clients. */
export interface Room {
  code: string;
  adminId: string;
  /** Stable secret token that survives page reloads. Never broadcast. */
  adminToken: string;
  mode: GameMode | null;
  players: Player[];
  timelineOrder: string[];
  started: boolean;
  /** Once locked, the player count is fixed and no new players are admitted. */
  locked: boolean;
  dealMode: DealMode | null;
  /** Inferred from the chosen deck — each deck declares its governing game type. */
  gameType: GameType | null;
  deckId: string | null;
  deckName: string | null;
  /** The actual cards to deal from. Populated when the presenter picks a deck. */
  deckCards: Card[];
  groups: Group[];
  chosenCardCount: number | null;
  cardsPerTurn: number | null;
  turns: TurnState | null;
  table: CardOnTable[];
  /** Timestamp when the last person disconnected. Used by the room sweeper. */
  emptySince: number | null;
}

/**
 * Public projection of a room, broadcast to all connected clients.
 * Excludes private hands and server-only internals.
 */
export interface PublicState {
  code: string;
  mode: GameMode | null;
  started: boolean;
  locked: boolean;
  dealMode: DealMode | null;
  gameType: GameType | null;
  deckName: string | null;
  totalDeckCards: number;
  dealModeOptions: DealModeOptions | null;
  /** Valid multiples of the target count (players or groups), <= deck total. */
  validCardCounts: number[];
  chosenCardCount: number | null;
  /** Cards per target (C) — used to offer the per-turn range 1..C. */
  cardsPerTarget: number | null;
  cardsPerTurn: number | null;
  canStart: boolean;
  players: Array<{
    id: string;
    name: string;
    connected: boolean;
    cardCount: number;
  }>;
  groups: Array<{
    id: string;
    name: string;
    playerIds: string[];
    cardCount: number;
  }>;
  timelineOrder: string[];
  table: CardOnTable[];
  turn: PublicTurn | null;
  /** In the blue-card game, the current turn's hand is visible to everyone. */
  currentTurnHand: Card[] | null;
}

/** A hand block in the admin-only view. */
export interface HandBlock {
  id: string;
  name: string;
  cards: Card[];
}

/** Admin-only projection: all hands fully visible. Sent only to the admin socket. */
export interface AdminHands {
  dealMode: DealMode | null;
  blocks: HandBlock[];
}
