import express from "express";
import http from "http";
import { use } from "react";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();
const roomData = new Map(); // Store room code and language

io.on("connection", (socket) => {
  console.log("User is connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      // Initialize room data with empty code and default language
      roomData.set(roomId, { code: "", language: "javascript" });
    }
    rooms.get(roomId).add(userName);
    
    // Send current room state to the newly joined user (with small delay to ensure frontend is ready)
    const currentRoomData = roomData.get(roomId);
    console.log(`Sending current state to ${userName}: code length = ${currentRoomData.code.length}, language = ${currentRoomData.language}`);
    setTimeout(() => {
      socket.emit("codeUpdate", currentRoomData.code);
      socket.emit("languageUpdate", currentRoomData.language);
    }, 100);
    
    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
  });

  socket.on("codeChange", ({ roomId, code }) => {
    // Update room data with new code
    if (roomData.has(roomId)) {
      roomData.get(roomId).code = code;
      console.log(`Code updated for room ${roomId}: length = ${code.length}`);
    }
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      
      // Clean up room data if no users left
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        roomData.delete(currentRoom);
      } else {
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
      }

      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    // Update room data with new language
    if (roomData.has(roomId)) {
      roomData.get(roomId).language = language;
    }
    socket.to(roomId).emit("languageUpdate", language);
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      
      // Clean up room data if no users left
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        roomData.delete(currentRoom);
      } else {
        io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
      }
    }
    console.log("User disconnected");
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log("Server is running on Port 5000");
});
