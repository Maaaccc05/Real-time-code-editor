import axios from "axios";
import express from "express";
import http from "http";
import { version } from "os";
import { Server } from "socket.io";
import path  from "path";

const app = express();
const server = http.createServer(app);

// const interval = 30000;
// function reloadWebsite() {
//   axios
//     .get(url)
//     .then((response) => {
//       console.log("website reloded");
//     })
//     .catch((error) => {
//       console.error(`Error : ${error.message}`);
//     });
// }

// setInterval(reloadWebsite, interval);

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
      if (rooms.has(currentRoom) && rooms.get(currentRoom).size > 0) {
        io.to(currentRoom).emit(
          "userJoined",
          Array.from(rooms.get(currentRoom))
        );
      }
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      roomData.set(roomId, { code: "", language: "javascript" });
    }
    rooms.get(roomId).add(userName);

    const currentRoomData = roomData.get(roomId);
    console.log(
      `Sending current state to ${userName}: code length = ${currentRoomData.code.length}, language = ${currentRoomData.language}`
    );
    setTimeout(() => {
      socket.emit("codeUpdate", currentRoomData.code);
      socket.emit("languageUpdate", currentRoomData.language);
    }, 100);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });

  socket.on("codeChange", ({ roomId, code }) => {
    if (roomData.has(roomId)) {
      roomData.get(roomId).code = code;
      console.log(`Code updated for room ${roomId}: length = ${code.length}`);
    }
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);

      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        roomData.delete(currentRoom);
      } else {
        if (rooms.has(currentRoom)) {
          io.to(currentRoom).emit(
            "userJoined",
            Array.from(rooms.get(currentRoom))
          );
        }
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
    if (roomData.has(roomId)) {
      roomData.get(roomId).language = language;
    }
    socket.to(roomId).emit("languageUpdate", language);
  });

  socket.on("compileCode", async ({ code, roomId, language, version }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language,
          version,
          files: [
            {
              content: code,
            },
          ],
        }
      );
      room.output = response.data.run.output;
      io.to(roomId).emit("codeResponse", response.data);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        roomData.delete(currentRoom);
      } else {
        if (rooms.has(currentRoom)) {
          io.to(currentRoom).emit(
            "userJoined",
            Array.from(rooms.get(currentRoom))
          );
        }
      }
    }
    console.log("User disconnected");
  });
});

const port = process.env.PORT || 5000;

const __dirname = path.resolve()

app.use(express.static(path.join(__dirname, "/frontend/dist")))

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});


server.listen(port, () => {
  console.log("Server is running on Port 5000");
});
