import 'dotenv/config'
import WebSocketServer from 'ws'
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { lobbies, ClientMessage, Player } from './game';
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
                        game.broadcastToPlayers({ type: "notification", message: `${existingPlayer.name} reconnected` })
                    }
                } else {
                    const player = new Player(m.player, ws, req.socket.remoteAddress)
                    const chat = await game.akinator.createChat(game.character)
                    if (typeof chat === "string" || !chat) {
                        player.sendToPlayer({ type: "error", "message": "error initalizing chat. try refreshing the page" })
                        return
                    }
                    player.chat = chat
                    game.players.push(player)
                    player.sendToPlayer({ "type": 'player-data', data: player.sanitize() })
                    game.broadcastToPlayers({ type: "notification", message: `${player.name} connected` })
                }
                break
            }
            //Player Sends Message to Chat
            case "chat": {
                const game = lobbies[m.gameId]?.game
                if (!game) return
                game.broadcastToPlayers({ type: "chat-message", "message": m.message })
                break
            }
            //Player Guessing
            case "guess": {
                const game = lobbies[m.gameId]?.game
                if (!game || game.state === "ended") return
                const player = game.players.find(p => p.ip === req.socket.remoteAddress)
                if (!player) return
                if (!player.chat) {
                    player.sendToPlayer({ "type": "error", "message": "No active chat" })
                }
                else {
                    const response = await game.akinator.guess(m.guess, player.chat, 0)
                    if (response.startsWith("Error")) {
                        player.sendToPlayer({ "type": "error", "message": response })
                    } else {
                        player.sendToPlayer({ "type": "aki-response", message: response })
                        player.gameHistory.push({ sender: "player", content: m.guess })
                        player.gameHistory.push({ sender: "ai", content: response })
                        player.guessCounter++
                        if (response.toLowerCase().startsWith("yes it is")) {
                            game.broadcastToPlayers({ "type": "notification", "message": `${player.name} guessed ${game.character} and won!` })
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