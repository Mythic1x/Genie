import { useMutation, useQuery } from "@tanstack/react-query"
import "./App.css"
import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"

function App() {
    const navigate = useNavigate({ from: "/" })
    const [name, setName] = useState("")
    const createGameMutation = useMutation({
        mutationFn: async (category: string) => {
            const res = await fetch(`http://${window.location.hostname}:5001/create-game/${category}`)
            if (!res.ok) {
                throw new Error(await res.text())
            }
            return await res.text()
        },
        onSuccess: (data) => {
            sessionStorage.setItem("playerName", name)
            navigate({ to: `/game/${data}` })
        },
        onError: (error) => {
            console.error(`${error.cause}\n${error.message}\n${error.name}`)
        }
    })
    return (
        <div className="homepage-container">
            {createGameMutation.isPending &&
                <span className="loading">Creating Game...</span>
            }
            {createGameMutation.isError &&
                <span className="error">"Something went wrong while creating game</span>
            }
            <h1 className="select-category">Select the Category</h1>
            <input type="text" placeholder="Select your name" className="name-selection" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="category-selection-container">
                <div className="category" onClick={() => createGameMutation.mutate("standard")}>
                    <span className="standard">Standard</span>
                </div>
                <div className="category" onClick={() => createGameMutation.mutate("things")}>
                    <span className="things">Things</span>
                </div>
                <div className="category" onClick={() => createGameMutation.mutate("humans")}>
                    <span className="humans">Humans</span>
                </div>
                <div className="category" onClick={() => createGameMutation.mutate("animals")}>
                    <span className="animals">Animals</span>
                </div>
            </div>
        </div>



    )
}

export default App