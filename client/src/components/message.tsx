import type { Message } from "../.."

const MessageComponent = ({ message }: { message: Message}) => {
   
    return (
        <span className={`message-${message.status}`}>{`${message.sender}: ${message.content}`}</span>
    )
}

export default MessageComponent