import { useState } from "react";
import { useEffect } from "react";
import "./App.css";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");
const App = () => {
  // Initialize state from localStorage if available
  const getStoredState = () => {
    try {
      const stored = localStorage.getItem('codeEditorState');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const storedState = getStoredState();
  
  const [joined, setJoined] = useState(storedState?.joined || false);
  const [roomId, setRoomId] = useState(storedState?.roomId || "");
  const [userName, setuserName] = useState(storedState?.userName || "");
  const [language, setLanguage] = useState(storedState?.language || "javascript");
  const [code, setCode] = useState(storedState?.code || "// Bored? So built Your code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("")
  const [outPut, setOutPut] = useState("")
  const [version, setVersion] = useState("*")

  const saveState = () => {
    const stateToSave = {
      joined,
      roomId,
      userName,
      language,
      code
    };
    localStorage.setItem('codeEditorState', JSON.stringify(stateToSave));
  };

  // Clear state from localStorage
  const clearState = () => {
    localStorage.removeItem('codeEditorState');
  };

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user)=> {
      setTyping(`${user.slice(0,8)}...is typing`)
      setTimeout(() => setTyping(""), 2000)
    })

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage)
    })

    socket.on("codeResponse", (response) => {
      setOutPut(response.run.output)
    })

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping")
      socket.off("languageUpdate")
      socket.off("codeResponse")
    };
  }, []);
  
  // Auto-rejoin room on page load if user was previously in a room
  useEffect(() => {
    if (storedState && storedState.joined && storedState.roomId && storedState.userName) {
      console.log('Auto-rejoining room:', storedState.roomId);
      socket.emit("join", { roomId: storedState.roomId, userName: storedState.userName });
      setJoined(true);
    }
  }, []);
  
  // Save state whenever important values change
  useEffect(() => {
    if (joined) {
      saveState();
    }
  }, [joined, roomId, userName, language, code]);
  
  useEffect(() => {
      const handleBeforeUnload = () => {
        socket.emit("leaveRoom");
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };
  
  const leaveRoom = () => {
    socket.emit("leaveRoom")
    setJoined(false)
    setRoomId("")
    setuserName("")
    setCode("// Bored? So built Your code here")
    setLanguage("javascript")
    clearState() 
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Code Copied");
    setTimeout(() => setCopySuccess(""), 3000);
  };

  const handleChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", {roomId, userName})
  };

  const handleLanguageChange = e => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    socket.emit("languageChange",{roomId, language: newLanguage})
  }

  const runCode = () => {
    socket.emit("compileCode", {code, roomId, language, version})
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
    // Side Bar
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Room Code: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">
            Copy Code
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}...</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>Leave Room</button>
      </div>

      {/* Editor Section */}
      <div className="editor-wrapper">
        <Editor
          height={"70%"}
          language={language}
          value={code}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 16,
          }}
        />
        <button className="run-btn" onClick={runCode}>Run Code</button>
        <textarea className="output-console" value={outPut} readOnly placeholder="Your code will execute here..." />
      </div>
    </div>
  );
};

export default App;
