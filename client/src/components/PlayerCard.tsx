import type { StrippedPlayerData } from "../..";

function PlayerCard({ playerData }: { playerData: StrippedPlayerData }) {
    return (
    <div className="player-container">
        <span className="player-name">{playerData.name}</span>
        <span className="guessCounter">{`Guesses: ${playerData.guessCounter}`}</span>
    </div>
    )
}

export default PlayerCard