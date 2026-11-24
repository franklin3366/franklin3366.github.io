"use strict";

const contentList = document.querySelector("#content-list");
const contentStatus = document.querySelector("#content-status");
const journalCategories = {
  food: { label: "好吃的", empty: "还没有美食记录。" },
  activities: { label: "好玩的", empty: "还没有游玩记录。" },
  sights: { label: "好看的", empty: "还没有观赏记录。" },
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function appendText(parent, tag, content, className) {
  if (!content) return;
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  parent.append(element);
}

function createCard() {
  const item = document.createElement("li");
  const card = document.createElement("article");
  card.className = "content-card";
  item.append(card);
  return { item, card };
}

function appendLinks(card, links) {
  const group = document.createElement("div");
  group.className = "content-links";
  for (const [rawUrl, label] of links) {
    let url;
    try {
      url = new URL(cleanText(rawUrl));
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const link = document.createElement("a");
    link.href = url.href;
    link.textContent = label;
    group.append(link);
  }
  if (group.childElementCount) card.append(group);
}

function renderProject(entry) {
  const title = cleanText(entry?.title);
  if (!title) return null;
  const { item, card } = createCard();
  appendText(card, "h2", title);
  appendText(card, "p", cleanText(entry.period), "content-meta");
  appendText(card, "p", cleanText(entry.summary), "content-note");
  appendLinks(card, [[entry.url, "查看项目"], [entry.repository, "源代码"]]);
  return item;
}

function renderExperience(entry) {
  const role = cleanText(entry?.role);
  const organization = cleanText(entry?.organization);
  if (!role || !organization) return null;
  const { item, card } = createCard();
  const start = cleanText(entry.start);
  const end = cleanText(entry.end);
  const period = start ? `${start} – ${end || "至今"}` : end;
  const details = document.createElement("div");
  if (period) {
    card.classList.add("experience-item");
    appendText(card, "p", period, "experience-period");
  }
  appendText(details, "h2", role);
  appendText(details, "p", organization, "content-meta");
  appendText(details, "p", cleanText(entry.summary), "content-note");
  card.append(details);
  return item;
}

function renderJournalEntry(entry) {
  const title = cleanText(entry?.title);
  if (!title) return null;
  const { item, card } = createCard();
  const metadata = [cleanText(entry.place), cleanText(entry.date)].filter(Boolean).join(" · ");
  appendText(card, "h2", title);
  appendText(card, "p", metadata, "content-meta");
  appendText(card, "p", cleanText(entry.note), "content-note");
  appendLinks(card, [[entry.url, "相关链接"]]);
  return item;
}

function selectJournalCategory() {
  const requested = new URLSearchParams(window.location.search).get("category");
  const category = Object.hasOwn(journalCategories, requested) ? requested : "food";
  for (const link of document.querySelectorAll(".journal-nav [data-category]")) {
    if (link.dataset.category === category) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.title = `${journalCategories[category].label} · 生活记录 · Franklin`;
  return category;
}

async function loadProfilePage() {
  const page = document.body.dataset.page;
  const category = page === "journal" ? selectJournalCategory() : null;
  const pages = {
    projects: { render: renderProject, empty: "暂无公开项目。" },
    experience: { render: renderExperience, empty: "暂无公开的工作经历。", orderBy: "start" },
    journal: { render: renderJournalEntry, empty: journalCategories[category]?.empty, orderBy: "date" },
  };
  const { render, empty, orderBy } = pages[page];

  try {
    const response = await fetch(`../data/${page}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Could not load ${page} (${response.status})`);
    const data = await response.json();
    const records = category ? data?.[category] : data;
    if (!Array.isArray(records)) throw new Error(`Expected list for ${category || page}`);
    if (orderBy) records.sort((first, second) => cleanText(second?.[orderBy]).localeCompare(cleanText(first?.[orderBy])));

    const items = records.map(render).filter(Boolean);
    const invalidCount = records.length - items.length;
    contentList.replaceChildren(...items);
    contentStatus.textContent = invalidCount ? `有 ${invalidCount} 条记录的格式需要更正。` : empty;
    contentStatus.hidden = invalidCount === 0 && items.length > 0;
  } catch (error) {
    contentStatus.textContent = "暂时无法读取内容。";
    console.error(error);
  }
}

loadProfilePage();
