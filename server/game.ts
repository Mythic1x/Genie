import { Chat } from "@google/genai"
import { WebSocket, WebSocketServer } from "ws"
import { Akinator } from "./akinator"
export const akinator = new Akinator()
export const lobbies: Record<string, Lobby> = {}

export class Player {
    name: string
    ws: WebSocket
    ip: string | undefined
    chat: Chat | undefined
    guessCounter: number
    gameHistory: GameMessage[]

    constructor(name: string, ws: WebSocket, ip: string | undefined) {
        this.name = name
        this.ws = ws
        this.ip = ip
        this.guessCounter = 0
        this.gameHistory = []
    }

    sendToPlayer(message: ServerMessage) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        }
    }

    sanitize(): PlayerData {
        return { name: this.name, guessCounter: this.guessCounter, gameHistory: this.gameHistory }
    }
}

export interface Lobby {
    game: Game
}

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

export class Game {
    players: Player[]
    state: "ongoing" | "ended" | "paused"
    timeElapsed: number
    character: string
    timeIntervalId: NodeJS.Timeout
    chatMessages: string[]
    akinator: Akinator
    constructor(players: Player[], state: "ongoing" | "ended" | "paused", character: string) {
        this.players = players
        this.state = state
        this.timeElapsed = 0
        this.character = character
        this.timeIntervalId = setInterval(() => {
            if (this.state === "ongoing") {
                this.timeElapsed++
            }
        }, 1000)
        this.chatMessages = []
        this.akinator = akinator
    }

    getState(): PublicGameState {
        return {
            state: this.state,
            timeElapsed: this.timeElapsed,
            players: this.players.map(p => ({ name: p.name, guessCounter: p.guessCounter })),
            chatMessages: this.chatMessages
        }
    }

    broadcastToPlayers(message: ServerMessage) {
        for (const player of this.players) {
            player.sendToPlayer(message)
        }
    }

    broadcastState() {
        this.broadcastToPlayers({ type: "state-update", "gameState": this.getState() })
    }

    endGame() {
    this.state = "ended";
    clearInterval(this.timeIntervalId)
}

}