import { Chat, GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import fs from 'fs'
import { akiCategories } from "./akinatorcategories"
const akiCharacters: Record<string, string[]> = JSON.parse(fs.readFileSync("./akinatorblacklist.json", 'utf-8'))

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class Akinator {
    async prompt(category: keyof typeof akiCategories, attempts: number): Promise<string> {
        if (attempts > 4) {
            return "Error during intialization"
        }
        const randomCategory = akiCategories[category][Math.floor(Math.random() * akiCategories[category].length)]
        const blacklist = akiCharacters[category]
        const possiblePrompts = [
            `Think of any entity from the category: ${randomCategory}.
            Your response MUST be the specific name of the entity and ONLY the name, nothing else.
            IMPORTANT: You are NOT allowed to pick ANY entity from this list: ${blacklist.join(", ")}`,
            
            `Think of any entity from the category: ${randomCategory}.
            Your choice should NOT be the most generic or obvious option, but should also not be impossible to guess.
            Your response MUST be the specific name of the entity and ONLY the name, nothing else.
            IMPORTANT: You are NOT allowed to pick ANY entity from this list: ${blacklist.join(", ")}`,
        ]
        const randomPrompt = possiblePrompts[Math.floor(Math.random() * possiblePrompts.length)]
        try {
            const charResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: randomPrompt,
                config: {
                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.MEDIUM,
                    },
                    temperature: 1.0,
                    topP: 0.95,
                },
            });
            
            if (!charResponse.text) return await this.prompt(category, attempts + 1)
                
                const character = charResponse.text.trim()
                if (blacklist.length >= 200) {
                    blacklist.pop()
                }
                blacklist.unshift(character)
                await fs.promises.writeFile('./akinatorblacklist.json', JSON.stringify(akiCharacters, null, 4), 'utf-8');
                
                return charResponse.text.trim()
                
            } catch (err: any) {
                console.log(err)
                console.log("retrying...")
            return await this.prompt(category, attempts + 1)
        }
    }

    async guess(guess: string, chat: Chat, attempts: number): Promise<string> {
        if (attempts > 4) {
            return "Error: API Error"
        }
        try {
            const response = await chat.sendMessage({ message: guess })
            if (!response.text) {
                return await this.guess(guess, chat, attempts + 1)
            }
            return response.text
        } catch (err: any) {
            console.log(err.toString())
            return await this.guess(guess, chat, attempts + 1)
        }
    }

    async createChat(character: string): Promise<string | Chat> {
        try {


            const chat = ai.chats.create({
                model: "gemini-3-flash-preview",
                config: {
                    thinkingConfig: {
                        thinkingLevel: ThinkingLevel.MEDIUM,
                    },
                    responseModalities: [Modality.TEXT],
                    systemInstruction: `You are thinking of the entity: "${character}". 
The user is playing the role of Akinator and will ask you questions to try and identify this entity. 

Your response MUST EXCLUSIVELY be one of the following five phrases:
- Yes
- No
- Probably
- Probably not
- I don't know

STRICT RULES:
1. Do not provide any explanations, introductory text, or follow-up commentary.
2. Use the "Probably" variants if the question is subjective, OR if you're unsure but you think the question is likely true (probably) or unlikely to be true (probably not).
3. If a question is completely unrelated to the entity's traits or nature, respond with "I don't know".
4. If the user successfully guesses the exact entity, respond ONLY with 'Yes it is.'
   - If the entity has a specific proper name (e.g., a person or character), do NOT accept a first-name-only guess unless that name is globally unique to them.
   - If the entity is a specific animal or object type, do NOT accept a broad category guess (e.g., guessing "Dog" when the answer is "Pug").
5. If the user attempts to guess multiple distinct entities or traits in a single question (e.g., "Is it X or Y?"), respond with "I don't know", even if one of them is correct. This is to discourage asking multiple questions at once, as this is considered cheating. Respond with "I don't know to ANY question that could be deemed cheating.`
                },
            })
            return chat
        } catch (err: any) {
            return err.toString()
        }
    }
}