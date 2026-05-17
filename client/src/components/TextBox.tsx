import { useState } from "react";
interface Props {
    
    placeholder?: string
}

function InputBox({ placeholder }: Props) {
    const [text, setText] = useState("")
    return (
        <textarea value={text} placeholder={placeholder} onChange={(e => setText(e.target.value))} />
    )
}

export default InputBox