const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected as", socket.id);

  // Join a room
  socket.emit("join_room", "general");

  // Send a message to the room after joining
  setTimeout(() => {
    socket.emit("send_room_message", { room: "general", message: "Hello, room!" });
  }, 1000);
});

socket.on("joined_room", (room) => {
  console.log("Joined room:", room);
});

socket.on("room_messages", ({ room, messages }) => {
  console.log(`History for room ${room}:`, messages);
});

socket.on("receive_room_message", (msg) => {
  console.log("New room message:", msg);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
}); 