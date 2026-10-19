import type {
  Card,
  PublicState,
  GameMode,
  DealMode,
  GameType,
  AdminHands,
  Deck,
  DeckWithCards,
} from "./types.js";

export interface ClientToServerEvents {
  authenticate_admin: (
    payload: { password: string },
    cb: (r: { ok: boolean; token?: string; error?: string }) => void
  ) => void;

  validate_admin_session: (
    payload: { token: string },
    cb: (r: { ok: boolean }) => void
  ) => void;

  // --- Deck manager (all require authentication) ---

  list_decks: (
    cb: (r: { ok: boolean; decks?: Deck[]; error?: string }) => void
  ) => void;

  get_deck: (
    payload: { id: string },
    cb: (r: { ok: boolean; deck?: DeckWithCards; error?: string }) => void
  ) => void;

  create_deck: (
    payload: {
      name: string;
      gameType: GameType;
      imageUrl?: string | null;
      color?: string | null;
    },
    cb: (r: { ok: boolean; deck?: Deck; error?: string }) => void
  ) => void;

  /** Only the fields present in the payload are updated; omitted ones stay. */
  update_deck: (
    payload: {
      id: string;
      name?: string;
      gameType?: GameType;
      imageUrl?: string | null;
      color?: string | null;
    },
    cb: (r: { ok: boolean; deck?: Deck; error?: string }) => void
  ) => void;

  delete_deck: (
    payload: { id: string },
    cb: (r: { ok: boolean; error?: string }) => void
  ) => void;

  add_card: (
    payload: { deckId: string; name: string; imageUrl: string },
    cb: (r: { ok: boolean; card?: Card; error?: string }) => void
  ) => void;

  rename_card: (
    payload: { id: string; name: string },
    cb: (r: { ok: boolean; error?: string }) => void
  ) => void;

  delete_card: (
    payload: { id: string },
    cb: (r: { ok: boolean; error?: string }) => void
  ) => void;

  /**
   * Ask the server to re-send the current state to this socket only.
   * Needed because the server broadcasts only on change — a freshly
   * mounted screen would stay blank until someone else acted.
   */
  request_state: (payload: { code: string }) => void;

  // --- Room lifecycle (admin) ---

  create_room: (
    cb: (data: {
      code: string;
      adminId: string;
      adminToken: string;
    }) => void
  ) => void;

  /** Locks the room automatically (fixes the player count for all downstream math). */
  choose_mode: (payload: { code: string; mode: GameMode }) => void;

  choose_deal_mode: (payload: { code: string; dealMode: DealMode }) => void;

  /** Fallback path (no database): uses the fixed decks in code. With a database, use choose_deck instead. */
  choose_game_type: (payload: { code: string; gameType: GameType }) => void;

  /**
   * Pick which deck to play with. The deck carries its cards and declares
   * which game type governs its rules, replacing choose_game_type.
   */
  choose_deck: (
    payload: { code: string; deckId: string },
    cb: (r: { ok: boolean; error?: string }) => void
  ) => void;

  create_groups: (payload: { code: string; groupCount: number }) => void;

  choose_card_count: (payload: { code: string; cardCount: number }) => void;

  choose_cards_per_turn: (payload: {
    code: string;
    cardsPerTurn: number;
  }) => void;

  /** Can be called multiple times (incremental placement) until reaching the turn target. */
  place_cards: (payload: { code: string; cardIds: string[] }) => void;

  /** Admin skips the active phase timer: in "place" it auto-completes randomly, in "present" it advances the turn. */
  skip_phase: (payload: { code: string }) => void;

  toggle_pause: (payload: { code: string }) => void;

  rename_group: (payload: {
    code: string;
    groupId: string;
    newName: string;
  }) => void;

  start_game: (payload: { code: string }) => void;

  reopen_room: (payload: { code: string }) => void;

  end_game: (payload: { code: string }) => void;

  kick_players: (payload: { code: string; playerIds: string[] }) => void;

  // --- Player actions ---

  join: (
    payload: {
      code: string;
      name: string;
      previousSession?: string;
      /** Browser-level id (localStorage) to reject duplicate seats from the same device. */
      deviceId?: string;
    },
    cb: (data: {
      ok: boolean;
      playerId?: string;
      error?: string;
      /** True when the failure is name-related (taken, empty, too long) and worth re-prompting. */
      retryName?: boolean;
    }) => void
  ) => void;

  move_card: (payload: { code: string; cardId: string; position: number }) => void;

  reconnect: (
    payload: { code: string; playerId: string },
    cb: (data: { ok: boolean }) => void
  ) => void;

  reconnect_admin: (
    payload: { code: string; adminToken: string },
    cb: (data: { ok: boolean }) => void
  ) => void;
}

export interface ServerToClientEvents {
  state_updated: (state: PublicState) => void;

  your_hand: (cards: Card[]) => void;

  admin_hands: (hands: AdminHands) => void;

  timer: (seconds: number, paused: boolean) => void;

  /**
   * Two distinct scenarios that used to look identical to the client:
   * "kicked" = the presenter removed this player;
   * "room_discarded" = the presenter opened a new room and this one was swept.
   * canRejoin tells the client whether retrying with the QR code would work.
   */
  kicked: (info?: {
    reason: "kicked" | "room_discarded";
    canRejoin: boolean;
  }) => void;

  room_error: (message: string) => void;
}

/**
 * Empty on purpose — single-process today. Declared because Socket.IO's
 * Server generic requires it, and naming it leaves the slot ready for
 * multi-instance scaling behind a load balancer.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

export interface SocketData {
  code?: string;
  playerId?: string;
  isAdmin?: boolean;
  /** Set only after validating the password or a session token. */
  adminAuthenticated?: boolean;
}
