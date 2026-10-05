const messages = document.getElementById("messages");
const input = document.getElementById("input");
const send = document.getElementById("send");

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  input.focus();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data && data.response) {
      addMessage(data.response, "max");
    } else {
      addMessage("Max didn't return a response.", "max");
      console.error("Invalid Max response:", data);
    }
  } catch (error) {
    console.error("Max connection error:", error);
    addMessage("Max couldn't respond. Check the server.", "max");
  }
}

send.addEventListener("click", sendMessage);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});
