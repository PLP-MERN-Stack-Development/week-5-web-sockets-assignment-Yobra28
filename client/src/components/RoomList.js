import React, { useEffect, useState } from "react";
import axios from "axios";

export default function RoomList({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");

  useEffect(() => {
    axios.get("/api/rooms").then(res => setRooms(res.data));
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoom.trim()) {
      onSelectRoom(newRoom.trim());
      setNewRoom("");
    }
  };

  return (
    <div>
      <h3>Rooms</h3>
      <ul>
        {rooms.map(room => (
          <li key={room._id}>
            <button onClick={() => onSelectRoom(room.name)}>{room.name}</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateRoom}>
        <input
          placeholder="New room name"
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
        />
        <button type="submit">Create/Join</button>
      </form>
    </div>
  );
} 