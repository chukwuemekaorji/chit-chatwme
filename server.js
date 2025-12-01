const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

let rooms = {}; // { roomName: [socket1, socket2] }

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    const { type, room } = data;

    if (type === "join") {
      if (!rooms[room]) {
        rooms[room] = [];
      }

      if (rooms[room].length >= 2) {
        ws.send(JSON.stringify({ type: "room_full" }));
        return;
      }

      rooms[room].push(ws);
      ws.room = room;

      ws.send(JSON.stringify({ type: "joined" }));

      if (rooms[room].length === 2) {
        rooms[room].forEach((client) => {
          client.send(JSON.stringify({ type: "ready" }));
        });
      }
    }

    if (type === "signal") {
      rooms[room].forEach((client) => {
        if (client !== ws) client.send(JSON.stringify(data));
      });
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter((c) => c !== ws);
      if (rooms[ws.room].length === 0) delete rooms[ws.room];
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
