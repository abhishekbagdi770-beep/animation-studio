import { Brain } from "./Brain.js";

const brain = new Brain();

console.log("\n--- TEST 1: REMEMBER ---");
console.log(brain.receive("Remember my favorite color is blue"));

console.log("\n--- TEST 2: REMEMBER ---");
console.log(brain.receive("Remember my favorite game is MLBB"));

console.log("\n--- TEST 3: RETRIEVE ---");
console.log(brain.receive("What is my favorite game?"));

console.log("\n--- TEST 4: RETRIEVE ---");
console.log(brain.receive("What do I like?"));

console.log("\n--- TEST 5: NORMAL TALK ---");
console.log(brain.receive("Hello"));
