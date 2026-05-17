import "../App.css"

function Notification({message}: {message: string}) {
    return (
        <span className="notification">{message}</span>
    )
}

export default Notification