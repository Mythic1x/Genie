import { Router } from "express";
import { lobbies, Game, akinator } from "./game";
import { akiCategories } from "./akinatorcategories";
const router = Router()

function generateGameId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let result = ''

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length)
        result += chars.charAt(randomIndex);
    }

    return result
}

router.get("/create-game/:category", async (req, res) => {
    const gameId = generateGameId()
    const category = req.params.category as keyof typeof akiCategories
    if (!akiCategories[category]) {
        return res.status(404).send("Invalid Category")
    }

    const character = await akinator.prompt(category, 0)
    if (character.toLowerCase().startsWith("error")) {
        return res.status(500).send("Error generating game")
    }
    const game = new Game([], "ongoing", character)
    lobbies[gameId] = { game: game }
    return res.status(200).send("Game created")
})

router.get("/game/:gameId", async (req, res) => {
    const gameId = req.params.gameId
    if(lobbies[gameId]?.game) {
        return res.status(200).send()
    } else {
        return res.status(404).send("Game not found")
    }
})


export default router