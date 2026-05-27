const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
loadEnvFile(path.join(root, ".env"));

const port = Number(process.env.PORT || 4173);
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

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
Create a true black and white laser engraving image.
The output must be suitable for galvo laser engraving and later PNG-to-SVG conversion.
Use only pure black and pure white. Avoid gray shading, gradients, color, soft airbrush effects, photographic blur, shadows, and busy backgrounds.
Use clean, high-contrast, readable shapes with crisp edges, strong silhouette separation, and engravable line spacing.
Keep the main subject centered with clear negative space. Prefer vector-like line art, stencil-ready shapes, or bold mark/no-mark artwork.
Do not add text unless the user explicitly asks for text.
`.trim();

const pngOptimizationInstructions = `
Rebuild the provided PNG as optimized black and white galvo laser engraving artwork.
Preserve the main subject and composition from the input image, but simplify it for reliable engraving.
Convert color, photo tones, soft shadows, gradients, and gray areas into pure black and pure white mark/no-mark artwork.
Use crisp contours, clean separated line work, strong contrast, and clear negative space.
Avoid tiny noisy dots, muddy texture, blurry edges, gray shading, color, watermarks, mockup backgrounds, and unnecessary text.
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
    `User request: ${prompt}`,
  ].join("\n\n");

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

server.listen(port, "127.0.0.1", () => {
  console.log(`PNG to SVG Converter running at http://127.0.0.1:${port}/`);
});
