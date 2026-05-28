const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
loadEnvFile(path.join(root, ".env"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
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

const engravingInstructions = loadPromptFile("prompts/laser-tumbler-wrap-designer.md", `
You are Laser Tumbler Wrap Designer. Create true 1-bit black-and-white, high-contrast, laser engraving ready artwork with bold clean line work, trace-friendly shapes, no grayscale, no gradients, and no fragile micro-details.
`);

const pngOptimizationInstructions = loadPromptFile("prompts/png-optimization.md", `
Rebuild the provided PNG as optimized true black-and-white galvo laser engraving artwork with clean trace-friendly edges, strong contrast, no grayscale, no color, and no fragile noise.
`);

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
    process.env[key] = value;
  }
}

function loadPromptFile(relativePath, fallback) {
  try {
    const promptPath = path.join(root, relativePath);
    const prompt = fs.readFileSync(promptPath, "utf8").trim();
    return prompt || fallback.trim();
  } catch {
    return fallback.trim();
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
    realistic: "Style: realistic laser engraving artwork using only pure black and pure white. Simulate realism with contour lines, selective crosshatching, clean highlights, silhouettes, and controlled negative space; no grayscale or soft shading.",
    "high-contrast": "Style: extremely high contrast black and white artwork with strong mark/no-mark separation, bold readable forms, and no midtones.",
    "line-art": "Style: bold clean line art with confident outlines, controlled interior detail, and trace-friendly connected shapes.",
    "vector-illustration": "Style: vector-style illustration with crisp geometric edges, clean filled shapes, simplified forms, and no fuzzy texture.",
    silhouette: "Style: bold black silhouette with minimal cutouts and strong outer shape readability.",
    stencil: "Style: stencil art with separated islands, bridged shapes where needed, strong cutout readability, and no fragile hairline gaps.",
    logo: "Style: logo-like black and white mark with simplified geometry and strong brand-style clarity.",
    woodcut: "Style: woodcut and linocut inspired engraving with bold carved lines, intentional hatch marks, rugged high contrast texture, and clean traceable edges.",
    "engraving-portrait": "Style: engraving-style portrait with realistic facial structure, bold contour lines, controlled crosshatching, clear highlights, and no gray shading.",
    "laser-friendly": "Style: laser engraving friendly artwork with bold practical line spacing, simplified traceable geometry, minimal speckles, and durable details.",
    "negative-space": "Style: negative space shading using black/white shape design, clean highlight cutouts, controlled shadow masses, and no gray gradient shading.",
    "white-linework": "Style: white linework on solid black background, designed for dark powder-coated tumblers where white marks represent laser-removed coating.",
    "fur-texture": "Style: sharp fur texture built from clean black-and-white tapered line groups, bold fur direction, readable animal form, and no tiny noisy hairlines.",
    "front-dog-portrait": "Style: symmetrical front-facing dog portrait with realistic eyes, muzzle, ears, and fur texture; centered sticker-like composition; pure black and white only.",
    "sticker-logo": "Style: sticker/logo-style composition with strong outer silhouette, clean interior details, bold readable shape language, and simple trace-friendly edges.",
    cartoon: "Style: cartoon engraving style with expressive simplified shapes, bold outlines, high contrast, clean white/black areas, and no gray fills.",
  };
  return styles[style] || styles["line-art"];
}

function getDetailInstruction(detail) {
  const details = {
    simple: "Detail level: simple and bold, prioritizing reliable engraving over fine detail.",
    balanced: "Detail level: balanced, with enough interior line work to be interesting while remaining engravable.",
    detailed: "Detail level: detailed but engravable, with clean separated lines and no muddy texture.",
    realistic: "Detail level: realistic, with the most lifelike black-and-white engraving detail possible while preserving clean edges, practical laser line spacing, and trace-friendly contrast.",
  };
  return details[detail] || details.balanced;
}

function getLineWeightInstruction(lineWeight) {
  const weights = {
    normal: "Line strength: use normal trace-friendly engraving lines with clear spacing.",
    bold: "Line strength: use bolder engraving lines and stronger primary outlines so details survive powder-coat marking.",
    heavy: "Line strength: use heavy, highly readable mark lines, simplified interior detail, and extra separation between shapes.",
    fine: "Line strength: allow finer detail, but keep every line practical for laser engraving and SVG tracing.",
  };
  return weights[lineWeight] || weights.normal;
}

function getCleanupInstruction(cleanup) {
  const cleanupModes = {
    balanced: "Cleanup target: balanced 1-bit output with clean edges, minimal speckles, and controlled detail.",
    crisp: "Cleanup target: crisp high-contrast edges, fewer gray transition pixels, and clean closed shapes for tracing.",
    aggressive: "Cleanup target: aggressive speckle reduction, simplified texture, no tiny dust-like dots, and bold connected shapes.",
    preserve: "Cleanup target: preserve more intentional fine detail while still avoiding grayscale, fuzz, and fragile hairlines.",
  };
  return cleanupModes[cleanup] || cleanupModes.balanced;
}

function getResolutionInstruction(upscale) {
  const factor = Number(upscale) || 1;
  if (factor > 1) {
    return `Final output workflow: after OpenAI returns the image, the app will locally upscale the PNG ${factor}x and force clean black/white pixels. Compose with enough clean shape separation to survive that final upscale and threshold cleanup.`;
  }
  return "Final output workflow: native OpenAI output size with clean black/white pixels and trace-friendly contrast.";
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

function getOpenAiGenerationSize(body) {
  if (!isGptImage2Model()) {
    return getLegacyOpenAiSize(body.size);
  }

  const physical = getPhysicalDimensionsInches(body);
  if (physical) {
    return fitGptImage2Size(physical.width * 300, physical.height * 300);
  }

  const ratio = getRequestedRatio(body) || getRatioFromLegacySize(body.size) || 1;
  const longEdge = 2560;
  const width = ratio >= 1 ? longEdge : longEdge * ratio;
  const height = ratio >= 1 ? longEdge / ratio : longEdge;
  return fitGptImage2Size(width, height);
}

function getOpenAiEditSize(body) {
  if (isGptImage2Model()) {
    const ratio = getRatioFromLegacySize(body.size) || 1;
    const longEdge = 2048;
    const width = ratio >= 1 ? longEdge : longEdge * ratio;
    const height = ratio >= 1 ? longEdge / ratio : longEdge;
    return fitGptImage2Size(width, height);
  }

  return getLegacyOpenAiSize(body.size);
}

function isGptImage2Model() {
  return /^gpt-image-2(?:$|-)/i.test(imageModel);
}

function getLegacyOpenAiSize(size) {
  return ["1024x1024", "1536x1024", "1024x1536"].includes(size) ? size : "1024x1024";
}

function getRatioFromLegacySize(size) {
  const match = /^(\d+)x(\d+)$/i.exec(String(size || ""));
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? width / height : null;
}

function getRequestedRatio(body) {
  const ratio = Number(body.requestedRatio);
  if (ratio > 0) return ratio;

  const size = String(body.requestedSize || "");
  const ratioMatch = /(\d+(?:\.\d+)?)\s*[:x]\s*(\d+(?:\.\d+)?)/i.exec(size);
  if (!ratioMatch) return null;
  const width = Number(ratioMatch[1]);
  const height = Number(ratioMatch[2]);
  return width > 0 && height > 0 ? width / height : null;
}

function getPhysicalDimensionsInches(body) {
  const width = Number(body.physicalWidth);
  const height = Number(body.physicalHeight);
  if (!(width > 0) || !(height > 0)) return null;

  const unit = String(body.physicalUnit || "in").toLowerCase();
  const multipliers = {
    in: 1,
    inch: 1,
    inches: 1,
    mm: 1 / 25.4,
    millimeter: 1 / 25.4,
    millimeters: 1 / 25.4,
    cm: 1 / 2.54,
    centimeter: 1 / 2.54,
    centimeters: 1 / 2.54,
  };
  const multiplier = multipliers[unit] || 1;
  return { width: width * multiplier, height: height * multiplier };
}

function fitGptImage2Size(targetWidth, targetHeight) {
  const maxEdge = 3840;
  const minPixels = 655360;
  const maxPixels = 8294400;
  let width = Math.max(16, Number(targetWidth) || 1024);
  let height = Math.max(16, Number(targetHeight) || 1024);

  let ratio = width / height;
  if (ratio > 3) {
    ratio = 3;
    height = width / ratio;
  } else if (ratio < 1 / 3) {
    ratio = 1 / 3;
    width = height * ratio;
  }

  const edgeScale = Math.min(1, maxEdge / Math.max(width, height));
  width *= edgeScale;
  height *= edgeScale;

  const totalPixels = width * height;
  if (totalPixels > maxPixels) {
    const scale = Math.sqrt(maxPixels / totalPixels);
    width *= scale;
    height *= scale;
  } else if (totalPixels < minPixels) {
    const scale = Math.sqrt(minPixels / totalPixels);
    width *= scale;
    height *= scale;
  }

  width = roundToMultipleOf16(width);
  height = roundToMultipleOf16(height);

  while (width * height > maxPixels || width > maxEdge || height > maxEdge || Math.max(width, height) / Math.min(width, height) > 3) {
    if (width >= height) {
      width -= 16;
    } else {
      height -= 16;
    }
  }

  while (width * height < minPixels) {
    if (width <= height && width + 16 <= maxEdge && (height / (width + 16)) <= 3) {
      width += 16;
    } else if (height + 16 <= maxEdge && ((height + 16) / width) <= 3) {
      height += 16;
    } else {
      break;
    }
  }

  return `${width}x${height}`;
}

function roundToMultipleOf16(value) {
  return Math.max(16, Math.round(value / 16) * 16);
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

  const size = getOpenAiGenerationSize(body);

  const fullPrompt = [
    engravingInstructions,
    getStyleInstruction(body.style),
    getDetailInstruction(body.detail),
    getLineWeightInstruction(body.lineWeight),
    getCleanupInstruction(body.cleanup),
    getResolutionInstruction(body.upscale),
    getBackgroundInstruction(body.background),
    getWrapInstruction(body.wrap),
    getRotaryCompensationInstruction(Boolean(body.rotaryCompensation), body),
    body.requestedSize ? `Requested output proportion: ${body.requestedSize}. Keep the artwork composed for this proportion, with enough margin for laser engraving.` : "",
    body.requestedRatio ? `Requested wide-to-tall ratio: ${body.requestedRatio}.` : "",
    `Native API output size requested: ${size}.`,
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

  const size = getOpenAiEditSize(body);

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
