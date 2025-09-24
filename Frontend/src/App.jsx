import { useState } from "react"
import "./App.css"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

const App = () => {

  const [joined, setJoined] = useState(false)
  const [roomId, setRoomId] = useState("")
  const [userName, setuserName] = useState("")

  const joinRoom = () => {
    if(roomId && userName){
      socket.emit("join", roomId, userName)
      setJoined(true)
    }
  }

  if (!joined) {
    return <div className="join-container">
      <div className="join-form">
        <h1>Join Code Room</h1>
        <input type="text"
          placeholder="Room Id"
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value) } 
          />
        <input type="text"
          placeholder="Your Name"
          value={userName} 
          onChange={(e) => setuserName(e.target.value) } 
          />

          <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  }
  return <div>User joined </div>
}

export default App