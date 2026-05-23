import "../App.css"

function PageNotification({message}: {message: string}) {
    return (
        <span className="notification">{message}</span>
    )
}

export default PageNotification