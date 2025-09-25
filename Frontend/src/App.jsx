import { useState } from "react";
import "./App.css";
import { io } from "socket.io-client";
import Editor from '@monaco-editor/react'

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setuserName] = useState("");
  const [language, setLanguage] = useState("javascript")

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const copyRoomId = () => {

  }

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setuserName(e.target.value)}
            required
          />

          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Room Code: {roomId}</h2>
          <button onClick={copyRoomId}>Copy Code</button>
        </div>
        <h3>Users in Room</h3>
        <ul>
          <li>Mac</li>
          <li>Kam</li>
        </ul>
        <p className="typing-indicator">User Typing...</p>
        <select className="language-selector">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button">Leave Room</button>
      </div>
      <div className="editor-wrapper">
        <Editor 
        height={"100%"}
        defaultLanguage={language}
        language={language}
        />
      </div>
    </div>
  );
};

export default App;
