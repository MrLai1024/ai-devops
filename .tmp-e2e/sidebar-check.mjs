import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9397;
const PROFILE = mkdtempSync(join(tmpdir(), 'ai-devops-edge-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  'http://localhost:8787/#/requirements'
], { stdio: 'ignore' });

async function waitFor(fn, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error('timeout');
}

let ws;
let nextId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}

const errors = [];
try {
  const target = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.find((t) => t.type === 'page' && t.url.includes('localhost:8787'));
  });
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.text);
    }
  };
  await send('Runtime.enable');
  await waitFor(async () => (await evaluate(`document.querySelectorAll('.sidebar .side-item').length`)) >= 6);

  const labels = await evaluate(`Array.from(document.querySelectorAll('.sidebar .side-item')).map((el) => el.textContent.trim())`);
  const hasQuick = await evaluate(`document.querySelector('.sidebar').textContent.includes('快捷操作')`);
  const hasFoot = await evaluate(`!!document.querySelector('.sidebar .side-foot')`);
  const hasStart = await evaluate(`document.querySelector('.sidebar').textContent.includes('启动 Agent')`);
  const hasBatch = await evaluate(`document.body.innerText.includes('批次发布')`);
  console.log('sidebar items:', labels.join(' | '));
  console.log('quick section present:', hasQuick);
  console.log('side-foot present:', hasFoot);
  console.log('start agent button present:', hasStart);
  console.log('batch release present anywhere:', hasBatch);

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const { writeFileSync } = await import('node:fs');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('.tmp-e2e/sidebar-clean.png', Buffer.from(shot.data, 'base64'));

  await evaluate(`document.querySelector('[data-action="avatar"]').click()`);
  await sleep(250);
  const menuLabels = await evaluate(`Array.from(document.querySelectorAll('#avatar-menu .menu-item')).map((el) => el.textContent.trim())`);
  console.log('avatar menu:', menuLabels.join(' | '));
  const menuShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('.tmp-e2e/nav-avatar-menu.png', Buffer.from(menuShot.data, 'base64'));

  await evaluate(`document.querySelector('#avatar-menu [data-action="open-nav-config"]').click()`);
  await sleep(350);
  const configShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('.tmp-e2e/platform-settings.png', Buffer.from(configShot.data, 'base64'));

  console.log('console errors:', errors.length);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  edge.kill();
}
