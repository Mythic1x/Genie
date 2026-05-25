import type { RefObject } from 'react'
import type { MessageHolder, PublicGameState } from '../../index' // Adjust path if needed
import MessageComponent from './message'
import InputBox from './TextBox'

interface ResponseBoxProps {
    akiHistory: MessageHolder
    gameState: PublicGameState
    messageQueue?: MessageHolder
    akiEndRef?: RefObject<HTMLDivElement>
    akinatorMessageSubmit?: (text: string) => void
}

function ResponseBox({
    akiHistory,
    gameState,
    messageQueue,
    akiEndRef,
    akinatorMessageSubmit
}: ResponseBoxProps) {
    return (
        <div className="response-box-container">
            <div className="response-box">
                {Object.values(akiHistory).sort((a, b) => a.timestamp - b.timestamp).map(m => (
                    <MessageComponent message={m} key={m.id} />
                ))}
                {messageQueue && Object.values(messageQueue).sort((a, b) => a.timestamp - b.timestamp).map(m => (
                    <MessageComponent message={m} key={m.id} />
                ))}
                <div ref={akiEndRef} />
            </div>
            {(gameState.state !== "ended" && akinatorMessageSubmit) && (
                <div className="input-container">
                    <InputBox placeholder='type your guess' handleSubmit={akinatorMessageSubmit} />
                </div>
            )}
        </div>
    )
}

export default ResponseBox