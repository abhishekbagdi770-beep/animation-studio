import fs from "fs";

export class Brain {
  constructor() {
    this.name = "Max";
    this.state = "idle";
    this.memoryFile = "./brain/memory.json";

    try {
      this.memory = JSON.parse(
        fs.readFileSync(this.memoryFile, "utf8")
      );
    } catch {
      this.memory = {};
    }
  }

  saveMemory() {
    fs.writeFileSync(
      this.memoryFile,
      JSON.stringify(this.memory, null, 2)
    );
  }

  rememberFromSentence(input) {
    const patterns = [
      /^my favorite (.+?) is (.+)$/i,
      /^my (.+?) is (.+)$/i,
      /^i live in (.+)$/i,
      /^i like (.+)$/i
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);

      if (!match) continue;

      let key;
      let value;

      if (pattern.source.includes("favorite")) {
        key = `favorite ${match[1].trim()}`;
        value = match[2].trim();
      } else if (pattern.source.includes("live")) {
        key = "location";
        value = match[1].trim();
      } else if (pattern.source.includes("like")) {
        key = "likes";
        value = match[1].trim();
      } else {
        key = match[1].trim();
        value = match[2].trim();
      }

      this.memory[key] = value;
      this.saveMemory();

      return `I'll remember that ${key} is ${value}.`;
    }

    return null;
  }

  retrieveMemory(input) {
    if (input.includes("what is my favorite")) {
      const subject = input
        .replace("what is my favorite", "")
        .replace("?", "")
        .trim();

      const key = `favorite ${subject}`;

      if (this.memory[key]) {
        return `Your favorite ${subject} is ${this.memory[key]}.`;
      }
    }

    if (input.includes("what do i like")) {
      if (this.memory.likes) {
        return `You like ${this.memory.likes}.`;
      }
    }

    if (input.includes("where do i live")) {
      if (this.memory.location) {
        return `You live in ${this.memory.location}.`;
      }
    }

    return null;
  }

  receive(text) {
    this.state = "thinking";

    const input = text.toLowerCase().trim();
    let response;

    if (input.startsWith("remember ")) {
      const information = text.substring(9).trim();
      const parts = information.split(" is ");

      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(" is ").trim();

        this.memory[key] = value;
        this.saveMemory();

        response = `Okay, I'll remember that ${key} is ${value}.`;
      } else {
        response = "Tell me what to remember using: remember X is Y";
      }

    } else if (input.includes("what do you remember")) {
      const memories = Object.entries(this.memory);

      if (memories.length === 0) {
        response = "I don't remember anything yet.";
      } else {
        response = memories
          .map(([key, value]) => `${key} is ${value}`)
          .join("; ");
      }

    } else if (
      input.includes("what is my favorite") ||
      input.includes("what do i like") ||
      input.includes("where do i live")
    ) {
      const remembered = this.retrieveMemory(input);

      response = remembered
        ? remembered
        : "I don't remember that yet.";

    } else if (input.includes("what can you do") || input.includes("what are your abilities") || input.includes("can you help me")) { response = "I can remember information, retrieve memories, understand requests, and respond to you."; } else if (input.includes("hello") || input.includes("hi")) {
      response = "Hello! I'm Max 😎";

    } else if (input.includes("what time") || input.includes("time now")) {
      response = `The time is ${new Date().toLocaleTimeString()}`;

    } else if (input.includes("what date") || input.includes("what day") || input.includes("today")) {
      const now = new Date();
      response = `Today is ${now.toLocaleDateString()} (${now.toLocaleDateString(undefined, { weekday: "long" })})`;

    } else if (input.includes("tomorrow") || input.includes("yesterday")) {
      const d = new Date();
      d.setDate(d.getDate() + (input.includes("tomorrow") ? 1 : -1));
      response = `${input.includes("tomorrow") ? "Tomorrow" : "Yesterday"} is ${d.toLocaleDateString()} (${d.toLocaleDateString(undefined, { weekday: "long" })})`;

    } else if (input.includes("your name")) {
      response = `My name is ${this.name}.`;

    } else {
      const remembered = this.rememberFromSentence(text);

      response = remembered
        ? remembered
        : `I received: "${text}"`;
    }

    this.state = "idle";

    return {
      name: this.name,
      input: text,
      response,
      state: this.state
    };
  }
  getRelativeDate(days) { const date = new Date(); date.setDate(date.getDate() + days); return date.toLocaleDateString(undefined, { day: "numeric", month: "numeric", year: "numeric", weekday: "long" }); }
} 

