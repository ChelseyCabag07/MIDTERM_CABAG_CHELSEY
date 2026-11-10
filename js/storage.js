const KEY = "ctu_requests";
let simulateFailure = false;

export function setSimulateFailure(value) { simulateFailure = value; } // for Challenge A

function checkService() {
  if (simulateFailure) throw new Error("Data service is unavailable.");
}

export function getAll() {
  checkService();
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function add(request) {
  checkService();
  const list = getAll();
  list.push(request);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function update(id, changes) {
  checkService();
  const list = getAll().map(r => r.id === id ? { ...r, ...changes } : r);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export async function pushToServer(list) {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list)
  });
  if (!res.ok) throw new Error("Server responded with status " + res.status);
}