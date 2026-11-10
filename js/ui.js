import { STATUSES, CONCERN_TYPES } from "./config.js";
import * as service from "./service.js";

const $ = (id) => document.getElementById(id);
let messageTimer;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(type, text, list = []) {
  const box = $("message");
  box.className = "message " + type;
  box.innerHTML = escapeHtml(text) +
    (list.length ? "<ul>" + list.map(e => `<li>${escapeHtml(e)}</li>`).join("") + "</ul>" : "");
  box.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (box.hidden = true), 6000);
}

function today() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function fillSelects() {
  $("type").innerHTML = '<option value="">-- Select type --</option>' +
    CONCERN_TYPES.map(t => `<option value="${t}">${t}</option>`).join("");
  $("filter").innerHTML = '<option value="">All statuses</option>' +
    STATUSES.map(s => `<option value="${s}">${s}</option>`).join("");
  $("date").value = today();
}

function renderRequests() {
  const list = $("request-list");
  let requests;
  try {
    requests = service.getRequests($("filter").value, $("search").value);
  } catch (e) {
    list.innerHTML = '<p class="empty">Unable to load requests.</p>';
    showMessage("error", "Could not retrieve requests: " + e.message);
    return;
  }
  if (!requests.length) {
    list.innerHTML = '<p class="empty">No requests found.</p>';
    return;
  }
  list.innerHTML = requests.slice().reverse().map(r => `
    <div class="request">
      <div class="id">${escapeHtml(r.id)}</div>
      <div class="meta"><strong>${escapeHtml(r.name)}</strong> | ${escapeHtml(r.type)} | ${escapeHtml(r.date)}</div>
      <div>${escapeHtml(r.description)}</div>
      <div class="meta">Status: <span class="badge">${escapeHtml(r.status)}</span></div>
      <select data-id="${escapeHtml(r.id)}" aria-label="Change status">
        ${STATUSES.map(s => `<option ${s === r.status ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </div>`).join("");
}

// ---- Event handlers (UI only calls service functions) ----
$("request-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const result = service.createRequest({
    name: $("name").value,
    type: $("type").value,
    description: $("description").value,
    date: $("date").value
  });
  if (!result.ok) {
    showMessage("error", "Please fix the following:", result.errors);
    return;
  }
  showMessage("success", `Request submitted! Your Request ID is ${result.request.id}`);
  e.target.reset();
  $("date").value = today();
  renderRequests();
});

$("request-list").addEventListener("change", (e) => {
  if (!e.target.matches("select[data-id]")) return;
  const result = service.changeStatus(e.target.dataset.id, e.target.value);
  if (result.ok) showMessage("success", "Status updated to " + e.target.value + ".");
  else showMessage("error", "Status was not changed:", result.errors);
  renderRequests();
});

$("search").addEventListener("input", renderRequests);
$("filter").addEventListener("change", renderRequests);

$("fail-toggle").addEventListener("change", (e) => {
  service.setServiceFailure(e.target.checked);
  showMessage(e.target.checked ? "error" : "success",
    e.target.checked ? "Simulated failure is ON." : "Simulated failure is OFF.");
  renderRequests();
});

// ---- Online/offline indicator ----
function updateOnlineStatus() { $("offline-banner").hidden = navigator.onLine; }
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

$("sync-btn").addEventListener("click", async () => {
  const result = await service.syncToServer();
  if (result.ok) showMessage("success", `Synced ${result.count} request(s) to the server.`);
  else showMessage("error", "Sync was not completed:", result.errors);
});

// ---- Start ----
fillSelects();
updateOnlineStatus();
renderRequests();