import { pipeline } from "@huggingface/transformers";
import fs from "fs";

export class SemanticMemory {
  constructor() {
    this.memories = [];
    this.embedder = null;
    this.model = "Xenova/all-MiniLM-L6-v2";
    this.memoryFile = "./brain/semanticMemory.json";

    this.load();
  }

  load() {
    if (fs.existsSync(this.memoryFile)) {
      this.memories = JSON.parse(fs.readFileSync(this.memoryFile, "utf8"));
      console.log(`Loaded ${this.memories.length} semantic memories.`);
    }
  }

  save() {
    fs.writeFileSync(
      this.memoryFile,
      JSON.stringify(this.memories, null, 2)
    );
  }

  async initialize() {
    if (!this.embedder) {
      this.embedder = await pipeline(
        "feature-extraction",
        this.model
      );
    }
  }

  async embed(text) {
    await this.initialize();

    const result = await this.embedder(text, {
      pooling: "mean",
      normalize: true
    });

    return Array.from(result.data);
  }

  async add(text, metadata = {}) {
    const embedding = await this.embed(text);

    const memory = {
      id: this.memories.length + 1,
      text,
      metadata,
      embedding
    };

    this.memories.push(memory);
    this.save();

    return memory;
  }

  async search(query, limit = 5, minScore = 0.20) {
    const queryEmbedding = await this.embed(query);

    const results = this.memories.map(memory => {
      const score = memory.embedding.reduce(
        (sum, value, i) =>
          sum + value * queryEmbedding[i],
        0
      );

      return {
        id: memory.id,
        text: memory.text,
        metadata: memory.metadata,
        score
      };
    });

    return results
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
