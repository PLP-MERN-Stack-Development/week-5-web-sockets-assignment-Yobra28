import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Enter your username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <button type="submit">Join</button>
    </form>
  );
} 