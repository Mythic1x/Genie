import "../App.css"
interface Props {
    message: string
    setErrors: React.Dispatch<React.SetStateAction<string[]>>
}
function PageError({ message, setErrors }: Props) {
    return (
        <div className="error-container">
            <button className="close" onClick={(() => {
                setErrors(prev => prev.filter((err) => err !== message))
            })}>X</button>
            <span className="err">{message}</span>
        </div>
    )
}

export default PageError