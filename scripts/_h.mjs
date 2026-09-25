// BOOTMARKER
/**
 * Visual audit harness Ã¢â‚¬â€ drives the REAL app in headless Chrome over CDP.
 *
 * Uses Node 22's built-in WebSocket and the Chrome already installed on the
 * machine, so there is no Playwright/Puppeteer dependency to install. It walks
 * the app the way a user would and writes a PNG per state.
 *
 * Usage: node scripts/visual-audit.mjs [outDir]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, mkdtempSync, createReadStream, statSync, appendFileSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';

export const OUT = process.argv[2] || '.tmp-shots';
export const PORT = 4319;
export const CDP_PORT = 9333;
export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const BASE = `http://localhost:${PORT}`;
// The profile MUST live outside the repo: Chrome keeps a lock on it, and
// deleting a locked directory on Windows throws and aborts the run's cleanup.
export const PROFILE = mkdtempSync(join(tmpdir(), 'sq-chrome-'));

export const shots = [];
export const PROGRESS = join(process.cwd(), '.tmp-shots', 'progress.log');
/**
 * Writes to stdout AND an on-disk progress log, unbuffered, so a run that is
 * detached from its parent process still leaves an auditable trail.
 */
console.log('HEAD-OK');
