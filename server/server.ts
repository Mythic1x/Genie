import 'dotenv/config'
import WebSocketServer from 'ws'
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { lobbies, ClientMessage, Player, AkiMessage, GameError, Game } from './game';
import router from './routes';


const app = express();
app.use(cors());
app.use(express.json());
app.use("/", router)
const server = createServer(app);
const wss = new WebSocketServer.Server({ server });




wss.on("connection", (ws, req) => {
    let timeout = setTimeout(() => {
        ws.close()
    }, 121000)

    let connectedGameId: string | null = null


    ws.on("close", () => {
        clearTimeout(timeout)
        if (connectedGameId && lobbies[connectedGameId]) {
            const game = lobbies[connectedGameId]?.game
            if (game.state !== "ended") {
                const player = game.players.find(p => p.ip === req.socket.remoteAddress)
                if (player) {
                    game.broadcastToPlayers({ type: "notification", "message": `${player.name} disconnected` })
                }
            }
        }
    })


    ws.on("message", async (message) => {
        try {
            var m: ClientMessage = JSON.parse(message.toString())
        } catch (err: any) {
            console.log(err)
            return
        }

        switch (m.action) {
            //Heartbeat to Ensure Alive Connections
            case 'heartbeat': {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    ws.close()
                }, 120000)
                break
            }
            //Player Tries to Connect
            case 'connect': {
                const game = lobbies[m.gameId]?.game
                if (!game) return
                connectedGameId = m.gameId
                if (game.deletionTimeout) {
                    clearTimeout(game.deletionTimeout)
                }

                const existingPlayer = game.players.find(p => p.ip === req.socket.remoteAddress)

                if (existingPlayer) {
                    if (existingPlayer.ws.readyState === WebSocket.CLOSED) {
                        existingPlayer.ws = ws
                        existingPlayer.sendToPlayer({ "type": 'player-data', data: existingPlayer.sanitize() })
                        existingPlayer.sendToPlayer({ "type": "state-update", "gameState": game.getState() })
                        game.broadcastToPlayers({ type: "notification", message: `${existingPlayer.name} reconnected` })
                    }
                } else {
                    const name = m.player || "Guest"
                    const player = new Player(name, ws, req.socket.remoteAddress)
                    const chat = await game.akinator.createChat(game.character)
                    if (typeof chat === "string" || !chat) {
                        const error: GameError = { "reason": "Failed to initialize chat", data: { "errorMessage": "Error initializing chat. Try refreshing the page" },  }
                        player.sendToPlayer({ type: "error", "error": error })
                        return
                    }
                    player.chat = chat
                    game.players.push(player)
                    player.sendToPlayer({ "type": 'player-data', data: player.sanitize() })
                    player.sendToPlayer({ "type": "state-update", "gameState": game.getState() })
                    game.broadcastToPlayers({ type: "notification", message: `${player.name} connected` })
                }
                break
            }
            //Player Sends Message to Chat
            case "chat": {
                const game = lobbies[m.gameId]?.game
                if (!game) return
                const player = game.players.find(p => p.ip === req.socket.remoteAddress)
                if (!player) return
                player.sendToPlayer({ type: "message-received", context: "chat", messageId: m.message.id })
                game.broadcastToPlayers({ type: "chat-message", "message": { ...m.message, status: "sent" } })
                game.chatMessages[m.message.id] = { ...m.message, "status": "sent" }
                break
            }
            //Player Guessing
            case "guess": {
                const game = lobbies[m.gameId]?.game
                if (!game || game.state === "ended") return
                const player = game.players.find(p => p.ip === req.socket.remoteAddress)
                if (!player) return
                if (!player.chat) {
                    const error: GameError = { "reason": "Chat failed", data: { "errorMessage": "No active chat" }, }
                    player.sendToPlayer({ "type": "error", "error": error })
                }
                else {
                    player.sendToPlayer({ type: "message-received", context: "akinator", messageId: m.guess.id })
                    const response = await game.akinator.guess(m.guess.content, player.chat, 0)
                    if (response.startsWith("Error")) {
                        const error: GameError = { "reason": "Message failed to process", data: { messageId: m.guess.id, errorMessage: response }, }
                        player.sendToPlayer({ "type": "error", "error": error })
                    } else {
                        const akiRes: AkiMessage = {
                            sender: "Aki",
                            content: response,
                            id: Math.floor(Math.random() * 1000000),
                            status: "sent",
                            timestamp: Date.now()
                        }
                        player.sendToPlayer({ "type": "aki-response", message: akiRes })
                        player.gameHistory[m.guess.id] = { ...m.guess, "status": "sent" }
                        player.gameHistory[akiRes.id] = akiRes
                        player.guessCounter++
                        if (response.toLowerCase().startsWith("yes it is")) {
                            game.broadcastToPlayers({ "type": "notification", "message": `${player.name} guessed ${game.character} and won!` })
                            game.winner = player
                            game.endGame()
                        }
                        game.broadcastState()
                    }
                }
            }

        }
    })
})

server.listen(5001, () => console.log('Server running on port 5001'));