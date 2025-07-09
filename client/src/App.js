import React, { useState } from "react";
import { socket } from "./socket/socket";
import Login from "./components/Login";
import RoomList from "./components/RoomList";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleLogin = (name) => {
    setUsername(name);
    socket.emit("user_join", name);
  };

  if (!username) return <Login onLogin={handleLogin} />;
  if (!room) return <RoomList onSelectRoom={setRoom} />;

  return (
    <div>
      <button onClick={() => setRoom("")}>Back to rooms</button>
      <ChatWindow username={username} room={room} />
    </div>
  );
}

export default App; 