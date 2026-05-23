import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PublicGameState, PlayerData, StrippedPlayerData, ServerMessage, ClientMessage, Message, MessageHolder } from '../../index'
import MessageComponent from '../components/message'


import '../App.css'
import InputBox from '../components/TextBox'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { gameRoute } from '../routing'

const tempState: PublicGameState = {
  "chatMessages": [],
  "players": [],
  "state": "paused",
  "timeElapsed": 0
}



function Akinator() {
  const { gameId } = gameRoute.useParams()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['game'],
    queryFn: () => fetch(`http://${window.location.hostname}:5001/game/${gameId}`).then(res => res.status)
  })


  if (isPending) {
    return (
      <span className="load">Loading...</span>
    )
  }

  if (isError) {
    console.error(`${error.name}\n${error.cause}\n${error.stack}`)
    return (
      <span className="error">{error.message}</span>
    )
  }

  if (data === 404) {
    return (
      <span className="lost">You are lost</span>
    )
  }

  return (
    <AkinatorGameRoom gameId={gameId} />
  )

}



function AkinatorGameRoom({ gameId }: { gameId: string }) {
  const playerName = sessionStorage.getItem("playerName") ?? "Unknown"
  const [notifications, setNotifications] = useState<string[]>([])
  const [pageErrors, setErrors] = useState<string[]>([])
  const [akiHistory, setAkiHistory] = useState<MessageHolder>({})
  const [chatHistory, setChatHistory] = useState<MessageHolder>({})
  const [gameState, setGameState] = useState<PublicGameState>(tempState)
  const [player, setPlayer] = useState<PlayerData>()
  const [messageQueue, setMessageQueue] = useState<MessageHolder>({})
  const [chatMessageQueue, setChatMessageQueue] = useState<MessageHolder>({})

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(`ws://${window.location.hostname}:5001`, {
    share: true,
  })

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      const message: ClientMessage = { "action": "connect", "gameId": gameId, "player": playerName }
      sendJsonMessage(message)
      const interval = setInterval(() => {
        const heartbeat: ClientMessage = { "action": "heartbeat" }
        sendJsonMessage(heartbeat)
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [readyState])

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        if (prev.length > 3) {
          return prev.slice(1)
        }
        return prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const message = lastJsonMessage as ServerMessage
    if (!message) return
    switch (message.type) {
      case "aki-response":
        setAkiHistory(prev => ({ ...prev, [message.message.id]: message.message }))
        break
      case "chat-message":
        const incomingChat: Message = { ...message.message, status: "sent" }
        setChatHistory(prev => ({ ...prev, [incomingChat.id]: incomingChat }))

        setChatMessageQueue(prev => {
          const msgInQueue = prev[incomingChat.id]

          if (!msgInQueue) return prev

          clearTimeout(msgInQueue.timeout)
          const newQueue = { ...prev }
          delete newQueue[incomingChat.id]
          return newQueue
        })
        break
      case "state-update":
        setGameState(message.gameState)
        setChatHistory(message.gameState.chatMessages)
        break
      case "player-data":
        setPlayer(message.data)
        setAkiHistory(message.data.gameHistory)
        break
      case "error":
        setErrors(prev => [...prev, message.message])
        break
      case "notification":
        setNotifications(prev => [...prev, message.message])
        break
      case "message-received":
        if (message.context === "akinator") {
          setMessageQueue(prevQueue => {
            const msg = prevQueue[message.messageId]

            if (!msg) return prevQueue

            clearTimeout(msg.timeout)

            const updatedMsg: Message = { ...msg, status: "sent" }

            setAkiHistory(prevAki => ({ ...prevAki, [message.messageId]: updatedMsg }))

            const newQueue = { ...prevQueue }
            delete newQueue[message.messageId]
            return newQueue
          })
        }
        break


    }
  }, [lastJsonMessage])

  function akinatorMessageSubmit(text: string) {
    const messageId = Math.floor(Math.random() * 1000000)
    const msg: Message = {
      id: messageId,
      sender: playerName,
      content: text,
      status: "sending",
      timestamp: Date.now()
    }

    const timeout = setTimeout(() => {
      setMessageQueue(prevQueue => {
        const existingMsg = prevQueue[messageId]

        if (!existingMsg) return prevQueue

        return {
          ...prevQueue,
          [messageId]: { ...existingMsg, status: "error" }
        }
      })
    }, 60000)

    msg.timeout = timeout

    setMessageQueue(prev => {
      return {
        ...prev,
        [messageId]: msg
      }
    })

    console.log(messageQueue)

    if (Object.keys(messageQueue).length > 3) return alert("stop spamming")
    const message: ClientMessage = { "action": "guess", "guess": msg, "player": playerName, "gameId": gameId }
    sendJsonMessage(message)
  }

  function chatMessageSubmit(text: string) {
    const messageId = Math.floor(Math.random() * 1000000)
    const msg: Message = {
      id: messageId,
      sender: playerName,
      content: text,
      status: "sending",
      timestamp: Date.now()
    }

    const timeout = setTimeout(() => {
      setChatMessageQueue(prevQueue => {
        const existingMsg = prevQueue[messageId]

        if (!existingMsg) return prevQueue

        return {
          ...prevQueue,
          [messageId]: { ...existingMsg, status: "error" }
        }
      })
    }, 60000)
    msg.timeout = timeout

    setChatMessageQueue(prev => {
      return {
        ...prev,
        [messageId]: msg
      }
    })

    if (Object.keys(chatMessageQueue).length > 3) return alert("stop spamming")
    const message: ClientMessage = { "action": "chat", "message": msg, "player": playerName, "gameId": gameId }
    sendJsonMessage(message)
  }



  return (
    <>
      <h1 className="header">Akinator</h1>
      <div className="game-container">
        <div className="response-box-container">
          <div className="response-box">
            {Object.values(akiHistory).sort((a, b) => a.timestamp - b.timestamp).map(m => (
              <MessageComponent message={m} />
            ))}
            {Object.values(messageQueue).sort((a, b) => a.timestamp - b.timestamp).map(m => (
              <MessageComponent message={m} />
            ))}
          </div>
          <div className="input-container">
            <InputBox placeholder='type your guess' handleSubmit={akinatorMessageSubmit} />
          </div>
        </div>
      </div>
      <div className="chatbox-container">
        <div className="chatbox">
          {Object.values(chatHistory).sort((a, b) => a.timestamp - b.timestamp).map(m => (
            <MessageComponent message={m} />
          ))}
          {Object.values(chatMessageQueue).sort(((a, b) => a.timestamp - b.timestamp)).map(m => (
            <MessageComponent message={m} />
          ))}
        </div>
        <div className="chatbox-input">
          <InputBox placeholder='type your message' handleSubmit={chatMessageSubmit} />
        </div>
      </div>
    </>

  )
}

export default Akinator
