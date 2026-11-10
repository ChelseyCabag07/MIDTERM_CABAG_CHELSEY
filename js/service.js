import { STATUSES, DEFAULT_STATUS, CONCERN_TYPES } from "./config.js";
import * as storage from "./storage.js";

function generateId() {
  return "REQ-" + Date.now().toString(36).toUpperCase() + "-" +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function validate(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push("Student name is required (at least 2 characters).");
  if (!CONCERN_TYPES.includes(data.type)) errors.push("Please select a type of concern.");
  if (!data.description || data.description.trim().length < 10) errors.push("Description must be at least 10 characters.");
  if (!data.date) errors.push("Date of request is required.");
  return errors;
}

export function createRequest(data) {
  const errors = validate(data);
  if (errors.length) return { ok: false, errors };
  const request = {
    id: generateId(),               // unique even if descriptions are identical
    name: data.name.trim(),
    type: data.type,
    description: data.description.trim(),
    date: data.date,
    status: DEFAULT_STATUS
  };
  try {
    storage.add(request);
    return { ok: true, request };
  } catch (e) {
    return { ok: false, errors: [e.message] };  // never report success on failure
  }
}

export function changeStatus(id, status) {
  if (!STATUSES.includes(status)) return { ok: false, errors: ["Invalid status."] };
  try { storage.update(id, { status }); return { ok: true }; }
  catch (e) { return { ok: false, errors: [e.message] }; }
}

export function getRequests(statusFilter = "", search = "") {
  const q = search.trim().toLowerCase();
  return storage.getAll().filter(r =>
    (!statusFilter || r.status === statusFilter) &&
    (!q || r.id.toLowerCase().includes(q))
  );
}

export function setServiceFailure(value) { storage.setSimulateFailure(value); } // for Challenge A

export async function syncToServer() {
  if (!navigator.onLine) {
    return { ok: false, errors: ["You are offline. Sync needs an internet connection. Your requests are saved on this device and were NOT synced."] };
  }
  try {
    const list = storage.getAll();
    await storage.pushToServer(list);
    return { ok: true, count: list.length };
  } catch (e) {
    return { ok: false, errors: ["Sync failed: " + e.message + ". Nothing was synced."] };
  }
}