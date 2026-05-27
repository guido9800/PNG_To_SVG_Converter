const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
loadEnvFile(path.join(root, ".env"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://127.0.0.1:4173,http://localhost:4173,https://guido9800.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const engravingInstructions = `
You are Laser Tumbler Wrap Designer, a specialized assistant for creating laser engraving artwork for powder-coated stainless steel tumblers.
Always prioritize real-world laser engravability over artistic effects.
Create true 1-bit black and white artwork only: pure black and pure white, no grayscale, no gray tones, no gradients, no blur, no soft shading, no color, no sepia, no photographic gray shading.
Use high contrast, bold clean line art, strong silhouettes, controlled detail, clear negative space, realistic engraving-style line work, trace-friendly connected shapes, and crisp edges.
For realistic images, simulate realism only with black-and-white engraving methods: contour lines, crosshatching, selective stippling, silhouettes, highlights, and negative space.
Avoid fragile micro-details. Assume practical fiber laser details should be larger than about 0.05 mm to 0.08 mm unless the user provides a machine setting.
Optimize for later PNG-to-SVG tracing in Inkscape, Illustrator, LightBurn, CorelDRAW, or similar software: clean outlines, minimal speckles, no fuzzy edges, no low-contrast texture, no thin broken lines.
Do not add text unless the user explicitly asks for text.
`.trim();

const pngOptimizationInstructions = `
Rebuild the provided PNG as optimized black and white galvo laser engraving artwork.
Preserve the main subject and composition from the input image, but simplify it for reliable engraving.
Convert color, photo tones, soft shadows, gradients, and gray areas into true 1-bit pure black and pure white mark/no-mark artwork.
Use crisp contours, clean connected shapes, bold primary outlines, medium secondary detail lines, strong contrast, and clear negative space.
Avoid tiny noisy dots, muddy texture, blurry edges, gray shading, color, watermarks, mockup backgrounds, anti-aliased gray edges, and unnecessary text.
Keep details practical for fiber laser engraving and bitmap tracing; remove speckles and simplify fragile hairlines.
The output should be a PNG that can be traced into a clean SVG for laser engraving.
`.trim();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (origin && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error("Request is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function getStyleInstruction(style) {
  const styles = {
    "line-art": "Style: clean black line art with confident outlines and controlled interior detail.",
    silhouette: "Style: bold black silhouette with minimal cutouts and strong outer shape readability.",
    stencil: "Style: stencil-ready black and white design with separated islands and no fragile hairline gaps.",
    logo: "Style: logo-like black and white mark with simplified geometry and strong brand-style clarity.",
  };
  return styles[style] || styles["line-art"];
}

function getDetailInstruction(detail) {
  const details = {
    simple: "Detail level: simple and bold, prioritizing reliable engraving over fine detail.",
    balanced: "Detail level: balanced, with enough interior line work to be interesting while remaining engravable.",
    detailed: "Detail level: detailed but engravable, with clean separated lines and no muddy texture.",
  };
  return details[detail] || details.balanced;
}

function getBackgroundInstruction(background) {
  const backgrounds = {
    dark: "Tumbler/background: dark powder-coated tumbler. Use a solid black background with white engraving lines. Black means powder coat remains; white means laser removes coating and reveals stainless steel.",
    light: "Tumbler/background: light surface or standard black mark artwork. Use white background with black engraved marks and clean negative space.",
    auto: "Tumbler/background: choose the most engravable black-and-white orientation for the user request. If it is a dark tumbler or full wrap, prefer black background with white engraving lines.",
  };
  return backgrounds[background] || backgrounds.dark;
}

function getWrapInstruction(wrap) {
  if (wrap === "wrap" || wrap === "seamless") {
    return [
      "Layout: panoramic full tumbler wrap.",
      "Make the left and right edges seamless or visually seamless.",
      "Treat the left 10% and right 10% of the canvas as seam zones.",
      "Keep faces, text, logos, animals, hands, weapons, vehicles, and main focal subjects out of the seam zones unless the user explicitly asks.",
      "Use trees, smoke, grass, mountains, brick, waves, clouds, darkness, abstract texture, or background elements to hide and connect the seam.",
      "Match edge density, line weight, brightness, and background texture from left to right.",
      "Keep the primary subject in the central 60-70% of the design."
    ].join(" ");
  }

  return "Layout: single panel or centered artwork with clean margins, strong focal readability, and enough negative space for engraving.";
}

function getRotaryCompensationInstruction(enabled, body) {
  if (!enabled) return "";

  const width = Number(body.physicalWidth);
  const height = Number(body.physicalHeight);
  const unit = body.physicalUnit || "in";
  const sizeNote = width > 0 && height > 0
    ? `True final size is ${width} x ${height} ${unit}; compose as if generated width is approximately ${formatNumber(width * 0.9)} to ${formatNumber(width * 0.92)} ${unit}, with height unchanged at ${height} ${unit}.`
    : "Compose the artwork 8% to 10% narrower in width only while keeping height unchanged.";

  return [
    "Rotary tumbler width compensation: apply practical visual compensation for round tumbler engraving.",
    sizeNote,
    "The user will stretch only the width back to true final engraving size in laser software.",
    "Do not reduce height. Keep vertical proportions and engraving detail stable."
  ].join(" ");
}

function formatNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function parseDataUrlImage(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) {
    const error = new Error("Image must be a PNG, JPG, WEBP, or base64 data URL.");
    error.statusCode = 400;
    throw error;
  }

  return {
    mimeType: match[1].replace("image/jpg", "image/jpeg"),
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function generateEngravingImage(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("replace_with_your_new_openai_api_key")) {
    const error = new Error("OPENAI_API_KEY is not set on the server. Add your new key to the local .env file.");
    error.statusCode = 500;
    throw error;
  }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    const error = new Error("Prompt is required.");
    error.statusCode = 400;
    throw error;
  }

  const size = ["1024x1024", "1536x1024", "1024x1536"].includes(body.size)
    ? body.size
    : "1024x1024";

  const fullPrompt = [
    engravingInstructions,
    getStyleInstruction(body.style),
    getDetailInstruction(body.detail),
    getBackgroundInstruction(body.background),
    getWrapInstruction(body.wrap),
    getRotaryCompensationInstruction(Boolean(body.rotaryCompensation), body),
    body.requestedSize ? `Requested output proportion: ${body.requestedSize}. Keep the artwork composed for this proportion, with enough margin for laser engraving.` : "",
    body.requestedRatio ? `Requested wide-to-tall ratio: ${body.requestedRatio}.` : "",
    "DPI guidance: preserve aspect ratio and use enough pixel detail for 300 DPI minimum engraving prep; final imported physical size must be verified in laser software.",
    `User request: ${prompt}`,
  ].filter(Boolean).join("\n\n");

  const openAiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: fullPrompt,
      size,
      quality: "high",
      n: 1,
    }),
  });

  const rawPayload = await openAiResponse.text();
  const payload = rawPayload ? JSON.parse(rawPayload) : {};
  if (!openAiResponse.ok) {
    const error = new Error(payload.error?.message || "OpenAI image generation failed.");
    error.statusCode = openAiResponse.status;
    throw error;
  }

  let image = payload.data?.[0]?.b64_json;
  if (!image && payload.data?.[0]?.url) {
    const imageResponse = await fetch(payload.data[0].url);
    const arrayBuffer = await imageResponse.arrayBuffer();
    image = Buffer.from(arrayBuffer).toString("base64");
  }

  if (!image) {
    const error = new Error("OpenAI did not return image data.");
    error.statusCode = 502;
    throw error;
  }

  return { image, size, model: imageModel };
}

async function optimizePngForEngraving(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("replace_with_your_new_openai_api_key")) {
    const error = new Error("OPENAI_API_KEY is not set on the server. Add your new key to the local .env file.");
    error.statusCode = 500;
    throw error;
  }

  const source = parseDataUrlImage(body.image);
  if (source.buffer.length > 50 * 1024 * 1024) {
    const error = new Error("Image must be smaller than 50MB.");
    error.statusCode = 400;
    throw error;
  }

  const size = ["1024x1024", "1536x1024", "1024x1536"].includes(body.size)
    ? body.size
    : "1024x1024";

  const formData = new FormData();
  formData.set("model", imageModel);
  formData.set("prompt", pngOptimizationInstructions);
  formData.set("size", size);
  formData.set("quality", "high");
  formData.set("n", "1");
  formData.set("image", new Blob([source.buffer], { type: source.mimeType }), body.fileName || "source.png");

  const openAiResponse = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const rawPayload = await openAiResponse.text();
  const payload = rawPayload ? JSON.parse(rawPayload) : {};
  if (!openAiResponse.ok) {
    const error = new Error(payload.error?.message || "OpenAI image edit failed.");
    error.statusCode = openAiResponse.status;
    throw error;
  }

  let image = payload.data?.[0]?.b64_json;
  if (!image && payload.data?.[0]?.url) {
    const imageResponse = await fetch(payload.data[0].url);
    const arrayBuffer = await imageResponse.arrayBuffer();
    image = Buffer.from(arrayBuffer).toString("base64");
  }

  if (!image) {
    const error = new Error("OpenAI did not return optimized image data.");
    error.statusCode = 502;
    throw error;
  }

  return { image, size, model: imageModel };
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "POST" && request.url === "/api/generate-engraving") {
      const body = await readRequestJson(request);
      const result = await generateEngravingImage(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && request.url === "/api/optimize-png") {
      const body = await readRequestJson(request);
      const result = await optimizePngForEngraving(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET") {
      serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message || "Server error." });
  }
});

server.listen(port, host, () => {
  console.log(`PNG to SVG Converter running at http://127.0.0.1:${port}/`);
});
