import express from 'express'
import http from 'http'
import { Server } from 'socket.io'  

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*",
    },
})

const rooms = new Map()

io.on("connection", (socket) => {
    console.log("User is connected", socket.id)

    let currentRoom = null
    let currentUser = null

    socket.on("join", ({roomId, userName})=>{
        if(currentRoom){
            socket.leave(currentRoom)
            rooms.get(currentRoom).delete(currentUser)
        }
    })
})



const port = process.env.PORT || 5000
server.listen(port, () =>{
    console.log("Server is running on Port 5000")
})