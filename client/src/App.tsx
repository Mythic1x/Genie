import { useState } from 'react'
import Message from './components/message'

import './App.css'
import InputBox from './components/TextBox'


function Akinator() {
  const [akiHistory, setAkiHistory] = useState<string[]>([])
  const [chatHistory, setChatHistory] = useState<string[]>([])
  function submitAkinator(msg: string) {
    setAkiHistory([...akiHistory, msg])
  }
  function submitChat(msg: string) {
    setChatHistory([...chatHistory, msg])
  }
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
