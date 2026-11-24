"use strict";

const stage = document.querySelector("#map-stage");
const canvas = document.querySelector("#atlas");
const context = canvas.getContext("2d");
const markerLayer = document.querySelector("#map-markers");
const placeList = document.querySelector("#place-list");
const recordsStatus = document.querySelector("#records-status");
const search = document.querySelector("#search");
const detail = document.querySelector("#map-detail");
const zoomIn = document.querySelector("#zoom-in");
const zoomOut = document.querySelector("#zoom-out");
const reset = document.querySelector("#reset");

const maxZoom = 7;
const radians = Math.PI / 180;
const rootThreeOverTwo = Math.sqrt(3) / 2;
const continents = [
  ["北美洲", -105, 49], ["南美洲", -59, -15], ["欧洲", 16, 52],
  ["非洲", 19, 10], ["亚洲", 91, 49], ["大洋洲", 137, -26], ["南极洲", 0, -79],
];
const oceans = [["太平洋", -143, 6], ["大西洋", -38, 21], ["印度洋", 76, -26]];
const view = { zoom: 1, x: 0, y: 0 };
const entries = [];
let selected = null;
let drag = null;
let land;
let geography;
let invalidRecords = 0;

// Equal Earth projection, centered on the prime meridian.
function project(longitude, latitude) {
  const theta = Math.asin(rootThreeOverTwo * Math.sin(latitude * radians));
  const squared = theta ** 2;
  const sixth = theta ** 6;
  const a = 1.340264;
  const b = -0.081106;
  const c = 0.000893;
  const d = 0.003796;
  const derivative = a + 3 * b * squared + sixth * (7 * c + 9 * d * squared);
  return [
    longitude * radians * Math.cos(theta) / (rootThreeOverTwo * derivative),
    -theta * (a + b * squared + sixth * (c + d * squared)),
  ];
}

const halfWidth = project(180, 0)[0];
const halfHeight = Math.abs(project(0, 90)[1]);

function trace(path, coordinates, close = false) {
  const [[firstX, firstY], ...remaining] = coordinates.map(([lng, lat]) => project(lng, lat));
  path.moveTo(firstX, firstY);
  for (const [x, y] of remaining) path.lineTo(x, y);
  if (close) path.closePath();
}

function range(start, end, step) {
  return Array.from({ length: (end - start) / step + 1 }, (_, index) => start + index * step);
}

function makeGeography() {
  const longitude = range(-180, 180, 3);
  const latitude = range(-90, 90, 3);
  const outline = new Path2D();
  trace(outline, [
    ...longitude.map((lng) => [lng, 90]),
    ...latitude.slice().reverse().map((lat) => [180, lat]),
    ...longitude.slice().reverse().map((lng) => [lng, -90]),
    ...latitude.map((lat) => [-180, lat]),
  ], true);
  const grid = new Path2D();
  for (const lng of range(-150, 150, 30)) trace(grid, latitude.map((lat) => [lng, lat]));
  for (const lat of range(-60, 60, 30)) trace(grid, longitude.map((lng) => [lng, lat]));
  return { outline, grid };
}

function measure() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const padding = Math.min(32, width * 0.046);
  const fit = Math.min((width / 2 - padding) / halfWidth, (height / 2 - padding) / halfHeight);
  return { width, height, scale: fit * view.zoom };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function constrainPan({ width, height, scale }) {
  const inset = view.zoom === 1 ? 0 : 24;
  const horizontal = Math.max(0, halfWidth * scale - width / 2 + inset);
  const vertical = Math.max(0, halfHeight * scale - height / 2 + inset);
  view.x = clamp(view.x, -horizontal, horizontal);
  view.y = clamp(view.y, -vertical, vertical);
}

function viewportPoint([x, y], { width, height, scale }) {
  return [width / 2 + view.x + x * scale, height / 2 + view.y + y * scale];
}

function labelMap(frame) {
  context.textAlign = "center";
  context.textBaseline = "middle";
  const fontSize = frame.width < 530 ? 10 : 13;
  context.fillStyle = "#2c594b";
  context.font = `600 ${fontSize}px system-ui, sans-serif`;
  for (const [label, lng, lat] of continents) context.fillText(label, ...viewportPoint(project(lng, lat), frame));
  if (frame.width < 530) return;
  context.fillStyle = "#51756c";
  context.font = "12px system-ui, sans-serif";
  for (const [label, lng, lat] of oceans) context.fillText(label, ...viewportPoint(project(lng, lat), frame));
}

function drawMap() {
  if (!geography) return;
  const frame = measure();
  if (frame.scale <= 0) return;
  constrainPan(frame);
  const { width, height, scale } = frame;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * pixelRatio);
  const pixelHeight = Math.round(height * pixelRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width / 2 + view.x, height / 2 + view.y);
  context.scale(scale, scale);
  context.fillStyle = "#cfe4df";
  context.fill(geography.outline);
  context.lineWidth = 0.8 / scale;
  context.strokeStyle = "#9ab9af";
  context.stroke(geography.grid);
  if (land) {
    context.fillStyle = "#f9f8e9";
    context.fill(land, "evenodd");
    context.strokeStyle = "#8bab9a";
    context.stroke(land);
  }
  context.strokeStyle = "#8bab9f";
  context.stroke(geography.outline);
  context.restore();
  if (land) labelMap(frame);
  for (const entry of entries) {
    const [x, y] = viewportPoint(entry.point, frame);
    entry.marker.hidden = !entry.matches || x < 16 || y < 16 || x > width - 16 || y > height - 16;
    entry.marker.style.left = `${x}px`;
    entry.marker.style.top = `${y}px`;
  }
}

function updateView() {
  zoomOut.disabled = view.zoom === 1;
  reset.disabled = view.zoom === 1;
  zoomIn.disabled = view.zoom === maxZoom;
  stage.classList.toggle("is-zoomed", view.zoom > 1);
  drawMap();
}

function setZoom(zoom) {
  const next = clamp(zoom, 1, maxZoom);
  const change = next / view.zoom;
  view.x *= change;
  view.y *= change;
  view.zoom = next;
  updateView();
}

function showPlace(entry, center = false) {
  if (selected) {
    selected.marker.setAttribute("aria-pressed", "false");
    selected.card.setAttribute("aria-pressed", "false");
  }
  selected = entry;
  detail.hidden = !entry;
  if (!entry) return;
  const { place, marker, card } = entry;
  marker.setAttribute("aria-pressed", "true");
  card.setAttribute("aria-pressed", "true");
  document.querySelector("#detail-country").textContent = place.country;
  document.querySelector("#detail-name").textContent = place.name;
  for (const [id, text] of [["#detail-date", place.visited], ["#detail-note", place.note]]) {
    const element = document.querySelector(id);
    element.textContent = text;
    element.hidden = !text;
  }
  if (!center) return;
  view.zoom = Math.max(view.zoom, 2);
  const { scale } = measure();
  view.x = -entry.point[0] * scale;
  view.y = -entry.point[1] * scale;
  updateView();
  stage.focus({ preventScroll: true });
  stage.scrollIntoView({ block: "center" });
}

function closePlace() {
  const marker = selected?.marker;
  showPlace(null);
  (marker && !marker.hidden ? marker : stage).focus({ preventScroll: true });
}

function normalizePlace(record) {
  if (!record || typeof record !== "object") return null;
  const { name, country, lat, lng, visited = "", note = "" } = record;
  if (typeof name !== "string" || !name.trim() || typeof country !== "string" || !country.trim()) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (typeof visited !== "string" || typeof note !== "string") return null;
  const date = visited.trim();
  if (date && !/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/.test(date)) return null;
  if (date.length === 10) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  }
  return { name: name.trim(), country: country.trim(), lat, lng, visited: date, note: note.trim() };
}

function createEntry(place) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = "marker";
  marker.title = `${place.name} · ${place.country}`;
  marker.setAttribute("aria-label", marker.title);
  marker.setAttribute("aria-pressed", "false");
  marker.hidden = true;

  const row = document.createElement("li");
  const card = document.createElement("button");
  card.className = "record";
  card.type = "button";
  card.setAttribute("aria-pressed", "false");
  const name = document.createElement("span");
  name.className = "record-name";
  name.textContent = place.name;
  const meta = document.createElement("span");
  meta.className = "record-meta";
  meta.textContent = [place.country, place.visited].filter(Boolean).join(" · ");
  card.append(name, meta);
  row.append(card);

  const entry = { place, point: project(place.lng, place.lat), marker, row, card, matches: true };
  marker.addEventListener("click", () => showPlace(entry));
  card.addEventListener("click", () => showPlace(entry, true));
  markerLayer.append(marker);
  placeList.append(row);
  return entry;
}

function filterPlaces() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const entry of entries) {
    const { name, country } = entry.place;
    entry.matches = `${name} ${country}`.toLocaleLowerCase().includes(query);
    entry.row.hidden = !entry.matches;
    if (entry.matches) count += 1;
  }
  if (selected && !selected.matches) showPlace(null);
  const messages = [];
  if (invalidRecords) messages.push(`有 ${invalidRecords} 条记录的格式需要更正。`);
  if (!entries.length && !invalidRecords) messages.push("还没有旅行记录。");
  if (entries.length && !count) messages.push("没有找到符合条件的地点。");
  recordsStatus.textContent = messages.join(" ");
  recordsStatus.hidden = messages.length === 0;
  drawMap();
}

async function readJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

async function loadPlaces() {
  try {
    const data = await readJson("./data/places.json");
    if (!Array.isArray(data)) throw new Error("Travel records must be an array");
    const valid = data.map(normalizePlace).filter(Boolean);
    invalidRecords = data.length - valid.length;
    valid.sort((first, second) => second.visited.localeCompare(first.visited) || first.name.localeCompare(second.name, "zh-CN"));
    const uniquePlaces = new Set(valid.map(({ name, country }) => JSON.stringify([name, country])));
    document.querySelector("#place-count").textContent = uniquePlaces.size;
    document.querySelector("#country-count").textContent = new Set(valid.map(({ country }) => country)).size;
    document.querySelector("#search-wrap").hidden = valid.length === 0;
    for (const place of valid) entries.push(createEntry(place));
    filterPlaces();
  } catch (error) {
    recordsStatus.textContent = "暂时无法读取旅行记录。";
    console.error(error);
  }
}

async function loadMap() {
  try {
    if (!context || typeof Path2D === "undefined") throw new Error("Map drawing is unavailable");
    geography = makeGeography();
    new ResizeObserver(drawMap).observe(stage);
    const polygons = await readJson("./assets/land.json");
    const coastlines = new Path2D();
    for (const polygon of polygons) {
      for (const ring of polygon) trace(coastlines, ring, true);
    }
    land = coastlines;
    drawMap();
  } catch (error) {
    document.querySelector("#map-error").hidden = false;
    console.error(error);
  }
}

zoomIn.addEventListener("click", () => setZoom(view.zoom * 1.4));
zoomOut.addEventListener("click", () => setZoom(view.zoom / 1.4));
reset.addEventListener("click", () => setZoom(1));
search.addEventListener("input", filterPlaces);
document.querySelector("#detail-close").addEventListener("click", closePlace);

stage.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && selected) {
    closePlace();
    return;
  }
  if (event.target !== stage || event.ctrlKey || event.metaKey || event.altKey) return;
  const shifts = { ArrowLeft: [45, 0], ArrowRight: [-45, 0], ArrowUp: [0, 45], ArrowDown: [0, -45] };
  if (event.key === "+" || event.key === "=") setZoom(view.zoom * 1.4);
  else if (event.key === "-") setZoom(view.zoom / 1.4);
  else if (event.key === "0") setZoom(1);
  else if (view.zoom > 1 && Object.hasOwn(shifts, event.key)) {
    const [x, y] = shifts[event.key];
    view.x += x;
    view.y += y;
    drawMap();
  } else return;
  event.preventDefault();
});

stage.addEventListener("pointerdown", (event) => {
  if (view.zoom === 1 || event.button !== 0 || event.target.closest("button, .map-detail")) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
  stage.classList.add("is-dragging");
});
stage.addEventListener("pointermove", (event) => {
  if (drag?.id !== event.pointerId) return;
  view.x += event.clientX - drag.x;
  view.y += event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  drawMap();
});
stage.addEventListener("lostpointercapture", (event) => {
  if (drag?.id !== event.pointerId) return;
  drag = null;
  stage.classList.remove("is-dragging");
});

loadMap();
loadPlaces();
