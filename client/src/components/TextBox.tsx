import { useState } from "react";
interface Props {
    handleSubmit: (text: string) => void
    placeholder?: string
}

function InputBox({ handleSubmit, placeholder }: Props) {
    const [text, setText] = useState("")
    return (
        <textarea value={text} placeholder={placeholder} onChange={(e => setText(e.target.value))} onKeyDown={(e) => {
            if (e.key === "Enter" && text) {
                handleSubmit(text.trim())
                setText("")
            }
        }} />
    )
}

export default InputBox