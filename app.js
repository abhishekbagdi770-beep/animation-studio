const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const pencilBtn = document.getElementById("pencil");
const eraserBtn = document.getElementById("eraser");
const colorInput = document.getElementById("color");
const sizeSelect = document.getElementById("size");
const clearBtn = document.getElementById("clear");

const addFrameBtn = document.getElementById("add-frame");
const deleteFrameBtn = document.getElementById("delete-frame");
const playBtn = document.getElementById("play");
const extractBtn = document.getElementById("extract");
const exportBtn = document.getElementById("export");
const framesEl = document.getElementById("frames");

let tool = "pencil";
let drawing = false;
let currentStroke = null;
let currentFrame = 0;
let playing = false;
let playTimer = null;

/*
  IMPORTANT:
  Every frame has its OWN strokes.
  Nothing is shared between frames.
*/
let frames = [
  {
    strokes: []
  }
];

/* ---------------- Canvas ---------------- */

function resizeCanvas() {
  // Keep the real drawing resolution.
  // CSS is allowed to scale it on the phone.
  if (canvas.width !== 1280) canvas.width = 1280;
  if (canvas.height !== 720) canvas.height = 720;

  redraw();
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function drawStroke(stroke, alpha = 1) {
  if (!stroke || !stroke.points || stroke.points.length === 0) return;

  ctx.save();

  ctx.globalAlpha = alpha;

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }

  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const points = stroke.points;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);

    if (stroke.tool === "eraser") {
      ctx.fillStyle = "#000";
    } else {
      ctx.fillStyle = stroke.color;
    }

    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.restore();
}

/*
  Onion skin:
  Only the immediately previous frame is shown,
  and it is drawn faintly.
*/
let onionSkin = false;

function drawOnionSkin() {
  if (!onionSkin || currentFrame <= 0) return;

  const previous = frames[currentFrame - 1];

  if (!previous) return;

  for (const stroke of previous.strokes) {
    if (stroke.tool !== "eraser") {
      drawStroke(stroke, 0.18);
    }
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // White background.
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Previous frame = onion skin.
  drawOnionSkin();

  // Current frame only.
  const frame = frames[currentFrame];

  if (frame) {
    for (const stroke of frame.strokes) {
      drawStroke(stroke, 1);
    }
  }
}

/* ---------------- Drawing ---------------- */

function startDrawing(event) {
  event.preventDefault();

  drawing = true;

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (e) {}

  const point = getPoint(event);

  currentStroke = {
    tool,
    color: colorInput.value,
    size: Number(sizeSelect.value),
    points: [point]
  };

  frames[currentFrame].strokes.push(currentStroke);

  redraw();
}

function draw(event) {
  if (!drawing || !currentStroke) return;

  event.preventDefault();

  const point = getPoint(event);

  currentStroke.points.push(point);

  redraw();
}

function stopDrawing(event) {
  if (!drawing) return;

  event.preventDefault();

  drawing = false;
  currentStroke = null;

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (e) {}

  redraw();
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

/* ---------------- Tools ---------------- */

pencilBtn.addEventListener("click", () => {
  tool = "pencil";

  pencilBtn.classList.add("active");
  eraserBtn.classList.remove("active");
});

eraserBtn.addEventListener("click", () => {
  tool = "eraser";

  eraserBtn.classList.add("active");
  pencilBtn.classList.remove("active");
});

clearBtn.addEventListener("click", () => {
  frames[currentFrame].strokes = [];
  redraw();
});

/* ---------------- Frames ---------------- */

function renderFrames() {
  framesEl.innerHTML = "";

  frames.forEach((frame, index) => {
    const button = document.createElement("button");

    button.className = "frame";

    if (index === currentFrame) {
      button.classList.add("active-frame");
    }

    button.textContent = `Frame ${index + 1}`;

    button.addEventListener("click", () => {
      if (playing) return;

      currentFrame = index;
      redraw();
      renderFrames();
    });

    framesEl.appendChild(button);
  });
}

addFrameBtn.addEventListener("click", () => {
  /*
    IMPORTANT:
    A new frame starts EMPTY.
    It does NOT copy the previous frame.
  */
  frames.push({
    strokes: []
  });

  currentFrame = frames.length - 1;

  redraw();
  renderFrames();
});

deleteFrameBtn.addEventListener("click", () => {
  if (frames.length <= 1) {
    frames[0].strokes = [];
    currentFrame = 0;
  } else {
    frames.splice(currentFrame, 1);

    if (currentFrame >= frames.length) {
      currentFrame = frames.length - 1;
    }
  }

  redraw();
  renderFrames();
});

/* ---------------- Playback ---------------- */

function showNextFrame() {
  currentFrame++;

  if (currentFrame >= frames.length) {
    currentFrame = 0;
  }

  redraw();
  renderFrames();
}

function stopPlayback() {
  playing = false;

  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }

  playBtn.textContent = "▶️ Play";
}

playBtn.addEventListener("click", () => {
  if (frames.length <= 1) return;

  if (playing) {
    stopPlayback();
    return;
  }

  playing = true;
  playBtn.textContent = "⏹ Stop";

  playTimer = setInterval(showNextFrame, 120);
});

/* ---------------- Video ---------------- */

function getVideoMimeType() {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

async function createVideo() {
  if (!canvas.captureStream || !window.MediaRecorder) {
    alert("This browser does not support video recording.");
    return;
  }

  const mimeType = getVideoMimeType();

  if (!mimeType) {
    alert("WebM video recording is not supported in this browser.");
    return;
  }

  const stream = canvas.captureStream(8);

  const recorder = new MediaRecorder(stream, {
    mimeType
  });

  const chunks = [];

  recorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const finished = new Promise(resolve => {
    recorder.onstop = resolve;
  });

  recorder.start();

  /*
    Record every frame WITHOUT onion skin.
    We temporarily draw only the real current frame.
  */
  const oldFrame = currentFrame;

  for (let i = 0; i < frames.length; i++) {
    currentFrame = i;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of frames[i].strokes) {
      drawStroke(stroke, 1);
    }

    await new Promise(resolve => setTimeout(resolve, 125));
  }

  recorder.stop();

  await finished;

  currentFrame = oldFrame;
  redraw();
  renderFrames();

  const blob = new Blob(chunks, {
    type: mimeType
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "animation.webm";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

extractBtn.addEventListener("click", createVideo);
exportBtn.addEventListener("click", createVideo);

/* ---------------- Start ---------------- */

resizeCanvas();
renderFrames();

console.log("Animation Studio drawing + frame system ready.");


const onionBtn = document.getElementById("onion");

if (onionBtn) {
  onionBtn.addEventListener("click", () => {
    onionSkin = !onionSkin;
    onionBtn.textContent = onionSkin ? "🧅 Onion: ON" : "🧅 Onion: OFF";
    redraw();
  });
}
