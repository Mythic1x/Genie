import "../App.css"

function Error({ message }: { message: string }) {
    return (
        <div className="error-container">
            <button className="close">X</button>
            <span className="err">{message}</span>
        </div>
    )
}

export default Error