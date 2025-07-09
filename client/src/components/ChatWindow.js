import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";

export default function ChatWindow({ username, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("join_room", room);

    socket.on("room_messages", ({ room: r, messages }) => {
      if (r === room) setMessages(messages);
    });

    socket.on("receive_room_message", (msg) => {
      if (msg.room === room) setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit("leave_room", room);
      socket.off("room_messages");
      socket.off("receive_room_message");
    };
  }, [room]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit("send_room_message", { room, message: input });
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc" }}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <b>{msg.sender}:</b> {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
} 