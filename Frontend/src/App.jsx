import "./App.css"
import io from "socket.io-client"

const socket = io("http://localhost:5000")

const App = () => {
  return (
    <div>App</div>
  )
}

export default App