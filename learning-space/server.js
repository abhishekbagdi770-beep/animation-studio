import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Brain } from "../brain/Brain.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const brain = new Brain();

const PORT = process.env.PORT || 3000;

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css"
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";

    req.on("data", chunk => body += chunk);

    req.on("end", async () => {
      try {
        const { text } = JSON.parse(body);
        const result = await brain.receive(text.trim());

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify(result));
      } catch (error) {
        console.error(error);

        res.writeHead(500, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          error: "Max could not respond."
        }));
      }
    });

    return;
  }

  const requested = req.url === "/" ? "index.html" : req.url.slice(1);
  const file = path.join(__dirname, requested);

  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": types[path.extname(file)] || "text/plain"
  });

  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`MAX Learning Space running on port ${PORT}`);
});
