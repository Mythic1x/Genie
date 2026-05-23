

export interface PublicGameState {
    state: "ongoing" | "ended" | "paused"
    timeElapsed: number
    players: StrippedPlayerData[]
    chatMessages: MessageHolder
}

export interface StrippedPlayerData {
    name: string
    guessCounter: number
}

export interface PlayerData {
    name: string
    gameHistory: MessageHolder
    guessCounter: number
}

//Chat messages
type MessageHolder = Record<number, Message>
interface Message {
    sender: string
    id: number
    content: string
    timeout?: NodeJS.Timeout
    status: "sending" | "sent" | "error"
    timestamp: number
}

interface AkiMessage {
    id: number
    sender: string
    content: string
    status: "sent"
    timestamp: number
}

export type ClientMessage =
    { action: "guess", guess: Message, player: string, "gameId": string }
    | { action: "reconnect", "gameId": string, player: string }
    | { action: "connect", "gameId": string, player: string }
    | { action: "chat", "message": Message, player: string, "gameId": string }
    | { action: "heartbeat" }

export type ServerMessage =
    { type: "state-update", gameState: PublicGameState }
    | { type: "notification", message: string }
    | { type: "chat-message", message: Message }
    | { type: "error", "message": string }
    | { type: "aki-response", "message": AkiMessage }
    | { type: "player-data", data: PlayerData }
    | { type: "message-received", messageId: number, "context": "akinator" | "chat" }
