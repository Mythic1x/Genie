import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PublicGameState, PlayerData, StrippedPlayerData, GameMessage, ServerMessage, ClientMessage } from '../../index'
import Message from '../components/message'

import './App.css'
import InputBox from '../components/TextBox'
import useWebSocket, { ReadyState } from 'react-use-websocket'

const tempState: PublicGameState = {
  "chatMessages": [],
  "players": [],
  "state": "paused",
  "timeElapsed": 0
}


function Akinator() {
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

  const [notifications, setNotifications] = useState<string[]>([])
  const [pageErrors, setErrors] = useState<string[]>([])
  const [akiHistory, setAkiHistory] = useState<string[]>([])
  const [chatHistory, setChatHistory] = useState<string[]>([])
  const [gameState, setGameState] = useState<PublicGameState>(tempState)
  const [player, setPlayer] = useState<PlayerData>()

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
    if(!message) return
    switch (message.type) {
      case "aki-response":
        setAkiHistory(prev => [...prev, message.message])
        break
      case "chat-message":
        setChatHistory(prev => [...prev, message.message])
        break
      case "state-update":
        setGameState(message.gameState)
        break
      case "player-data":
        setPlayer(message.data)
        break
      case "error":
        setErrors(prev => [...prev, message.message])
        break
      case "notification":
        setNotifications(prev => [...prev, message.message])
        break
    }
  }, [lastJsonMessage])


  return (
    <>
      <h1 className="header">Akinator</h1>
      <div className="game-container">
        <div className="response-box-container">
          <div className="response-box">
            {akiHistory.map(m => (
              <Message message={m} />
            ))}
          </div>
          <div className="input-container">
            <InputBox handleSubmit={submitAkinator} placeholder='type your guess' />
          </div>
        </div>
      </div>
      <div className="chatbox-container">
        <div className="chatbox">
          {chatHistory.map(m => (
            <Message message={m} />
          ))}
        </div>
        <div className="chatbox-input">
          <InputBox handleSubmit={submitChat} placeholder='type your message' />
        </div>
      </div>
    </>

  )
}

export default Akinator
