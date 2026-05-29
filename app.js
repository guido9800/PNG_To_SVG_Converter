const state = {
  file: null,
  image: null,
  pngDataUrl: "",
  pngDpi: null,
  svg: "",
  result: null,
  aspectRatio: 1,
  syncingSize: false,
  previewZoom: 100,
  generatedPng: "",
};

const els = {
  dashboardView: document.querySelector("#dashboardView"),
  generatorView: document.querySelector("#generatorView"),
  converterView: document.querySelector("#converterView"),
  openGeneratorBtn: document.querySelector("#openGeneratorBtn"),
  openConverterBtn: document.querySelector("#openConverterBtn"),
  heroGeneratorBtn: document.querySelector("#heroGeneratorBtn"),
  heroConverterBtn: document.querySelector("#heroConverterBtn"),
  backHomeButtons: document.querySelectorAll(".back-home"),
  engravingPrompt: document.querySelector("#engravingPrompt"),
  engravingStyle: document.querySelector("#engravingStyle"),
  engravingDetail: document.querySelector("#engravingDetail"),
  engravingLineWeight: document.querySelector("#engravingLineWeight"),
  engravingCleanup: document.querySelector("#engravingCleanup"),
  engravingUpscale: document.querySelector("#engravingUpscale"),
  engravingBackground: document.querySelector("#engravingBackground"),
  engravingWrap: document.querySelector("#engravingWrap"),
  engravingSize: document.querySelector("#engravingSize"),
  customEngravingSize: document.querySelector("#customEngravingSize"),
  engravingCustomWidth: document.querySelector("#engravingCustomWidth"),
  engravingCustomHeight: document.querySelector("#engravingCustomHeight"),
  engravingCustomUnit: document.querySelector("#engravingCustomUnit"),
  engravingSizeHint: document.querySelector("#engravingSizeHint"),
  rotaryCompensation: document.querySelector("#rotaryCompensation"),
  generateEngravingBtn: document.querySelector("#generateEngravingBtn"),
  generatorProgress: document.querySelector("#generatorProgress"),
  generatorStatus: document.querySelector("#generatorStatus"),
  generatedPreview: document.querySelector("#generatedPreview"),
  generatedMeta: document.querySelector("#generatedMeta"),
  downloadGeneratedBtn: document.querySelector("#downloadGeneratedBtn"),
  sendGeneratedToConverterBtn: document.querySelector("#sendGeneratedToConverterBtn"),
  sendGeneratedToConverterPreviewBtn: document.querySelector("#sendGeneratedToConverterPreviewBtn"),
  aiOptimizeBtn: document.querySelector("#aiOptimizeBtn"),
  aiOptimizeStatus: document.querySelector("#aiOptimizeStatus"),
  fileInput: document.querySelector("#fileInput"),
  dropZone: document.querySelector("#dropZone"),
  sourceCanvas: document.querySelector("#sourceCanvas"),
  svgPreview: document.querySelector("#svgPreview"),
  svgCode: document.querySelector("#svgCode"),
  previewBtn: document.querySelector("#previewBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  mode: document.querySelector("#mode"),
  maxSize: document.querySelector("#maxSize"),
  dpi: document.querySelector("#dpi"),
  physicalWidth: document.querySelector("#physicalWidth"),
  physicalHeight: document.querySelector("#physicalHeight"),
  colors: document.querySelector("#colors"),
  smoothness: document.querySelector("#smoothness"),
  photoContrast: document.querySelector("#photoContrast"),
  edgeSensitivity: document.querySelector("#edgeSensitivity"),
  lineWeight: document.querySelector("#lineWeight"),
  threshold: document.querySelector("#threshold"),
  simplify: document.querySelector("#simplify"),
  cornerSmoothing: document.querySelector("#cornerSmoothing"),
  minFeature: document.querySelector("#minFeature"),
  alpha: document.querySelector("#alpha"),
  trim: document.querySelector("#trim"),
  background: document.querySelector("#background"),
  invert: document.querySelector("#invert"),
  maxSizeValue: document.querySelector("#maxSizeValue"),
  dpiValue: document.querySelector("#dpiValue"),
  sizeValue: document.querySelector("#sizeValue"),
  colorsValue: document.querySelector("#colorsValue"),
  smoothnessValue: document.querySelector("#smoothnessValue"),
  photoContrastValue: document.querySelector("#photoContrastValue"),
  edgeSensitivityValue: document.querySelector("#edgeSensitivityValue"),
  lineWeightValue: document.querySelector("#lineWeightValue"),
  thresholdValue: document.querySelector("#thresholdValue"),
  simplifyValue: document.querySelector("#simplifyValue"),
  cornerSmoothingValue: document.querySelector("#cornerSmoothingValue"),
  minFeatureValue: document.querySelector("#minFeatureValue"),
  alphaValue: document.querySelector("#alphaValue"),
  inputStats: document.querySelector("#inputStats"),
  outputStats: document.querySelector("#outputStats"),
  shapeStats: document.querySelector("#shapeStats"),
  fileName: document.querySelector("#fileName"),
  status: document.querySelector("#status"),
  codeSize: document.querySelector("#codeSize"),
  modeInfoBtn: document.querySelector("#modeInfoBtn"),
  modeInfoDialog: document.querySelector("#modeInfoDialog"),
  controlHelpDialog: document.querySelector("#controlHelpDialog"),
  controlHelpTitle: document.querySelector("#controlHelpTitle"),
  controlHelpBody: document.querySelector("#controlHelpBody"),
  downloadPreviewDialog: document.querySelector("#downloadPreviewDialog"),
  downloadPreviewSurface: document.querySelector("#downloadPreviewSurface"),
  downloadPreviewStats: document.querySelector("#downloadPreviewStats"),
  previewZoom: document.querySelector("#previewZoom"),
  previewZoomValue: document.querySelector("#previewZoomValue"),
  zoomOutBtn: document.querySelector("#zoomOutBtn"),
  zoomInBtn: document.querySelector("#zoomInBtn"),
  zoomFitBtn: document.querySelector("#zoomFitBtn"),
};

const controls = [els.mode, els.maxSize, els.dpi, els.physicalWidth, els.physicalHeight, els.colors, els.smoothness, els.photoContrast, els.edgeSensitivity, els.lineWeight, els.threshold, els.simplify, els.cornerSmoothing, els.minFeature, els.alpha, els.trim, els.background, els.invert];
let renderTimer = 0;
let generationStatusTimer = 0;
const apiBaseUrl = window.GALVO_API_BASE_URL || "";
const engravingSizePresets = {
  "11x5.75in": { width: 11, height: 5.75, description: "11 x 5.75 in tumbler wrap" },
  "11x5in": { width: 11, height: 5, description: "11 x 5 in tumbler wrap" },
  "9.75x5.75in": { width: 9.75, height: 5.75, description: "9.75 x 5.75 in tumbler wrap" },
  "8.5x5.5in": { width: 8.5, height: 5.5, description: "8.5 x 5.5 in tumbler wrap" },
  "11.54x4in": { width: 11.54, height: 4, description: "11.54 x 4 in skinny tumbler wrap" },
};

function on(element, eventName, handler) {
  if (element) element.addEventListener(eventName, handler);
}

const controlHelp = {
  maxSize: {
    title: "Render Detail",
    body: [
      "This controls how many pixels the app uses when tracing the image.",
      "Higher detail keeps more small features, but can make larger SVG files and slower previews.",
      "Example: use Original size for final laser files. Lower it if your computer slows down while testing.",
    ],
  },
  dpi: {
    title: "Output DPI",
    body: [
      "DPI connects the pixel size to the real-world inch size of the SVG.",
      "For galvo engraving, 254 to 300 DPI is a common high-quality range.",
      "Example: a 3000 px wide design at 300 DPI becomes 10 inches wide.",
    ],
  },
  physicalSize: {
    title: "Physical Size",
    body: [
      "This is the real size the SVG should import as in your laser software.",
      "Set the width or height in inches. The other value updates to keep the image shape correct.",
      "Example: if your artwork should be 9.5 inches wide, type 9.5 in W in before downloading.",
    ],
  },
  colors: {
    title: "Color Palette",
    body: [
      "This controls how many colors are kept in Optimized vector trace mode.",
      "Fewer colors make simpler files. More colors keep more shading and detail.",
      "Example: use 2 for simple black/white artwork, 8 to 16 for anti-aliased edges, and higher values for color graphics.",
    ],
  },
  smoothness: {
    title: "Edge Smoothing",
    body: [
      "This lightly softens the source before tracing so stair-step edges are less harsh.",
      "Use small values. Too much smoothing can erase thin lines or tiny details.",
      "Example: try 0.25 to 1 px for logos or black/white art.",
    ],
  },
  photoContrast: {
    title: "Photo Contrast",
    body: [
      "This makes light and dark areas in a photo more separated before finding lines.",
      "Higher contrast creates stronger, bolder line art. Lower contrast keeps softer detail.",
      "Example: start around 140%. Increase it if the line art looks washed out.",
    ],
  },
  edgeSensitivity: {
    title: "Edge Sensitivity",
    body: [
      "This decides how strong a photo edge must be before it becomes a black line.",
      "Lower values find more lines and texture. Higher values keep only the clearest outlines.",
      "Example: for portraits, start around 50 to 80. Raise it if the result is too busy.",
    ],
  },
  lineWeight: {
    title: "Line Weight",
    body: [
      "This thickens the black lines found in Photo to line art mode.",
      "Thin lines keep detail but may be hard to mark. Thicker lines engrave more visibly.",
      "Example: use 1 px for fine detail, 2 or 3 px for stronger outlines.",
    ],
  },
  threshold: {
    title: "B/W Threshold",
    body: [
      "This decides what becomes black and what becomes white in Smooth black/white trace mode.",
      "Lower values make fewer areas black. Higher values make more areas black.",
      "Example: if the design is missing dark parts, raise the threshold. If it is too filled in, lower it.",
    ],
  },
  simplify: {
    title: "Path Simplification",
    body: [
      "This removes tiny unnecessary points from traced paths.",
      "Higher values make smoother, smaller SVGs, but can remove sharp detail.",
      "Example: start at 1 px. Try 2 px if edges still look rough or the file is too large.",
    ],
  },
  cornerSmoothing: {
    title: "Corner Smoothing",
    body: [
      "This rounds hard traced corners so paths look less pixel-stepped.",
      "Small values clean up edges. Large values can make corners too soft.",
      "Example: use 0.75 to 2 px for most galvo artwork.",
    ],
  },
  minFeature: {
    title: "Speckle Removal",
    body: [
      "This removes tiny black dots or dust-like marks from the traced result.",
      "Higher values remove more small marks, but can also remove intentional tiny details.",
      "Example: use 8 to 40 px area for noisy images. Use 0 if you want every tiny mark kept.",
    ],
  },
  alpha: {
    title: "Transparency Cutoff",
    body: [
      "This controls which transparent pixels are ignored.",
      "Higher values ignore more faint transparent edges. Lower values keep more semi-transparent pixels.",
      "Example: leave it near 12 for most PNGs. Raise it if faint transparent borders show up.",
    ],
  },
  trim: {
    title: "Trim Transparent Border",
    body: [
      "This removes empty transparent space around the image before exporting.",
      "It helps the SVG fit tightly around the actual artwork.",
      "Example: keep it on for most laser files. Turn it off if you need the original canvas size preserved.",
    ],
  },
  background: {
    title: "Add White Background",
    body: [
      "This adds a white rectangle behind the design.",
      "It can make previews easier to see, but may add a white shape to the SVG.",
      "Example: leave it off for most laser engraving unless your software needs a visible background.",
    ],
  },
  invert: {
    title: "Invert Colors",
    body: [
      "This flips light and dark colors before tracing.",
      "It is useful when your laser setup needs the opposite mark/no-mark result.",
      "Example: black artwork becomes white and white areas become black.",
    ],
  },
};

on(els.openGeneratorBtn, "click", () => showView("generator"));
on(els.openConverterBtn, "click", () => showView("converter"));
on(els.heroGeneratorBtn, "click", () => showView("generator"));
on(els.heroConverterBtn, "click", () => showView("converter"));
els.backHomeButtons.forEach((button) => on(button, "click", () => showView("dashboard")));
on(els.generateEngravingBtn, "click", generateEngravingImage);
on(els.downloadGeneratedBtn, "click", downloadGeneratedPng);
on(els.sendGeneratedToConverterBtn, "click", sendGeneratedToConverter);
on(els.sendGeneratedToConverterPreviewBtn, "click", sendGeneratedToConverter);
on(els.aiOptimizeBtn, "click", optimizeCurrentPngWithAi);
on(els.engravingSize, "change", updateEngravingSizeControls);
on(els.engravingCustomWidth, "input", updateEngravingSizeControls);
on(els.engravingCustomHeight, "input", updateEngravingSizeControls);
on(els.engravingCustomUnit, "change", updateEngravingSizeControls);

els.fileInput.addEventListener("change", () => {
  const file = els.fileInput.files?.[0];
  if (file) loadPng(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => {
  const file = [...event.dataTransfer.files].find((item) => item.type === "image/png");
  if (file) loadPng(file);
});

controls.forEach((control) => {
  control.addEventListener("input", queueRender);
  control.addEventListener("change", queueRender);
});

els.copyBtn.addEventListener("click", async () => {
  if (!state.svg) return;
  try {
    await navigator.clipboard.writeText(state.svg);
  } catch {
    els.svgCode.focus();
    els.svgCode.select();
    document.execCommand("copy");
  }
  els.status.textContent = "SVG copied";
});

els.downloadBtn.addEventListener("click", () => {
  if (!state.svg) return;
  try {
    downloadSvg();
  } catch (error) {
    els.status.textContent = error.message || "Download was blocked by this browser";
    console.error(error);
  }
});

els.previewBtn.addEventListener("click", showDownloadPreview);
els.svgPreview.addEventListener("click", showDownloadPreview);
els.previewZoom.addEventListener("input", () => setPreviewZoom(Number(els.previewZoom.value)));
els.zoomOutBtn.addEventListener("click", () => setPreviewZoom(state.previewZoom - 25));
els.zoomInBtn.addEventListener("click", () => setPreviewZoom(state.previewZoom + 25));
els.zoomFitBtn.addEventListener("click", () => setPreviewZoom(100));

syncLabels();
showView("dashboard");
updateEngravingSizeControls();
updateApiAvailabilityMessage();

els.modeInfoBtn.addEventListener("click", () => {
  els.modeInfoDialog.showModal();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".control-help");
  if (!button) return;
  event.preventDefault();
  showControlHelp(button.dataset.help);
});

els.modeInfoDialog.addEventListener("click", (event) => {
  if (event.target === els.modeInfoDialog) {
    els.modeInfoDialog.close();
  }
});

els.controlHelpDialog.addEventListener("click", (event) => {
  if (event.target === els.controlHelpDialog) {
    els.controlHelpDialog.close();
  }
});

els.downloadPreviewDialog.addEventListener("click", (event) => {
  if (event.target === els.downloadPreviewDialog) {
    els.downloadPreviewDialog.close();
  }
});

els.physicalWidth.addEventListener("input", () => syncPhysicalSize("width"));
els.physicalHeight.addEventListener("input", () => syncPhysicalSize("height"));

async function loadPng(file) {
  if (file.type !== "image/png") {
    els.status.textContent = "Please choose a PNG file";
    return;
  }

  state.file = file;
  state.pngDpi = await readPngDpi(file);
  state.pngDataUrl = await readAsDataUrl(file);
  state.image = await createImage(state.pngDataUrl);
  state.aspectRatio = state.image.naturalWidth / state.image.naturalHeight;
  setInitialPhysicalSize();
  els.fileName.textContent = file.name;
  els.inputStats.textContent = `${state.image.naturalWidth} x ${state.image.naturalHeight}, ${formatBytes(file.size)}${state.pngDpi ? `, ${state.pngDpi} DPI` : ""}`;
  els.aiOptimizeBtn.disabled = false;
  els.aiOptimizeStatus.textContent = "Optional: use AI to rebuild this PNG as black and white engraving art before SVG conversion.";
  render();
}

function queueRender() {
  syncLabels();
  if (!state.image) return;
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(render, 90);
}

function syncLabels() {
  const maxSize = Number(els.maxSize.value);
  const originalSize = state.image ? Math.max(state.image.naturalWidth, state.image.naturalHeight) : 0;
  els.maxSizeValue.textContent = originalSize && maxSize >= originalSize ? "Original size" : `${maxSize} px`;
  els.dpiValue.textContent = `${els.dpi.value} DPI`;
  els.sizeValue.textContent = getSizeLabel();
  els.colorsValue.textContent = `${els.colors.value} colors`;
  els.smoothnessValue.textContent = `${Number(els.smoothness.value).toFixed(2).replace(/\.?0+$/, "")} px`;
  els.photoContrastValue.textContent = `${els.photoContrast.value}%`;
  els.edgeSensitivityValue.textContent = els.edgeSensitivity.value;
  els.lineWeightValue.textContent = `${els.lineWeight.value} px`;
  els.thresholdValue.textContent = els.threshold.value;
  els.simplifyValue.textContent = `${formatSliderNumber(els.simplify.value)} px`;
  els.cornerSmoothingValue.textContent = `${formatSliderNumber(els.cornerSmoothing.value)} px`;
  els.minFeatureValue.textContent = `${els.minFeature.value} px area`;
  els.alphaValue.textContent = els.alpha.value;
}

function setInitialPhysicalSize() {
  const dpi = state.pngDpi || Number(els.dpi.value);
  state.syncingSize = true;
  els.physicalWidth.value = formatInches(state.image.naturalWidth / dpi);
  els.physicalHeight.value = formatInches(state.image.naturalHeight / dpi);
  state.syncingSize = false;
}

function syncPhysicalSize(changedField) {
  if (!state.image || state.syncingSize) return;
  const width = Number(els.physicalWidth.value);
  const height = Number(els.physicalHeight.value);
  state.syncingSize = true;

  if (changedField === "width" && width > 0) {
    els.physicalHeight.value = formatInches(width / state.aspectRatio);
  }

  if (changedField === "height" && height > 0) {
    els.physicalWidth.value = formatInches(height * state.aspectRatio);
  }

  state.syncingSize = false;
}

function getSizeLabel() {
  const width = Number(els.physicalWidth.value);
  const height = Number(els.physicalHeight.value);
  if (!width || !height) return "Auto";
  return `${formatInches(width)} x ${formatInches(height)} in`;
}

function showControlHelp(helpKey) {
  const help = controlHelp[helpKey];
  if (!help) return;

  els.controlHelpTitle.textContent = help.title;
  els.controlHelpBody.innerHTML = help.body
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  els.controlHelpDialog.showModal();
}

function showView(view) {
  els.dashboardView.hidden = view !== "dashboard";
  els.generatorView.hidden = view !== "generator";
  els.converterView.hidden = view !== "converter";
  if (window.openGalvoStudioView && !showView.syncing) {
    showView.syncing = true;
    window.openGalvoStudioView(view);
    showView.syncing = false;
  }
  if (view === "dashboard") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    const target = view === "generator" ? els.generatorView : els.converterView;
    requestAnimationFrame(() => {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

async function generateEngravingImage() {
  const prompt = els.engravingPrompt.value.trim();
  if (!prompt) {
    showGeneratorError("Describe the image you want first.");
    els.engravingPrompt.focus();
    return;
  }

  const sizeSettings = getEngravingSizeSettings();
  if (!sizeSettings.valid) {
    showGeneratorError(sizeSettings.error);
    els.engravingCustomWidth.focus();
    return;
  }

  hideGeneratorError();
  els.generateEngravingBtn.disabled = true;
  els.downloadGeneratedBtn.disabled = true;
  els.sendGeneratedToConverterBtn.disabled = true;
  els.sendGeneratedToConverterPreviewBtn.disabled = true;
  startGenerationStatus();

  try {
    const payload = await postApiJson("/api/generate-engraving", {
      prompt,
      style: els.engravingStyle.value,
      detail: els.engravingDetail.value,
      lineWeight: els.engravingLineWeight.value,
      cleanup: els.engravingCleanup.value,
      upscale: els.engravingUpscale.value,
      background: els.engravingBackground.value,
      wrap: els.engravingWrap.value,
      rotaryCompensation: els.rotaryCompensation.checked,
      size: sizeSettings.apiSize,
      requestedSize: sizeSettings.description,
      requestedRatio: sizeSettings.ratio,
      physicalWidth: sizeSettings.physicalWidth || null,
      physicalHeight: sizeSettings.physicalHeight || null,
      physicalUnit: sizeSettings.physicalUnit || null,
    });

    if (!payload.image) {
      throw new Error("The image API did not return image data.");
    }

    updateGenerationStatus("OpenAI returned the base image. Applying final laser cleanup...", false, true);
    const generatedDataUrl = `data:image/png;base64,${payload.image}`;
    const processed = await enhanceGeneratedImage(generatedDataUrl, {
      upscale: Number(els.engravingUpscale.value) || 1,
      cleanup: els.engravingCleanup.value,
      lineWeight: els.engravingLineWeight.value,
      background: els.engravingBackground.value,
    });

    state.generatedPng = processed.dataUrl;
    els.generatedPreview.classList.remove("empty");
    els.generatedPreview.innerHTML = `<img class="generated-image" alt="Generated black and white laser engraving artwork" src="${state.generatedPng}">`;
    els.generatedMeta.textContent = `${sizeSettings.description}, ${payload.size} source, ${processed.width} x ${processed.height} final PNG`;
    updateGenerationStatus("Image generated and cleaned for laser prep.");
    els.downloadGeneratedBtn.disabled = false;
    els.sendGeneratedToConverterBtn.disabled = false;
    els.sendGeneratedToConverterPreviewBtn.disabled = false;
  } catch (error) {
    updateGenerationStatus(error.message || "Image generation failed.", true);
    console.error(error);
  } finally {
    stopGenerationStatus();
    els.generateEngravingBtn.disabled = false;
  }
}

function startGenerationStatus() {
  const messages = [
    "Sending laser engraving prompt to OpenAI...",
    "OpenAI is building the black and white composition...",
    "Still working. Full-wrap and high-detail images can take a little longer...",
    "Checking for trace-friendly contrast and clean line structure...",
    "Preparing the final PNG for laser workflow..."
  ];
  let index = 0;
  updateGenerationStatus(messages[index], false, true);
  clearInterval(generationStatusTimer);
  generationStatusTimer = setInterval(() => {
    index = Math.min(index + 1, messages.length - 1);
    updateGenerationStatus(messages[index], false, true);
  }, 4500);
}

function stopGenerationStatus() {
  clearInterval(generationStatusTimer);
  generationStatusTimer = 0;
  if (els.generatorProgress) {
    els.generatorProgress.classList.remove("is-active");
  }
}

function updateGenerationStatus(message, isError = false, isActive = false) {
  if (isError) {
    if (els.generatorProgress) els.generatorProgress.hidden = true;
    showGeneratorError(message);
    return;
  }

  hideGeneratorError();
  if (!els.generatorProgress) return;
  els.generatorProgress.hidden = false;
  els.generatorProgress.classList.remove("error");
  els.generatorProgress.classList.toggle("is-active", Boolean(isActive));
  const label = els.generatorProgress.querySelector("span");
  if (label) label.textContent = message;
}

function showGeneratorError(message) {
  if (!els.generatorStatus) return;
  els.generatorStatus.textContent = message;
  els.generatorStatus.hidden = false;
}

function hideGeneratorError() {
  if (!els.generatorStatus) return;
  els.generatorStatus.textContent = "";
  els.generatorStatus.hidden = true;
}

async function enhanceGeneratedImage(dataUrl, options) {
  const image = await createImage(dataUrl);
  const scale = Math.max(1, Math.min(4, Number(options.upscale) || 1));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = scale > 1;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const threshold = getGeneratedCleanupThreshold(options.cleanup);
  const markIsWhite = options.background !== "light";
  let mask = new Uint8Array(width * height);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const alpha = data[index + 3] / 255;
    const luma = ((data[index] * 0.2126) + (data[index + 1] * 0.7152) + (data[index + 2] * 0.0722)) * alpha + 255 * (1 - alpha);
    mask[pixel] = markIsWhite ? (luma >= threshold ? 1 : 0) : (luma < threshold ? 1 : 0);
  }

  mask = adjustGeneratedLineWeight(mask, width, height, options.lineWeight);
  mask = cleanGeneratedMask(mask, width, height, options.cleanup);

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const mark = mask[pixel] === 1;
    const value = markIsWhite ? (mark ? 255 : 0) : (mark ? 0 : 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

function getGeneratedCleanupThreshold(cleanup) {
  if (cleanup === "crisp") return 148;
  if (cleanup === "aggressive") return 160;
  if (cleanup === "preserve") return 132;
  return 142;
}

function adjustGeneratedLineWeight(mask, width, height, lineWeight) {
  if (lineWeight === "bold") return dilateMask(mask, width, height, 1);
  if (lineWeight === "heavy") return dilateMask(mask, width, height, 2);
  if (lineWeight === "fine") return erodeMask(mask, width, height, 1);
  return mask;
}

function cleanGeneratedMask(mask, width, height, cleanup) {
  if (cleanup === "aggressive") return removeSmallComponents(mask, width, height, 18).mask;
  if (cleanup === "crisp") return removeSmallComponents(mask, width, height, 8).mask;
  if (cleanup === "preserve") return removeSmallComponents(mask, width, height, 2).mask;
  return removeSmallComponents(mask, width, height, 5).mask;
}

function erodeMask(mask, width, height, radius) {
  const output = new Uint8Array(mask.length);
  const radiusSquared = radius * radius;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      let keep = true;

      for (let dy = -radius; dy <= radius && keep; dy += 1) {
        const nextY = y + dy;
        if (nextY < 0 || nextY >= height) {
          keep = false;
          break;
        }

        for (let dx = -radius; dx <= radius; dx += 1) {
          if ((dx * dx) + (dy * dy) > radiusSquared) continue;
          const nextX = x + dx;
          if (nextX < 0 || nextX >= width || !mask[nextY * width + nextX]) {
            keep = false;
            break;
          }
        }
      }

      output[index] = keep ? 1 : 0;
    }
  }

  return output;
}

async function postApiJson(path, body) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(getApiUnavailableMessage());
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "The AI service returned an error.");
  }

  return payload;
}

function getApiUnavailableMessage() {
  if (location.hostname.endsWith("github.io") && !apiBaseUrl) {
    return "AI tools need a deployed API backend. GitHub Pages can show the app, but it cannot run the OpenAI server.";
  }

  return "AI tools API is not available. Start the local Node server with npm start, then try again.";
}

function updateApiAvailabilityMessage() {
  if (!location.hostname.endsWith("github.io") || apiBaseUrl) return;
  if (els.generatorStatus) {
    showGeneratorError("AI generation requires a deployed API backend. The PNG to SVG converter works directly in this browser.");
  }
  if (els.aiOptimizeStatus) {
    els.aiOptimizeStatus.textContent = "AI optimization requires a deployed API backend. Local SVG conversion still works.";
  }
}

function updateEngravingSizeControls() {
  const custom = els.engravingSize.value === "custom";
  els.customEngravingSize.hidden = !custom;
  const settings = getEngravingSizeSettings({ allowEmpty: true });
  if (els.engravingSizeHint) {
    els.engravingSizeHint.textContent = settings.valid
      ? `${settings.description}. GPT Image 2 uses a higher-resolution native size when available; older models use ${settings.apiSize}.`
      : "Enter a wide and tall value greater than 0.";
  }
}

function getEngravingSizeSettings(options = {}) {
  const selected = els.engravingSize.value;
  if (selected !== "custom") {
    const preset = engravingSizePresets[selected];
    if (preset) {
      const ratio = preset.width / preset.height;
      return {
        valid: true,
        ratio,
        apiSize: getOpenAiSizeForRatio(ratio),
        description: preset.description,
        physicalWidth: preset.width,
        physicalHeight: preset.height,
        physicalUnit: "in",
      };
    }

    const ratio = parseRatio(selected);
    return {
      valid: true,
      ratio,
      apiSize: getOpenAiSizeForRatio(ratio),
      description: `${selected} ratio`,
    };
  }

  const width = Number(els.engravingCustomWidth.value);
  const height = Number(els.engravingCustomHeight.value);
  const unit = els.engravingCustomUnit.value;

  if ((!width || !height) && options.allowEmpty) {
    return {
      valid: true,
      ratio: 1,
      apiSize: "1024x1024",
      description: "Custom size not set",
    };
  }

  if (!(width > 0) || !(height > 0)) {
    return {
      valid: false,
      error: "Enter custom wide and tall values greater than 0.",
    };
  }

  const ratio = width / height;
  const unitLabel = unit === "ratio" ? "ratio" : unit;
  return {
    valid: true,
    ratio,
    apiSize: getOpenAiSizeForRatio(ratio),
    description: unit === "ratio"
      ? `${formatSliderNumber(width)}:${formatSliderNumber(height)} custom ratio`
      : `${formatSliderNumber(width)} x ${formatSliderNumber(height)} ${unitLabel}`,
    physicalWidth: unit === "ratio" ? null : width,
    physicalHeight: unit === "ratio" ? null : height,
    physicalUnit: unit === "ratio" ? null : unit,
  };
}

function parseRatio(value) {
  const [wide, tall] = value.split(":").map(Number);
  if (!(wide > 0) || !(tall > 0)) return 1;
  return wide / tall;
}

function getOpenAiSizeForRatio(ratio) {
  if (ratio > 1.18) return "1536x1024";
  if (ratio < 0.85) return "1024x1536";
  return "1024x1024";
}

function downloadGeneratedPng() {
  if (!state.generatedPng) return;
  const fileName = getDownloadFileName("galvo-black-white-engraving.png", ".png", "Name the PNG file before downloading:");
  if (!fileName) {
    updateGenerationStatus("Download canceled.");
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = state.generatedPng;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  updateGenerationStatus("PNG download started. Your browser will save it to the Downloads folder unless your browser asks where to save files.");
}

async function sendGeneratedToConverter() {
  if (!state.generatedPng) return;
  const file = await dataUrlToFile(state.generatedPng, "galvo-black-white-engraving.png");
  showView("converter");
  els.mode.value = "smooth-bw";
  els.dpi.value = "300";
  els.threshold.value = "128";
  els.simplify.value = "0.8";
  els.cornerSmoothing.value = "1";
  els.minFeature.value = "8";
  els.background.checked = false;
  els.invert.checked = false;
  await loadPng(file);
  els.status.textContent = "Generated image loaded into SVG converter";
}

async function optimizeCurrentPngWithAi() {
  if (!state.pngDataUrl || !state.file) return;

  const confirmed = window.confirm("This will send the loaded PNG to OpenAI and replace the current converter input with an AI-optimized black and white engraving PNG. Continue?");
  if (!confirmed) return;

  els.aiOptimizeBtn.disabled = true;
  els.aiOptimizeStatus.textContent = "Optimizing PNG with AI...";
  els.status.textContent = "AI optimizing PNG...";

  try {
    const payload = await postApiJson("/api/optimize-png", {
      image: state.pngDataUrl,
      fileName: state.file.name,
      mode: els.mode.value,
      size: getAiSizeFromAspectRatio(),
    });

    if (!payload.image) {
      throw new Error("The image API did not return optimized image data.");
    }

    const optimizedDataUrl = `data:image/png;base64,${payload.image}`;
    const optimizedName = `${(state.file.name || "image").replace(/\.png$/i, "")}-ai-optimized.png`;
    const optimizedFile = await dataUrlToFile(optimizedDataUrl, optimizedName);
    await loadPng(optimizedFile);
    els.aiOptimizeStatus.textContent = "AI optimized PNG loaded. Tune SVG settings or download when ready.";
  } catch (error) {
    els.aiOptimizeStatus.textContent = error.message || "AI optimization failed.";
    els.status.textContent = "AI optimization failed";
    console.error(error);
  } finally {
    els.aiOptimizeBtn.disabled = false;
  }
}

function getAiSizeFromAspectRatio() {
  if (!state.image) return "1024x1024";
  const ratio = state.image.naturalWidth / state.image.naturalHeight;
  if (ratio > 1.2) return "1536x1024";
  if (ratio < 0.84) return "1024x1536";
  return "1024x1024";
}

function render() {
  if (!state.image) return;

  els.status.textContent = "Converting...";
  requestAnimationFrame(() => {
    try {
      updateResult(buildCurrentResult());
    } catch (error) {
      els.status.textContent = "Conversion failed";
      els.shapeStats.textContent = error.message;
      console.error(error);
    }
  });
}

function downloadSvg() {
  if (!state.image) return;
  els.status.textContent = "Preparing download...";
  updateResult(buildCurrentResult());

  const exportText = prepareSvgForFile(state.svg);
  const blob = new Blob([exportText], { type: "image/svg+xml;charset=utf-8" });
  const fileName = getDownloadFileName(getSuggestedSvgFileName(), ".svg", "Name the SVG file before downloading:");
  if (!fileName) {
    els.status.textContent = "Download canceled";
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  els.status.textContent = getSavedStatus("Download started");
}

function getSettings() {
  return {
    mode: els.mode.value,
    maxSize: Number(els.maxSize.value),
    dpi: Number(els.dpi.value),
    physicalWidth: Number(els.physicalWidth.value) || 0,
    physicalHeight: Number(els.physicalHeight.value) || 0,
    colors: Number(els.colors.value),
    smoothness: Number(els.smoothness.value),
    photoContrast: Number(els.photoContrast.value),
    edgeSensitivity: Number(els.edgeSensitivity.value),
    lineWeight: Number(els.lineWeight.value),
    threshold: Number(els.threshold.value),
    simplify: Number(els.simplify.value),
    cornerSmoothing: Number(els.cornerSmoothing.value),
    minFeature: Number(els.minFeature.value),
    alpha: Number(els.alpha.value),
    trim: els.trim.checked,
    background: els.background.checked,
    invert: els.invert.checked,
  };
}

function buildCurrentResult() {
  const settings = getSettings();
  const source = drawSource(settings);
  if (settings.mode === "embedded") return buildEmbeddedSvg(source, settings);
  if (settings.mode === "photo-line") return buildPhotoLineArtSvg(source, settings);
  if (settings.mode === "smooth-bw") return buildSmoothBwSvg(source, settings);
  return buildVectorSvg(source, settings);
}

function updateResult(result) {
  state.svg = result.svg;
  state.result = result;
  els.svgCode.value = result.svg;
  els.svgPreview.classList.remove("empty");
  els.svgPreview.innerHTML = result.svg;
  els.outputStats.textContent = `${result.width} x ${result.height} px, ${result.physicalWidth} x ${result.physicalHeight} in`;
  els.shapeStats.textContent = result.summary;
  els.status.textContent = "Preview rendered";
  els.codeSize.textContent = formatBytes(result.svg.length);
  els.copyBtn.disabled = false;
  els.previewBtn.disabled = false;
  els.downloadBtn.disabled = false;
  els.svgPreview.disabled = false;
  syncLabels();
}

function showDownloadPreview() {
  if (!state.image) return;
  updateResult(buildCurrentResult());
  const exportText = prepareSvgForFile(state.svg);
  els.downloadPreviewSurface.innerHTML = exportText;
  els.downloadPreviewStats.textContent = `${state.result.width} x ${state.result.height} px, ${state.result.physicalWidth} x ${state.result.physicalHeight} in, ${state.result.dpi} DPI`;
  setPreviewZoom(state.previewZoom);
  els.downloadPreviewDialog.showModal();
}

function setPreviewZoom(value) {
  state.previewZoom = Math.max(25, Math.min(400, value));
  els.previewZoom.value = String(state.previewZoom);
  els.previewZoomValue.textContent = `${state.previewZoom}%`;
  const previewSvg = els.downloadPreviewSurface.querySelector("svg");
  if (previewSvg) {
    previewSvg.style.width = `${state.previewZoom}%`;
    previewSvg.style.height = "auto";
    previewSvg.style.maxWidth = state.previewZoom === 100 ? "100%" : "none";
    previewSvg.style.maxHeight = state.previewZoom === 100 ? "70vh" : "none";
  }
}

function getSuggestedSvgFileName() {
  const baseName = (state.file?.name || "converted").replace(/\.png$/i, "");
  return `${baseName}.svg`;
}

function getDownloadFileName(suggested, extension, message) {
  const enteredName = window.prompt(message, suggested);
  if (enteredName === null) return "";

  const cleaned = sanitizeFileName(enteredName.trim());
  if (!cleaned) return suggested;
  return cleaned.toLowerCase().endsWith(extension) ? cleaned : `${cleaned}${extension}`;
}

function sanitizeFileName(fileName) {
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "");
}

function drawSource(settings) {
  const image = state.image;
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const pixelBudgetScale = Math.sqrt(14000000 / (image.naturalWidth * image.naturalHeight));
  const scale = Math.min(1, settings.maxSize / largestSide, pixelBudgetScale);
  const canvas = els.sourceCanvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (settings.smoothness > 0) {
    ctx.filter = `blur(${settings.smoothness}px)`;
  }
  ctx.drawImage(image, 0, 0, width, height);
  ctx.filter = "none";

  const imageData = ctx.getImageData(0, 0, width, height);
  if (settings.invert) {
    invertImageData(imageData);
    ctx.putImageData(imageData, 0, 0);
  }
  const crop = settings.trim ? findOpaqueBounds(imageData, settings.alpha) : { x: 0, y: 0, width, height };
  const dataUrl = canvas.toDataURL("image/png");
  return { imageData, crop, width, height, dataUrl, scaled: scale < 0.999 };
}

function buildEmbeddedSvg(source, settings) {
  const { crop } = source;
  const physical = getPhysicalSize(crop.width, crop.height, settings);
  const bg = settings.background ? `<rect width="100%" height="100%" fill="#ffffff"/>` : "";
  const imageUrl = escapeAttr(source.dataUrl);
  const image = `<image href="${imageUrl}" xlink:href="${imageUrl}" x="${-crop.x}" y="${-crop.y}" width="${source.width}" height="${source.height}" preserveAspectRatio="none"/>`;
  const svg = compactSvg(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${physical.widthIn}in" height="${physical.heightIn}in" viewBox="0 0 ${crop.width} ${crop.height}" data-dpi="${settings.dpi}">${bg}${image}</svg>`);
  return {
    svg,
    width: crop.width,
    height: crop.height,
    physicalWidth: physical.widthIn,
    physicalHeight: physical.heightIn,
    dpi: settings.dpi,
    hasBackground: settings.background,
    palette: [],
    summary: `Exact PNG embedded, ${settings.dpi} DPI${settings.smoothness ? ", smoothed" : ""}${settings.invert ? ", inverted" : ""}${source.scaled ? ", scaled for browser memory" : ""}`,
  };
}

function buildPhotoLineArtSvg(source, settings) {
  const { crop } = source;
  const physical = getPhysicalSize(crop.width, crop.height, settings);
  const mask = buildPhotoLineMask(source.imageData, crop, settings);
  const filtered = settings.minFeature > 0
    ? removeSmallComponents(mask, crop.width, crop.height, settings.minFeature)
    : { mask, removed: 0 };
  const loops = traceMaskContours(filtered.mask, crop.width, crop.height);
  const paths = loops
    .map((loop) => pointsToSmoothPath(simplifyClosedPath(loop, settings.simplify), settings.cornerSmoothing))
    .filter(Boolean);

  const bg = settings.background ? `<rect width="100%" height="100%" fill="#ffffff"/>` : "";
  const svg = compactSvg(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${physical.widthIn}in" height="${physical.heightIn}in" viewBox="0 0 ${crop.width} ${crop.height}" shape-rendering="geometricPrecision" data-dpi="${settings.dpi}">${bg}<path fill="#000000" fill-rule="evenodd" d="${paths.join(" ")}"/></svg>`);
  return {
    svg,
    width: crop.width,
    height: crop.height,
    physicalWidth: physical.widthIn,
    physicalHeight: physical.heightIn,
    dpi: settings.dpi,
    hasBackground: settings.background,
    palette: [{ r: 0, g: 0, b: 0, hex: "#000000" }],
    summary: `${loops.length.toLocaleString()} line-art contours, ${filtered.removed.toLocaleString()} specks removed, ${settings.dpi} DPI${settings.invert ? ", inverted" : ""}${source.scaled ? ", scaled for browser memory" : ""}`,
  };
}

function buildSmoothBwSvg(source, settings) {
  const { crop } = source;
  const physical = getPhysicalSize(crop.width, crop.height, settings);
  const mask = buildBinaryMask(source.imageData, crop, settings);
  const filtered = settings.minFeature > 0
    ? removeSmallComponents(mask, crop.width, crop.height, settings.minFeature)
    : { mask, removed: 0 };
  const loops = traceMaskContours(filtered.mask, crop.width, crop.height);
  const paths = loops
    .map((loop) => pointsToSmoothPath(simplifyClosedPath(loop, settings.simplify), settings.cornerSmoothing))
    .filter(Boolean);

  const bg = settings.background ? `<rect width="100%" height="100%" fill="#ffffff"/>` : "";
  const svg = compactSvg(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${physical.widthIn}in" height="${physical.heightIn}in" viewBox="0 0 ${crop.width} ${crop.height}" shape-rendering="geometricPrecision" data-dpi="${settings.dpi}">${bg}<path fill="#000000" fill-rule="evenodd" d="${paths.join(" ")}"/></svg>`);
  return {
    svg,
    width: crop.width,
    height: crop.height,
    physicalWidth: physical.widthIn,
    physicalHeight: physical.heightIn,
    dpi: settings.dpi,
    hasBackground: settings.background,
    palette: [{ r: 0, g: 0, b: 0, hex: "#000000" }],
    summary: `${loops.length.toLocaleString()} smooth contours, ${filtered.removed.toLocaleString()} specks removed, ${settings.dpi} DPI${settings.invert ? ", inverted" : ""}${source.scaled ? ", scaled for browser memory" : ""}`,
  };
}

function buildVectorSvg(source, settings) {
  const { imageData, crop } = source;
  const physical = getPhysicalSize(crop.width, crop.height, settings);
  const palette = buildPalette(imageData, crop, settings);
  const colorIndex = mapPixelsToPalette(imageData, crop, palette, settings);
  const paths = [];
  let rectCount = 0;

  palette.forEach((color, index) => {
    const rects = buildMergedRects(colorIndex, crop.width, crop.height, index);
    if (!rects.length) return;
    rectCount += rects.length;
    paths.push(`<path fill="${color.hex}" d="${rectsToPath(rects)}"/>`);
  });

  const bg = settings.background ? `<rect width="100%" height="100%" fill="#ffffff"/>` : "";
  const shapeRendering = settings.smoothness > 0 ? "geometricPrecision" : "crispEdges";
  const svg = compactSvg(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${physical.widthIn}in" height="${physical.heightIn}in" viewBox="0 0 ${crop.width} ${crop.height}" shape-rendering="${shapeRendering}" data-dpi="${settings.dpi}">${bg}${paths.join("")}</svg>`);
  return {
    svg,
    width: crop.width,
    height: crop.height,
    physicalWidth: physical.widthIn,
    physicalHeight: physical.heightIn,
    dpi: settings.dpi,
    hasBackground: settings.background,
    palette,
    summary: `${palette.length} colors, ${rectCount.toLocaleString()} shapes, ${settings.dpi} DPI${settings.smoothness ? ", smoothed" : ""}${settings.invert ? ", inverted" : ""}${source.scaled ? ", scaled for browser memory" : ""}`,
  };
}

function findOpaqueBounds(imageData, alphaCutoff) {
  const { width, height, data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= alphaCutoff) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function invertImageData(imageData) {
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    data[index] = 255 - data[index];
    data[index + 1] = 255 - data[index + 1];
    data[index + 2] = 255 - data[index + 2];
  }
}

function buildBinaryMask(imageData, crop, settings) {
  const { width, data } = imageData;
  const mask = new Uint8Array(crop.width * crop.height);

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const sourceX = crop.x + x;
      const sourceY = crop.y + y;
      const offset = (sourceY * width + sourceX) * 4;
      if (data[offset + 3] <= settings.alpha) continue;

      const luminance = (data[offset] * 0.2126) + (data[offset + 1] * 0.7152) + (data[offset + 2] * 0.0722);
      mask[y * crop.width + x] = luminance < settings.threshold ? 1 : 0;
    }
  }

  return mask;
}

function buildPhotoLineMask(imageData, crop, settings) {
  const gray = buildContrastGray(imageData, crop, settings.photoContrast);
  const edgeMask = sobelToMask(gray, crop.width, crop.height, settings.edgeSensitivity);
  return settings.lineWeight > 1
    ? dilateMask(edgeMask, crop.width, crop.height, settings.lineWeight - 1)
    : edgeMask;
}

function buildContrastGray(imageData, crop, contrastPercent) {
  const { width, data } = imageData;
  const gray = new Float32Array(crop.width * crop.height);
  const contrast = contrastPercent / 100;

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const sourceX = crop.x + x;
      const sourceY = crop.y + y;
      const offset = (sourceY * width + sourceX) * 4;
      const alpha = data[offset + 3] / 255;
      const luminance = ((data[offset] * 0.2126) + (data[offset + 1] * 0.7152) + (data[offset + 2] * 0.0722)) * alpha + (255 * (1 - alpha));
      gray[y * crop.width + x] = clamp(128 + ((luminance - 128) * contrast));
    }
  }

  return gray;
}

function sobelToMask(gray, width, height, sensitivity) {
  const mask = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = gray[(y - 1) * width + x - 1];
      const top = gray[(y - 1) * width + x];
      const topRight = gray[(y - 1) * width + x + 1];
      const left = gray[y * width + x - 1];
      const right = gray[y * width + x + 1];
      const bottomLeft = gray[(y + 1) * width + x - 1];
      const bottom = gray[(y + 1) * width + x];
      const bottomRight = gray[(y + 1) * width + x + 1];

      const gx = -topLeft + topRight - (2 * left) + (2 * right) - bottomLeft + bottomRight;
      const gy = -topLeft - (2 * top) - topRight + bottomLeft + (2 * bottom) + bottomRight;
      const magnitude = Math.hypot(gx, gy);
      mask[y * width + x] = magnitude >= sensitivity ? 1 : 0;
    }
  }

  return mask;
}

function dilateMask(mask, width, height, radius) {
  const output = new Uint8Array(mask.length);
  const radiusSquared = radius * radius;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;

      for (let dy = -radius; dy <= radius; dy += 1) {
        const nextY = y + dy;
        if (nextY < 0 || nextY >= height) continue;

        for (let dx = -radius; dx <= radius; dx += 1) {
          const nextX = x + dx;
          if (nextX < 0 || nextX >= width || (dx * dx) + (dy * dy) > radiusSquared) continue;
          output[nextY * width + nextX] = 1;
        }
      }
    }
  }

  return output;
}

function removeSmallComponents(mask, width, height, minArea) {
  const cleaned = new Uint8Array(mask);
  const visited = new Uint8Array(mask.length);
  const stack = new Int32Array(mask.length);
  const component = new Int32Array(mask.length);
  let removed = 0;

  for (let index = 0; index < mask.length; index += 1) {
    if (!cleaned[index] || visited[index]) continue;

    let stackLength = 1;
    let componentLength = 0;
    stack[0] = index;
    visited[index] = 1;

    while (stackLength) {
      const current = stack[--stackLength];
      component[componentLength++] = current;
      const x = current % width;
      const y = Math.floor(current / width);

      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < width - 1 ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y < height - 1 ? current + width : -1,
      ];

      for (const next of neighbors) {
        if (next < 0 || visited[next] || !cleaned[next]) continue;
        visited[next] = 1;
        stack[stackLength++] = next;
      }
    }

    if (componentLength < minArea) {
      removed += 1;
      for (let item = 0; item < componentLength; item += 1) {
        cleaned[component[item]] = 0;
      }
    }
  }

  return { mask: cleaned, removed };
}

function traceMaskContours(mask, width, height) {
  const starts = new Map();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      if (y === 0 || !mask[(y - 1) * width + x]) addEdge(starts, x, y, x + 1, y);
      if (x === width - 1 || !mask[y * width + x + 1]) addEdge(starts, x + 1, y, x + 1, y + 1);
      if (y === height - 1 || !mask[(y + 1) * width + x]) addEdge(starts, x + 1, y + 1, x, y + 1);
      if (x === 0 || !mask[y * width + x - 1]) addEdge(starts, x, y + 1, x, y);
    }
  }

  const loops = [];
  for (const [startKey, ends] of starts) {
    while (ends.length) {
      const start = keyToPoint(startKey);
      const loop = [start];
      let current = ends.pop();
      let guard = 0;

      while (guard < mask.length * 4) {
        loop.push(current);
        if (current.x === start.x && current.y === start.y) break;

        const currentKey = pointKey(current.x, current.y);
        const nextEnds = starts.get(currentKey);
        if (!nextEnds || !nextEnds.length) break;
        current = nextEnds.pop();
        guard += 1;
      }

      if (loop.length > 3) loops.push(loop);
    }
  }

  return loops;
}

function addEdge(map, x1, y1, x2, y2) {
  const key = pointKey(x1, y1);
  const list = map.get(key) || [];
  list.push({ x: x2, y: y2 });
  map.set(key, list);
}

function pointKey(x, y) {
  return `${x},${y}`;
}

function keyToPoint(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function simplifyClosedPath(points, tolerance) {
  const open = points.slice(0, -1);
  if (open.length < 4 || tolerance <= 0) return open;
  return rdp(open, tolerance);
}

function rdp(points, epsilon) {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance > epsilon) {
    return [
      ...rdp(points.slice(0, index + 1), epsilon).slice(0, -1),
      ...rdp(points.slice(index), epsilon),
    ];
  }

  return [start, end];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / Math.hypot(dx, dy);
}

function pointsToSmoothPath(points, smoothing) {
  if (points.length < 3) return "";
  if (smoothing <= 0) {
    return `M ${points[0].x} ${points[0].y} ${points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(" ")} Z`;
  }

  const segments = [];
  const first = getCornerPoints(points, 0, smoothing).after;
  segments.push(`M ${formatPathNumber(first.x)} ${formatPathNumber(first.y)}`);

  for (let index = 1; index <= points.length; index += 1) {
    const cornerIndex = index % points.length;
    const corner = getCornerPoints(points, cornerIndex, smoothing);
    segments.push(`L ${formatPathNumber(corner.before.x)} ${formatPathNumber(corner.before.y)}`);
    segments.push(`Q ${formatPathNumber(corner.point.x)} ${formatPathNumber(corner.point.y)} ${formatPathNumber(corner.after.x)} ${formatPathNumber(corner.after.y)}`);
  }

  segments.push("Z");
  return segments.join(" ");
}

function getCornerPoints(points, index, smoothing) {
  const point = points[index];
  const previous = points[(index - 1 + points.length) % points.length];
  const next = points[(index + 1) % points.length];
  const prevDistance = Math.hypot(point.x - previous.x, point.y - previous.y);
  const nextDistance = Math.hypot(next.x - point.x, next.y - point.y);
  const amount = Math.min(smoothing, prevDistance / 2, nextDistance / 2);

  return {
    point,
    before: moveToward(point, previous, amount),
    after: moveToward(point, next, amount),
  };
}

function moveToward(from, to, amount) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (!distance) return { ...from };
  const ratio = amount / distance;
  return {
    x: from.x + ((to.x - from.x) * ratio),
    y: from.y + ((to.y - from.y) * ratio),
  };
}

function formatPathNumber(value) {
  return Number(value.toFixed(3)).toString();
}

function buildPalette(imageData, crop, settings) {
  const buckets = new Map();
  const { width, data } = imageData;
  const step = getQuantizationStep(settings.colors);

  for (let y = crop.y; y < crop.y + crop.height; y += 1) {
    for (let x = crop.x; x < crop.x + crop.width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha <= settings.alpha) continue;

      const r = Math.round(data[offset] / step) * step;
      const g = Math.round(data[offset + 1] / step) * step;
      const b = Math.round(data[offset + 2] / step) * step;
      const key = `${clamp(r)}-${clamp(g)}-${clamp(b)}`;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += data[offset];
      bucket.g += data[offset + 1];
      bucket.b += data[offset + 2];
      buckets.set(key, bucket);
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, settings.colors)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      return { r, g, b, hex: rgbToHex(r, g, b) };
    });
}

function mapPixelsToPalette(imageData, crop, palette, settings) {
  const { width, data } = imageData;
  const indexes = new Int16Array(crop.width * crop.height);
  indexes.fill(-1);

  if (!palette.length) return indexes;

  for (let y = 0; y < crop.height; y += 1) {
    for (let x = 0; x < crop.width; x += 1) {
      const sourceX = crop.x + x;
      const sourceY = crop.y + y;
      const offset = (sourceY * width + sourceX) * 4;
      if (data[offset + 3] <= settings.alpha) continue;
      indexes[y * crop.width + x] = nearestColorIndex(data[offset], data[offset + 1], data[offset + 2], palette);
    }
  }

  return indexes;
}

function buildMergedRects(indexes, width, height, targetIndex) {
  const active = new Map();
  const rects = [];

  for (let y = 0; y < height; y += 1) {
    const seen = new Set();
    let x = 0;

    while (x < width) {
      while (x < width && indexes[y * width + x] !== targetIndex) x += 1;
      const start = x;
      while (x < width && indexes[y * width + x] === targetIndex) x += 1;
      if (start === x) continue;

      const key = `${start},${x - start}`;
      const existing = active.get(key);
      if (existing) {
        existing.h += 1;
      } else {
        active.set(key, { x: start, y, w: x - start, h: 1 });
      }
      seen.add(key);
    }

    for (const [key, rect] of active) {
      if (!seen.has(key)) {
        rects.push(rect);
        active.delete(key);
      }
    }
  }

  rects.push(...active.values());
  return rects;
}

function rectsToPath(rects) {
  return rects
    .map((rect) => `M ${rect.x} ${rect.y} h ${rect.w} v ${rect.h} h ${-rect.w} Z`)
    .join(" ");
}

function nearestColorIndex(r, g, b, palette) {
  let nearest = 0;
  let bestDistance = Infinity;

  palette.forEach((color, index) => {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = index;
    }
  });

  return nearest;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl, fileName) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: "image/png" });
}

async function readPngDpi(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (view.byteLength < 33 || !signature.every((value, index) => view.getUint8(index) === value)) {
    return null;
  }

  let offset = 8;
  while (offset + 12 <= view.byteLength) {
    const length = view.getUint32(offset);
    const type = getChunkType(view, offset + 4);
    const dataOffset = offset + 8;

    if (type === "pHYs" && length >= 9) {
      const pixelsPerMeterX = view.getUint32(dataOffset);
      const pixelsPerMeterY = view.getUint32(dataOffset + 4);
      const unit = view.getUint8(dataOffset + 8);
      if (unit === 1 && pixelsPerMeterX > 0 && pixelsPerMeterY > 0) {
        return Math.round(((pixelsPerMeterX + pixelsPerMeterY) / 2) * 0.0254);
      }
      return null;
    }

    offset += 12 + length;
  }

  return null;
}

function getChunkType(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, "0")).join("")}`;
}

function compactSvg(svg) {
  return svg.replace(/>\s+</g, "><").trim();
}

function prepareSvgForFile(svg) {
  const cleanSvg = svg.trim();
  if (cleanSvg.startsWith("<?xml")) return cleanSvg;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${cleanSvg}\n`;
}

function getPhysicalSize(width, height, settings) {
  if (settings.physicalWidth > 0 && settings.physicalHeight > 0) {
    return {
      widthIn: formatInches(settings.physicalWidth),
      heightIn: formatInches(settings.physicalHeight),
    };
  }

  return {
    widthIn: formatInches(width / settings.dpi),
    heightIn: formatInches(height / settings.dpi),
  };
}

function formatInches(value) {
  return Number(value.toFixed(4)).toString();
}

function formatSliderNumber(value) {
  return Number(Number(value).toFixed(2)).toString();
}

function getQuantizationStep(colorCount) {
  if (colorCount <= 8) return 64;
  if (colorCount <= 16) return 48;
  if (colorCount <= 32) return 32;
  if (colorCount <= 64) return 24;
  if (colorCount <= 128) return 16;
  return 8;
}

function getSavedStatus(defaultStatus = "SVG saved") {
  if (isLightTransparentVector()) {
    return `${defaultStatus}; light artwork may look blank on white`;
  }
  return defaultStatus;
}

function isLightTransparentVector() {
  const result = state.result;
  if (!result || result.hasBackground || !result.palette?.length) return false;
  return result.palette.every((color) => color.r > 224 && color.g > 224 && color.b > 224);
}

function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
