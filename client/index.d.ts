
export interface GameMessage {
    sender: "ai" | "player"
    content: string
}

export interface PublicGameState {
    state: "ongoing" | "ended" | "paused"
    timeElapsed: number
    players: StrippedPlayerData[]
    chatMessages: string[]
}

export interface StrippedPlayerData {
    name: string
    guessCounter: number
}

export interface PlayerData {
    name: string
    gameHistory: GameMessage[]
    guessCounter: number
}


export type ClientMessage =
    { action: "guess", guess: string, player: string, "gameId": string }
    | { action: "reconnect", "gameId": string, player: string }
    | { action: "connect", "gameId": string, player: string }
    | { action: "chat", "message": string, player: string, "gameId": string }
    | { action: "heartbeat" }

export type ServerMessage =
    { type: "state-update", gameState: PublicGameState }
    | { type: "notification", message: string }
    | { type: "chat-message", message: string }
    | { type: "error", "message": string }
    | { type: "aki-response", "message": string }
    | { type: "player-data", data: PlayerData }