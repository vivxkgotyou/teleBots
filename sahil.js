#!/usr/bin/env node
// sahil_ultimate.js - RAID EDITION WITH FLASK SERVER // Author: Sahil
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const TelegramBot = require("node-telegram-bot-api");
const gTTS = require("gtts");

process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

// ---------- EMBEDDED FLASK SERVER (PORT BINDING) ----------
const PORT = process.env.PORT || 8080;

const flaskScriptContent = `
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "Bot status: Active & Running (Flask Server)", 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", ${PORT}))
    app.run(host='0.0.0.0', port=port)
`;

const flaskFilePath = path.join(__dirname, "flask_server.py");
fs.writeFileSync(flaskFilePath, flaskScriptContent.trim());

// Start Python Flask process
const flaskProcess = spawn("python3", [flaskFilePath]);

flaskProcess.stdout.on("data", (data) => {
    console.log(`[FLASK SERVER] ${data.toString().trim()}`);
});

flaskProcess.stderr.on("data", (data) => {
    console.log(`[FLASK LOG] ${data.toString().trim()}`);
});

flaskProcess.on("close", (code) => {
    console.log(`[FLASK SERVER] Exited with code ${code}`);
});

// ---------- HARDCODED FONT UTILITIES ----------
const BOLD_MAP = {
  'A':'𝐀','B':'𝐁','C':'𝐂','D':'𝐃','E':'𝐄','F':'𝐅','G':'𝐆','H':'𝐇','I':'𝐈','J':'𝐉','K':'𝐊','L':'𝐋','M':'𝐌',
  'N':'𝐍','O':'𝐎','P':'𝐏','Q':'𝐐','R':'𝐑','S':'𝐒','T':'𝐓','U':'𝐔','V':'𝐕','W':'𝐖','X':'𝐗','Y':'𝐘','Z':'𝐙',
  'a':'𝐚','b':'𝐛','c':'𝐜','d':'𝐝','e':'𝐞','f':'𝐟','g':'𝐠','h':'𝐡','i':'𝐢','j':'𝐣','k':'𝐤','l':'𝐥','m':'𝐦',
  'n':'𝐧','o':'𝐨','p':'𝐩','q':'𝐪','r':'𝐫','s':'𝐬','t':'𝐭','u':'𝑢','v':'𝐯','w':'𝐰','x':'𝐱','y':'𝐲','z':'𝐳',
  '0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗',
  '!':'❗','?':'❓','-':'‐','_':'＿','(':'（',')':'）','.':'．',',':'，'
};
const ITALIC_MAP = {
  'A':'𝐴','B':'𝐵','C':'𝐶','D':'𝐷','E':'𝐸','F':'𝐹','G':'𝐺','H':'𝐻','I':'𝐼','J':'𝐽','K':'𝐾','L':'𝐿','M':'𝑀',
  'N':'𝑁','O':'𝑂','P':'𝑃','Q':'𝑄','R':'𝑅','S':'𝑆','T':'𝑇','U':'𝑈','V':'𝑉','W':'𝑊','X':'𝑋','Y':'𝑌','Z':'𝑍',
  'a':'𝑎','b':'𝑏','c':'𝑐','d':'𝑑','e':'𝑒','f':'𝑓','g':'𝑔','h':'ℎ','i':'𝑖','j':'𝑗','k':'𝑘','l':'𝑙','m':'𝑚',
  'n':'𝑛','o':'𝑜','p':'𝑝','q':'𝑞','r':'𝑟','s':'𝑠','t':'𝑡','u':'𝑢','v':'𝑣','w':'𝑤','x':'𝑥','y':'𝑦','z':'𝑧',
  '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
  ' ':' ','!':'!','?':'?','-':'-','_':'_','(':'(',')':')','.':'.',',':',','/':'/',':':':','|':'|','→':'→','<':'<','>':'>'
};
const BI_MAP = {
  'A':'𝑨','B':'𝑩','C':'𝑪','D':'𝑫','E':'𝑬','F':'𝑭','G':'𝑮','H':'𝑯','I':'𝑰','J':'𝑱','K':'𝑲','L':'𝑳','M':'𝑴',
  'N':'𝑵','O':'𝑶','P':'𝑷','Q':'𝑸','R':'𝑴','S':'𝑺','T':'𝑻','U':'𝑼','V':'𝑽','W':'𝑾','X':'𝑿','Y':'𝒀','Z':'𝒁',
  'a':'𝒂','b':'𝒃','c':'𝒄','d':'𝒅','e':'𝒆','f':'𝒇','g':'𝒈','h':'𝒉','i':'𝒊','j':'𝒋','k':'𝒌','l':'𝒍','m':'𝒎',
  'n':'𝒏','o':'𝒐','p':'𝒑','q':'𝒒','r':'𝒓','s':'𝒔','t':'𝒕','u':'𝒖','v':'𝒗','w':'𝒘','x':'𝒙','y':'𝒚','z':'𝒛',
  '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
  ' ':' ','!':'!','?':'?','-':'-','_':'_','(':'(',')':')','.':'.',',':',','/':'/',':':':','|':'|','→':'→','<':'<','>':'>'
};
const MONO_MAP = {
  'A':'𝙰','B':'𝙱','C':'𝙲','D':'𝙳','E':'𝙴','F':'𝙵','G':'𝙶','H':'𝙷','I':'𝙸','J':'𝙹','K':'𝙺','L':'𝙻','M':'𝙼',
  'N':'𝙽','O':'𝙾','P':'𝙿','Q':'𝚀','R':'𝚁','S':'𝚂','T':'𝚃','U':'𝚄','V':'𝚅','W':'𝚆','X':'𝚇','Y':'𝚈','Z':'𝚉',
  'a':'𝚊','b':'𝚋','c':'𝚌','d':'𝚍','e':'𝚎','f':'𝚏','g':'𝚐','h':'𝚑','i':'𝚒','j':'𝚓','k':'𝚔','l':'𝚕','m':'𝚖',
  'n':'𝚗','o':'𝚘','p':'𝚙','q':'𝚚','r':'𝚛','s':'𝚜','t':'𝚝','u':'𝚞','v':'𝚟','w':'𝚠','x':'𝚡','y':'𝚢','z':'𝚣',
  '0':'𝟶','1':'𝟷','2':'𝟸','3':'𝟹','4':'𝟺','5':'𝟻','6':'𝟼','7':'𝟽','8':'𝟾','9':'𝟿'
};
function toBold(str) { if (!str) return ""; return String(str).split('').map(c => BOLD_MAP[c] || c).join(''); }
function toItalic(str) { if (!str) return ""; return String(str).split('').map(c => ITALIC_MAP[c] || c).join(''); }
function toBI(str) { if (!str) return ""; return String(str).split('').map(c => BI_MAP[c] || c).join(''); }
function toMono(str) { if (!str) return ""; return String(str).split('').map(c => MONO_MAP[c] || c).join(''); }
const i = toItalic;
const b = toBold;

// ---------- CONFIG ----------
const STATE_FILE = "state.json";
const TOKENS_FILE = "tokens.txt";
const TARGET_FILE = "target.txt";
const ASPAM_FILE = "aspam.txt";
const RAID_FILE = "raid.txt";
const MAX_BOTS = 100;
const MAX_RETRIES = 10;
const RECONNECT_DELAY = 1000;

// ---------- ENVIRONMENT VARIABLES PARSING ----------
function getEnvTokens() {
    const tokens = [];
    if (process.env.BOT_TOKEN) tokens.push(process.env.BOT_TOKEN.trim());
    if (process.env.BOT_TOKENS) {
        process.env.BOT_TOKENS.split(',').forEach(t => {
            if (t.trim()) tokens.push(t.trim());
        });
    }
    Object.keys(process.env).forEach(key => {
        if (key.startsWith("BOT_TOKEN_")) {
            const val = process.env[key].trim();
            if (val) tokens.push(val);
        }
    });
    return tokens;
}

function getEnvOwnerIds() {
    const defaultAdmins = [7823291958, 8262785995];
    const envOwners = process.env.OWNER_IDS || process.env.OWNER_ID;
    if (envOwners) {
        const parsed = envOwners.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0);
        parsed.forEach(id => {
            if (!defaultAdmins.includes(id)) defaultAdmins.push(id);
        });
    }
    return defaultAdmins;
}

// ---------- UPTIME TRACKER ----------
const START_TIME = Date.now();
const connectedBots = new Set();

function getUptime() {
    const ms = Date.now() - START_TIME;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / (1000 * 60)) % 60;
    const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${d}d ${h}h ${m}m ${s}s`;
}

function countActiveModules(chatId) {
    let count = 0;
    const cs = chatState[chatId] || {};
    const raidStat = chatState.raid[chatId] || {};
    const psStat = chatState.photospam[chatId] || {};
    if (cs.nc?.active) count++;
    if (cs.desnc?.active) count++;
    if (cs.pfp?.active) count++;
    if (cs.spam?.active) count++;
    if (cs.aspam?.active) count++;
    if (raidStat.active) count++;
    if (cs.slide?.active) count++;
    if (cs.vn?.active) count++;
    if (psStat.active) count++;
    if (chatState.autopin[chatId]) count++;
    if (chatState.reactions[chatId]?.reactall?.active) count++;
    if (chatState.reactions[chatId]?.react?.active) count++;
    return count;
}

function getActiveChats() {
    const chats = new Set();
    const stateKeys = ['nc','desnc','pfp','spam','aspam','slide','vn'];
    for (const key of stateKeys) {
        if (!chatState[key]) continue;
        for (const cid of Object.keys(chatState[key])) {
            if (chatState[key][cid]?.active) chats.add(cid);
        }
    }
    if (chatState.raid) for (const cid of Object.keys(chatState.raid)) if (chatState.raid[cid]?.active) chats.add(cid);
    if (chatState.photospam) for (const cid of Object.keys(chatState.photospam)) if (chatState.photospam[cid]?.active) chats.add(cid);
    if (chatState.autopin) for (const cid of Object.keys(chatState.autopin)) if (chatState.autopin[cid]) chats.add(cid);
    if (chatState.reactions) for (const cid of Object.keys(chatState.reactions)) {
        if (chatState.reactions[cid]?.reactall?.active || chatState.reactions[cid]?.react?.active) chats.add(cid);
    }
    return Array.from(chats);
}

let chatState = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE)) : {
    admins: getEnvOwnerIds(),
    delay: { nc: 100, spam: 1500, vn: 3500, pfp: 3000, slide: 300, photospam: 2000, desnc: 100, aspam: 1500, raid: 2000 },
    targets: {},
    muted: {},
    photoreply: {},
    photospam: {},
    photoreload: {},
    replies: {},
    autopin: {},
    reactions: {},
    raid: {}
};

// Sync env owners to state admins
const envAdmins = getEnvOwnerIds();
envAdmins.forEach(id => {
    if (!chatState.admins.includes(id)) chatState.admins.push(id);
});

function forceReloadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const newState = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
            Object.keys(newState).forEach(key => { chatState[key] = newState[key]; });
        }
    } catch (e) {}
}
function saveStateAndSync() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(chatState, null, 2));
        forceReloadState();
    } catch (e) {}
}

if (!chatState.photoreply) chatState.photoreply = {};
if (!chatState.photospam) chatState.photospam = {};
if (!chatState.photoreload) chatState.photoreload = {};
if (!chatState.replies) chatState.replies = {};
if (!chatState.autopin) chatState.autopin = {};
if (!chatState.reactions) chatState.reactions = {};
if (!chatState.raid) chatState.raid = {};

function ensureList(chatId, key) {
    if (!chatState[key]) chatState[key] = {};
    if (!chatState[key][chatId] || !Array.isArray(chatState[key][chatId])) chatState[key][chatId] = [];
    return chatState[key][chatId];
}
function ensurePhotoReply(chatId) {
    if (!chatState.photoreply[chatId] || typeof chatState.photoreply[chatId] !== 'object') chatState.photoreply[chatId] = {};
    return chatState.photoreply[chatId];
}
function ensurePhotoSpam(chatId) {
    if (!chatState.photospam[chatId] || typeof chatState.photospam[chatId] !== 'object') chatState.photospam[chatId] = { active: false, photoFileId: null };
    return chatState.photospam[chatId];
}
function ensureReplies(chatId) {
    if (!chatState.replies[chatId] || typeof chatState.replies[chatId] !== 'object') chatState.replies[chatId] = {};
    return chatState.replies[chatId];
}
function ensureReactions(chatId) {
    if (!chatState.reactions[chatId] || typeof chatState.reactions[chatId] !== 'object') chatState.reactions[chatId] = {};
    return chatState.reactions[chatId];
}
function ensureRaid(chatId) {
    if (!chatState.raid[chatId] || typeof chatState.raid[chatId] !== 'object') chatState.raid[chatId] = { active: false, targetId: null, texts: [], index: 0 };
    return chatState.raid[chatId];
}
function getReloadPhotos(chatId) {
    if (!chatState.photoreload[chatId]) chatState.photoreload[chatId] = [];
    return chatState.photoreload[chatId];
}
function getRandomReloadPhoto(chatId) {
    const photos = getReloadPhotos(chatId);
    const validPhotos = photos.filter(p => p !== null);
    if (validPhotos.length === 0) return null;
    return validPhotos[Math.floor(Math.random() * validPhotos.length)];
}
function loadAspamTexts() {
    try {
        if (!fs.existsSync(ASPAM_FILE)) return [];
        const raw = fs.readFileSync(ASPAM_FILE, "utf8");
        const lines = raw.split(/\r?\n/); const result = []; let multiLine = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (multiLine === null) {
                if (trimmed.startsWith('"')) {
                    multiLine = trimmed.substring(1);
                    if (multiLine.endsWith('"')) { result.push(multiLine.slice(0, -1)); multiLine = null; }
                } else if (trimmed.length > 0) result.push(trimmed);
            } else {
                if (trimmed.endsWith('"')) { multiLine += '\n' + trimmed.slice(0, -1); result.push(multiLine); multiLine = null; }
                else multiLine += '\n' + trimmed;
            }
        }
        if (multiLine !== null) result.push(multiLine);
        return result;
    } catch (e) { return []; }
}
function loadRaidTexts() {
    try {
        if (!fs.existsSync(RAID_FILE)) return [];
        const raw = fs.readFileSync(RAID_FILE, "utf8");
        const lines = raw.split(/\r?\n/); const result = []; let multiLine = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (multiLine === null) {
                if (trimmed.startsWith('"')) {
                    multiLine = trimmed.substring(1);
                    if (multiLine.endsWith('"')) { result.push(multiLine.slice(0, -1)); multiLine = null; }
                } else if (trimmed.length > 0) result.push(trimmed);
            } else {
                if (trimmed.endsWith('"')) { multiLine += '\n' + trimmed.slice(0, -1); result.push(multiLine); multiLine = null; }
                else multiLine += '\n' + trimmed;
            }
        }
        if (multiLine !== null) result.push(multiLine);
        return result;
    } catch (e) { return []; }
}

let BOT_TOKENS = getEnvTokens();
if (BOT_TOKENS.length === 0 && fs.existsSync(TOKENS_FILE)) {
    try {
        BOT_TOKENS = fs.readFileSync(TOKENS_FILE, "utf8").split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, MAX_BOTS);
    } catch (e) {}
}

let TARGET_TEXTS = [];
function loadTargetTexts() {
    try {
        if (fs.existsSync(TARGET_FILE)) TARGET_TEXTS = fs.readFileSync(TARGET_FILE, "utf8").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    } catch (e) {}
}
loadTargetTexts();

const ALL_EMOJIS = [
    "⚡","🔥","💥","✨","🌟","⭐","🌙","☄️","🌪️","🌀","🌋","🌈","⛈️","🌊","🌩️","🖤","💜","💙","💚","💛",
    "🧡","❤️","🎭","🎪","🎬","🎯","🎲","🎰","🎱","🏹","🗡","🛡️","⚔️","🔫","💣","🧨","🦁","🐯","🐉","🐲",
    "🦅","👑","💎","💀","👻","👽","🤖","🎃","🎄","🎁","🎈","🎉","🎊","🎋","🎌","🎍","🎎","🎏","🎐",
    "🎒","🎓","🎠","🎡","🎢","🎣","🎤","🎥","🎦","🎧","🎨","🎩","🎪","🎫","🎬","🎭","🎮","🎯","🎰","🎱",
    "🎲"," bowling","🎴","🎵","🎶","🎷","🎸","🎹","🎺","🎻","🎼","🎽","🎾","🎿","🏀","🏁","🏂","🏃","🏄","🏆",
    "🏇","🏈","🏉","🏊","🏋","🏌","🏍","🏎","🏏","🏐","🏑","🏒","🏓","🏔","🏕","🏖","🏗","🏘","🏙","🏚",
    "😺","😸","😹","😻","😼","😽","🙀","😿","😾","😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
    "🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","🤗"
];

const rateLimiters = {};
function isAdmin(userId) { return chatState.admins.includes(Number(userId)); }

async function safeSendMessage(bot, chatId, text, replyToMsg, opts = {}) {
    const options = Object.assign({ parse_mode: "Markdown" }, opts);
    try {
        if (replyToMsg && replyToMsg.message_id) options.reply_to_message_id = replyToMsg.message_id;
        return await bot.sendMessage(chatId, text, options);
    } catch (err) { return null; }
}

function createStableBot(token, botIndex) {
    const botOptions = {
        polling: { interval: 100, autoStart: true, params: { timeout: 30, limit: 100, allowed_updates: ["message","new_chat_members","new_chat_title","new_chat_photo","delete_chat_photo"] } },
        request: { timeout: 10000, forever: true, pool: { maxSockets: 50, maxFreeSockets: 10, timeout: 60000, freeSocketTimeout: 30000 } }
    };
    const bot = new TelegramBot(token, botOptions);
    rateLimiters[botIndex] = { lastRequest: 0 };
    bot.on("polling_error", (error) => {
        if (error.code === 'EFATAL' || error.code === 'ETELEGRAM') {
            console.log(`[BOT ${botIndex}] Critical error, restarting polling...`);
            setTimeout(() => {
                bot.stopPolling().then(() => {
                    setTimeout(() => bot.startPolling(), 500);
                }).catch(() => {});
            }, RECONNECT_DELAY);
        }
    });
    bot.on("error", (error) => {
        console.log(`[BOT ${botIndex}] Error: ${error.message}`);
    });
    bot.on("webhook_error", () => {});
    setInterval(async () => { try { await bot.getMe(); } catch (e) {} }, 300000);
    return bot;
}

async function rateLimitedRequest(botIndex, fn) {
    const limiter = rateLimiters[botIndex];
    if (!limiter) return fn();
    const now = Date.now();
    const timeSinceLastRequest = now - limiter.lastRequest;
    if (timeSinceLastRequest < 20) await new Promise(resolve => setTimeout(resolve, 20 - timeSinceLastRequest));
    limiter.lastRequest = Date.now();
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try { return await fn(); }
        catch (e) {
            if (e.response && e.response.statusCode === 429) {
                const waitTime = (e.response.body?.parameters?.retry_after || 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            if (retry >= 3) throw e;
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retry)));
        }
    }
}

BOT_TOKENS.forEach((token, botIndex) => {
    if (!token) return;
    let retryCount = 0;
    function initBot() {
        try {
            const bot = createStableBot(token, botIndex);
            bot.getMe().then(() => {
                connectedBots.add(botIndex);
                console.log(`[BOT ${botIndex}] Connected & Stable ✓`);
            }).catch((e) => {
                console.log(`[BOT ${botIndex}] Connect failed: ${e.message}`);
            });
            setupBotHandlers(bot, token, botIndex);
        } catch (e) {
            console.log(`[BOT ${botIndex}] Init error: ${e.message}`);
            if (retryCount < MAX_RETRIES) { retryCount++; setTimeout(initBot, RECONNECT_DELAY * retryCount); }
        }
    }
    initBot();
});

function setupBotHandlers(bot, token, botIndex) {
    let botUserId = null;
    bot.getMe().then(me => { botUserId = me.id; }).catch(() => {});

    bot.on("new_chat_members", async (msg) => {
        if (!botUserId) return;
        if (msg.new_chat_members.some(m => m.id === botUserId)) {
            const greeting = i("Operational") + "\n" + i("Awaiting instructions");
            await bot.sendMessage(msg.chat.id, greeting).catch(() => {});
        }
    });

    async function runNC(chatId) {
        forceReloadState();
        const cs = chatState[chatId];
        if (!cs?.nc?.active) return;
        const currentDelay = cs.nc.currentDelay || chatState.delay.nc || 100;
        try {
            await rateLimitedRequest(botIndex, async () => {
                const emoji = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
                const text = cs.nc.texts[Math.floor(Math.random() * cs.nc.texts.length)];
                return await bot.setChatTitle(chatId, `${emoji} ${text} ${emoji}`);
            });
            const newDelay = Math.max(50, currentDelay - 10);
            cs.nc.currentDelay = newDelay;
            saveStateAndSync();
            setTimeout(() => runNC(chatId), newDelay);
        } catch (e) {
            if (e.response?.statusCode === 429) {
                const retryAfter = (e.response.body?.parameters?.retry_after || 3) * 1000;
                cs.nc.currentDelay = Math.min(5000, currentDelay + 200);
                saveStateAndSync();
                setTimeout(() => runNC(chatId), retryAfter);
            } else setTimeout(() => runNC(chatId), 500);
        }
    }
    async function runDescNC(chatId) {
        forceReloadState();
        const cs = chatState[chatId];
        if (!cs?.desnc?.active) return;
        const currentDelay = cs.desnc?.currentDelay || chatState.delay.desnc || 100;
        try {
            await rateLimitedRequest(botIndex, async () => {
                const emoji = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
                const text = cs.desnc.texts[Math.floor(Math.random() * cs.desnc.texts.length)];
                return await bot.setChatDescription(chatId, `${emoji} ${text} ${emoji}`);
            });
            const newDelay = Math.max(50, currentDelay - 10);
            if (!cs.desnc) cs.desnc = {};
            cs.desnc.currentDelay = newDelay;
            saveStateAndSync();
            setTimeout(() => runDescNC(chatId), newDelay);
        } catch (e) {
            if (e.response?.statusCode === 429) {
                const retryAfter = (e.response.body?.parameters?.retry_after || 3) * 1000;
                if (!cs.desnc) cs.desnc = {};
                cs.desnc.currentDelay = Math.min(5000, currentDelay + 200);
                saveStateAndSync();
                setTimeout(() => runDescNC(chatId), retryAfter);
            } else setTimeout(() => runDescNC(chatId), 500);
        }
    }
    async function runPFP(chatId, fileId) {
        forceReloadState();
        if (!chatState[chatId]?.pfp?.active) return;
        try {
            const fileStream = await bot.getFileStream(fileId);
            await rateLimitedRequest(botIndex, () => bot.setChatPhoto(chatId, fileStream));
        } catch (e) {
            if (e.response?.statusCode === 429) { setTimeout(() => runPFP(chatId, fileId), 5000); return; }
        }
        setTimeout(() => runPFP(chatId, fileId), chatState.delay.pfp || 3000);
    }
    async function runSpam(chatId) {
        forceReloadState();
        const spamState = chatState[chatId]?.spam;
        if (!spamState?.active) return;
        try {
            const sentMsg = await rateLimitedRequest(botIndex, () => bot.sendMessage(chatId, spamState.text));
            if (sentMsg && sentMsg.message_id && chatState.autopin[chatId]) {
                bot.pinChatMessage(chatId, sentMsg.message_id, { disable_notification: false }).catch(() => {});
            }
        } catch (e) {}
        setTimeout(() => runSpam(chatId), chatState.delay.spam || 1500);
    }
    async function runAspam(chatId) {
        forceReloadState();
        const as = chatState[chatId]?.aspam;
        if (!as || !as.active) return;
        const line = as.texts[as.index % as.texts.length];
        try {
            const sentMsg = await safeSendMessage(bot, chatId, line);
            if (sentMsg && sentMsg.message_id && chatState.autopin[chatId]) {
                bot.pinChatMessage(chatId, sentMsg.message_id, { disable_notification: false }).catch(() => {});
            }
        } catch (e) {}
        as.index = (as.index + 1) % as.texts.length;
        setTimeout(() => runAspam(chatId), chatState.delay.aspam || 1500);
    }
    async function runRaid(chatId) {
        forceReloadState();
        const raidState = ensureRaid(chatId);
        if (!raidState.active) return;
        const line = raidState.texts[raidState.index % raidState.texts.length];
        const targetId = raidState.targetId;
        try {
            let mentionText = `[${targetId}](tg://user?id=${targetId})`;
            try {
                const chat = await bot.getChat(targetId);
                if (chat.username) mentionText = `@${chat.username}`;
                else if (chat.first_name) mentionText = `[${chat.first_name}](tg://user?id=${targetId})`;
            } catch (e) {}
            let message = line.replace(/\(target\)/gi, mentionText);
            await safeSendMessage(bot, chatId, message, null, { parse_mode: "Markdown" });
        } catch (e) {}
        raidState.index = (raidState.index + 1) % raidState.texts.length;
        saveStateAndSync();
        setTimeout(() => runRaid(chatId), chatState.delay.raid || 2000);
    }
    async function runSlide(chatId) {
        forceReloadState();
        const cs = chatState[chatId];
        if (!cs?.slide?.active) return;
        try {
            if (cs.slide.targetId && cs.slide.texts?.length > 0) {
                for (let idx = 0; idx < cs.slide.texts.length; idx++) {
                    setTimeout(() => { bot.sendMessage(chatId, cs.slide.texts[idx], { reply_to_message_id: cs.slide.replyToMsgId }).catch(() => {}); }, idx * 100);
                }
            }
        } catch (e) {}
        setTimeout(() => runSlide(chatId), chatState.delay.slide || 300);
    }
    async function runVN(chatId) {
        forceReloadState();
        const cs = chatState[chatId];
        if (!cs?.vn?.active) return;
        try {
            const vnPath = path.join(__dirname, `vn_${botIndex}_${Date.now()}.mp3`);
            await new Promise((resolve, reject) => { new gTTS(cs.vn.text, 'hi').save(vnPath, (err) => { if (err) reject(err); else resolve(); }); });
            await bot.sendVoice(chatId, vnPath, { reply_to_message_id: cs.vn.replyToMsgId }).catch(() => {});
            await bot.sendMessage(chatId, cs.vn.text, { reply_to_message_id: cs.vn.replyToMsgId }).catch(() => {});
            try { fs.unlinkSync(vnPath); } catch (e) {}
        } catch (e) {}
        setTimeout(() => runVN(chatId), chatState.delay.vn || 3500);
    }
    async function runPhotoSpam(chatId) {
        forceReloadState();
        const ps = chatState.photospam[chatId];
        if (!ps?.active) return;
        try { await bot.sendPhoto(chatId, ps.photoFileId).catch(() => {}); } catch (e) {}
        setTimeout(() => runPhotoSpam(chatId), chatState.delay.photospam || 2000);
    }

    bot.on("message", async (msg) => {
        if (!msg || !msg.chat) return;
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const fromId = msg.from ? Number(msg.from.id) : null;
        const messageId = msg.message_id;

        forceReloadState();
        const mutedList = ensureList(chatId, 'muted');
        if (fromId && mutedList.includes(fromId)) {
            try {
                if (mutedList._canDeleteChecked === undefined) {
                    const me = await bot.getMe();
                    const member = await bot.getChatMember(chatId, me.id);
                    mutedList._canDelete = member.status === 'administrator' && member.can_delete_messages;
                    mutedList._canDeleteChecked = true;
                }
                if (mutedList._canDelete) await bot.deleteMessage(chatId, messageId);
            } catch (e) { try { await bot.deleteMessage(chatId, messageId); } catch (e2) {} }
            return;
        }

        const reactState = ensureReactions(chatId);
        if (reactState.reactall && reactState.reactall.active) {
            const emoji = reactState.reactall.emoji || "🔥";
            if (fromId !== (await bot.getMe()).id && !text.startsWith("!")) {
                try { await bot.setMessageReaction(chatId, messageId, { reaction: [{ type: "emoji", emoji: emoji }] }).catch(() => {}); } catch (e) {}
            }
        }
        if (reactState.react && reactState.react.active) {
            const targetId = reactState.react.targetId;
            const emoji = reactState.react.emoji || "🔥";
            if (fromId === targetId && !text.startsWith("!")) {
                try { await bot.setMessageReaction(chatId, messageId, { reaction: [{ type: "emoji", emoji: emoji }] }).catch(() => {}); } catch (e) {}
            }
        }

        const prChat = ensurePhotoReply(chatId);
        const randomPhoto = getRandomReloadPhoto(chatId);
        if (fromId && randomPhoto) {
            if (prChat[fromId] && prChat[fromId].active) {
                const caption = prChat[fromId].caption || "";
                bot.sendPhoto(chatId, randomPhoto.fileId, { caption: caption, reply_to_message_id: messageId }).catch(() => {});
            }
        }

        const replyObj = ensureReplies(chatId);
        if (fromId && replyObj[fromId]) {
            bot.sendMessage(chatId, replyObj[fromId], { reply_to_message_id: messageId }).catch(() => {});
            return;
        }

        const targetList = ensureList(chatId, 'targets');
        if (targetList.includes(fromId)) {
            loadTargetTexts();
            const replyId = msg.message_id;
            TARGET_TEXTS.forEach((t, idx) => {
                setTimeout(() => { bot.sendMessage(chatId, t, { reply_to_message_id: replyId }).catch(() => {}); }, idx * 200);
            });
        }

        if (text.startsWith("!")) {
            const args = text.trim().split(/\s+/);
            const cmd = args.shift().toLowerCase();

            if (cmd !== "!sudo" && cmd !== "!rmsudo" && !isAdmin(fromId)) {
                safeSendMessage(bot, chatId, i("Insufficient privileges"));
                return;
            }

            forceReloadState();
            if (!chatState[chatId]) chatState[chatId] = {};
            ensureList(chatId, 'muted');
            ensureList(chatId, 'targets');
            ensurePhotoReply(chatId);
            ensurePhotoSpam(chatId);
            ensureReplies(chatId);
            ensureReactions(chatId);
            ensureRaid(chatId);
            if (!chatState.photoreload[chatId]) chatState.photoreload[chatId] = [];

            let responseText = null;
            let sentMessage = null;

            switch (cmd) {
                case "!help":
                    responseText =
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${i("Author")}: ${b("Sahil")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${b("Targeting")}
  ❧ ${b("!target")}        » ${i("designate")}
  ❧ ${b("!rmtarget")}      » ${i("exempt")}
  ❧ ${b("!reply")} <text>  » ${i("intercept")}
  ❧ ${b("!dreply")}        » ${i("clear intercept")}

${b("Speed Control")}
  ❧ ${b("!speed")} <cmd> <ms>  » ${i("adjust delay")}

${b("Name Alteration")}
  ❧ ${b("!nc")} <t1|t2>   » ${i("alter name")}
  ❧ ${b("!dnc")}          » ${i("halt")}
  ❧ ${b("!desnc")} <t1|t2> » ${i("alter description")}
  ❧ ${b("!desdnc")}       » ${i("halt description")}

${b("Profile Picture")}
  ❧ ${b("!pfp")} (reply)   » ${i("rotate")}
  ❧ ${b("!dpfp")}          » ${i("halt")}

${b("Message Spam")}
  ❧ ${b("!spam")} <text>   » ${i("initiate")}
  ❧ ${b("!dspam")}         » ${i("terminate")}
  ❧ ${b("!aspam")} <target>» ${i("target spam")}
  ❧ ${b("!daspam")}        » ${i("terminate target")}

${b("Retaliation")}
  ❧ ${b("!raid")} @user/id » ${i("deploy")}
  ❧ ${b("!draid")}         » ${i("withdraw")}

${b("Message Scroll")}
  ❧ ${b("!slide")} <t1|t2|t3> » ${i("scroll blast")}
  ❧ ${b("!dslide")}           » ${i("halt")}

${b("Voice Loop")}
  ❧ ${b("!vn")} <text>     » ${i("audio loop")}
  ❧ ${b("!dvn")}           » ${i("halt")}

${b("Photo Arsenal")}
  ❧ ${b("!photoreload")} <1-5> » ${i("store photo")}
  ❧ ${b("!resetphoto")}        » ${i("clear arsenal")}
  ❧ ${b("!photoreply")} <caption> » ${i("auto reply")}
  ❧ ${b("!dphotoreply")}       » ${i("halt")}
  ❧ ${b("!photospam")}         » ${i("photo spam")}
  ❧ ${b("!dphotospam")}        » ${i("halt")}

${b("Silencing")}
  ❧ ${b("!mute")} (reply/id)   » ${i("suppress")}
  ❧ ${b("!unmute")} (reply/id) » ${i("restore")}
  ❧ ${b("!mutelist")}          » ${i("list suppressed")}

${b("Privileges")}
  ❧ ${b("!sudo")} <id>     » ${i("elevate")}
  ❧ ${b("!rmsudo")} <id>   » ${i("depose")}
  ❧ ${b("!on")}            » ${i("ping")}
  ❧ ${b("!status")}        » ${i("panel")}

${b("Auto-Pin")}
  ❧ ${b("!autopin")}   » ${i("engage")}
  ❧ ${b("!dautopin")}  » ${i("disengage")}

${b("Reactions")}
  ❧ ${b("!reactall")} <emoji> » ${i("react to all")}
  ❧ ${b("!react")} <emoji>    » ${i("react to target")}
  ❧ ${b("!stopreact")}        » ${i("halt all")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${i("Author")}: ${b("Sahil")}  |  ${i("Build")}: ${b("V6")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                    break;

                case "!status": {
                    forceReloadState();
                    const csStat = chatState[chatId] || {};
                    const raidStat = ensureRaid(chatId);
                    const psStat = ensurePhotoSpam(chatId);
                    const photosStat = getReloadPhotos(chatId).filter(p => p !== null).length;
                    const targetsStat = (chatState.targets[chatId] || []).length;
                    const mutedStat = (chatState.muted[chatId] || []).length;
                    const adminsStat = chatState.admins.length;
                    const onOff = (v) => v ? b("ON") : i("OFF");
                    const activeChats = getActiveChats();

                    let chatListStr = "";
                    if (activeChats.length === 0) chatListStr = "  ❧ " + i("none") + "\n";
                    else {
                        for (const cid of activeChats.slice(0, 10)) {
                            const mCount = countActiveModules(cid);
                            chatListStr += `  ❧ ${toMono(cid)} : ${toMono(mCount)} ${i("modules")}\n`;
                        }
                        if (activeChats.length > 10) chatListStr += `  ❧ ${i("and")} ${toMono(activeChats.length - 10)} ${i("more")}\n`;
                    }

                    responseText =
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${i("System Status")}  |  ${b("Sahil")}  |  ${i("V6")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${b("System")}
  ❧ ${i("Uptime")}          : ${toMono(getUptime())}
  ❧ ${i("Bots Loaded")}     : ${toMono(BOT_TOKENS.length)}
  ❧ ${i("Bots Connected")}  : ${toMono(connectedBots.size)}
  ❧ ${i("Active Chats")}    : ${toMono(activeChats.length)}
  ❧ ${i("Active Modules")}  : ${toMono(countActiveModules(chatId))}

${b("Active Chats")}
${chatListStr}
${b("Modules (This Chat)")}
  ❧ ${i("Name Alteration")}     : ${onOff(csStat.nc?.active)}
  ❧ ${i("Description Warp")}    : ${onOff(csStat.desnc?.active)}
  ❧ ${i("Profile Rotation")}    : ${onOff(csStat.pfp?.active)}
  ❧ ${i("Message Spam")}        : ${onOff(csStat.spam?.active)}
  ❧ ${i("Target Spam")}         : ${onOff(csStat.aspam?.active)}
  ❧ ${i("Retaliation")}         : ${onOff(raidStat.active)}
  ❧ ${i("Message Scroll")}      : ${onOff(csStat.slide?.active)}
  ❧ ${i("Voice Loop")}          : ${onOff(csStat.vn?.active)}
  ❧ ${i("Photo Spam")}          : ${onOff(psStat.active)}
  ❧ ${i("Auto-Pin")}            : ${onOff(chatState.autopin[chatId])}
  ❧ ${i("React All")}           : ${onOff(chatState.reactions[chatId]?.reactall?.active)}
  ❧ ${i("React Target")}        : ${onOff(chatState.reactions[chatId]?.react?.active)}

${b("Configuration")}
  ❧ ${i("Targets")}             : ${toMono(targetsStat)}
  ❧ ${i("Suppressed")}          : ${toMono(mutedStat)}
  ❧ ${i("Photo Slots")}         : ${toMono(photosStat + "/5")}
  ❧ ${i("Admins")}              : ${toMono(adminsStat)}

${b("Delays (ms)")}
  ❧ ${i("NC")} : ${toMono(chatState.delay.nc)}    ❧ ${i("Desc")} : ${toMono(chatState.delay.desnc)}
  ❧ ${i("Spam")} : ${toMono(chatState.delay.spam)}  ❧ ${i("Raid")} : ${toMono(chatState.delay.raid)}
  ❧ ${i("VN")} : ${toMono(chatState.delay.vn)}    ❧ ${i("Photo")} : ${toMono(chatState.delay.photospam)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${i("Author")}: ${b("Sahil")}  |  ${i("Build")}: ${b("V6")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
                    break;
                }

                case "!reactall":
                    if (args.length === 0) { responseText = i("Usage") + ": " + b("!reactall") + " <" + i("emoji") + ">"; break; }
                    const reactAllEmoji = args[0];
                    if (!reactAllEmoji.match(/[\u{1F600}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1FB00}-\u{1FBFF}]|[\u{1FC00}-\u{1FCFF}]|[\u{1FD00}-\u{1FDFF}]|[\u{1FE00}-\u{1FEFF}]|[\u{1FF00}-\u{1FFFF}]/u)) { responseText = i("Invalid reaction"); break; }
                    chatState.reactions[chatId].reactall = { active: true, emoji: reactAllEmoji };
                    if (chatState.reactions[chatId].react) chatState.reactions[chatId].react.active = false;
                    saveStateAndSync();
                    responseText = i("Reaction engaged") + "\n" + i("Emoji") + ": " + reactAllEmoji;
                    break;

                case "!react":
                    if (!msg.reply_to_message || args.length === 0) { responseText = i("Reply with an emoji"); break; }
                    const reactEmoji = args[0];
                    if (!reactEmoji.match(/[\u{1F600}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1FB00}-\u{1FBFF}]|[\u{1FC00}-\u{1FCFF}]|[\u{1FD00}-\u{1FDFF}]|[\u{1FE00}-\u{1FEFF}]|[\u{1FF00}-\u{1FFFF}]/u)) { responseText = i("Invalid reaction"); break; }
                    const targetUserId = Number(msg.reply_to_message.from.id);
                    chatState.reactions[chatId].react = { active: true, targetId: targetUserId, emoji: reactEmoji };
                    if (chatState.reactions[chatId].reactall) chatState.reactions[chatId].reactall.active = false;
                    saveStateAndSync();
                    responseText = i("Reaction locked") + "\n" + i("Target") + ": " + toMono(targetUserId) + "\n" + i("Emoji") + ": " + reactEmoji;
                    break;

                case "!stopreact":
                    forceReloadState();
                    const rsStop = ensureReactions(chatId);
                    let stopped = false;
                    if (rsStop.reactall && rsStop.reactall.active) { rsStop.reactall.active = false; stopped = true; }
                    if (rsStop.react && rsStop.react.active) { rsStop.react.active = false; stopped = true; }
                    saveStateAndSync();
                    responseText = stopped ? i("Reaction halted") : i("No active reaction");
                    break;

                case "!autopin":
                    chatState.autopin[chatId] = true;
                    saveStateAndSync();
                    responseText = i("Pinning engaged");
                    break;

                case "!dautopin":
                    chatState.autopin[chatId] = false;
                    saveStateAndSync();
                    responseText = i("Pinning disengaged");
                    break;

                case "!raid":
                    forceReloadState();
                    if (args.length === 0 && !msg.reply_to_message) { responseText = i("Provide target or reply"); break; }
                    let raidTargetId = null;
                    if (msg.reply_to_message) { raidTargetId = Number(msg.reply_to_message.from.id); }
                    else {
                        const targetInput = args[0];
                        if (targetInput.startsWith('@')) {
                            try { const chat = await bot.getChat(targetInput); raidTargetId = chat.id; }
                            catch (e) { responseText = i("Invalid username"); break; }
                        } else if (/^-?\d+$/.test(targetInput)) { raidTargetId = Number(targetInput); }
                        else { responseText = i("Use @username or user id"); break; }
                    }
                    if (!raidTargetId) { responseText = i("No valid target"); break; }
                    const rawRaidLines = loadRaidTexts();
                    if (rawRaidLines.length === 0) { responseText = i("raid.txt empty or missing"); break; }
                    let targetMention = `[${raidTargetId}](tg://user?id=${raidTargetId})`;
                    try {
                        const chat = await bot.getChat(raidTargetId);
                        if (chat.username) targetMention = `@${chat.username}`;
                        else if (chat.first_name) targetMention = `[${chat.first_name}](tg://user?id=${raidTargetId})`;
                    } catch (e) {}
                    const raidState = ensureRaid(chatId);
                    raidState.active = true;
                    raidState.targetId = raidTargetId;
                    raidState.texts = rawRaidLines;
                    raidState.index = 0;
                    saveStateAndSync();
                    responseText = i("Retaliation deployed") + "\n" + i("Target") + ": " + targetMention + "\n" + i("Scrolls") + ": " + toMono(rawRaidLines.length);
                    sentMessage = await safeSendMessage(bot, chatId, responseText, msg, { parse_mode: "Markdown" });
                    runRaid(chatId);
                    responseText = null;
                    break;

                case "!draid":
                    forceReloadState();
                    const raidStop = ensureRaid(chatId);
                    if (raidStop.active) { raidStop.active = false; saveStateAndSync(); responseText = i("Retaliation withdrawn"); }
                    else responseText = i("No active retaliation");
                    break;

                case "!reply":
                    if (!msg.reply_to_message) { responseText = i("Reply to a user"); break; }
                    const replyText = args.join(" ");
                    if (!replyText) { responseText = i("Provide text"); break; }
                    const echoTarget = Number(msg.reply_to_message.from.id);
                    ensureReplies(chatId)[echoTarget] = replyText;
                    saveStateAndSync();
                    responseText = i("Interception set") + "\n" + i("Target") + ": " + toMono(echoTarget);
                    break;

                case "!dreply":
                    if (!msg.reply_to_message) { responseText = i("Reply to the user"); break; }
                    const removeEchoTarget = Number(msg.reply_to_message.from.id);
                    const echoObj = ensureReplies(chatId);
                    if (echoObj[removeEchoTarget]) { delete echoObj[removeEchoTarget]; saveStateAndSync(); responseText = i("Interception cleared") + "\n" + i("Target") + ": " + toMono(removeEchoTarget); }
                    else responseText = i("No active interception");
                    break;

                case "!aspam":
                    if (args.length === 0) { responseText = i("Provide target word"); break; }
                    const targetWord = args.join(" ");
                    const rawLines = loadAspamTexts();
                    if (rawLines.length === 0) { responseText = i("aspam.txt empty or missing"); break; }
                    const processedLines = rawLines.map(line => line.replace(/\(target\)/gi, targetWord));
                    chatState[chatId].aspam = { active: true, texts: processedLines, index: 0 };
                    saveStateAndSync();
                    runAspam(chatId);
                    responseText = i("Target spam activated") + "\n" + i("Target") + ": " + targetWord;
                    sentMessage = await safeSendMessage(bot, chatId, responseText, msg);
                    if (sentMessage && sentMessage.message_id && chatState.autopin[chatId]) bot.pinChatMessage(chatId, sentMessage.message_id, { disable_notification: false }).catch(() => {});
                    responseText = null;
                    break;

                case "!daspam":
                    forceReloadState();
                    if (chatState[chatId].aspam) { chatState[chatId].aspam.active = false; saveStateAndSync(); responseText = i("Target spam sealed"); }
                    else responseText = i("No active target spam");
                    break;

                case "!desnc":
                    const descTexts = args.join(" ").split("|").filter(t => t.trim());
                    if (descTexts.length === 0) { responseText = i("Provide texts separated by |"); break; }
                    chatState[chatId].desnc = { active: true, texts: descTexts };
                    saveStateAndSync();
                    runDescNC(chatId);
                    responseText = i("Alteration engaged");
                    break;

                case "!desdnc":
                    forceReloadState();
                    if (chatState[chatId].desnc) { chatState[chatId].desnc.active = false; saveStateAndSync(); responseText = i("Alteration halted"); }
                    else responseText = i("No active alteration");
                    break;

                case "!spam":
                    chatState[chatId].spam = { active: true, text: args.join(" ") };
                    saveStateAndSync();
                    runSpam(chatId);
                    responseText = i("Initiated");
                    sentMessage = await safeSendMessage(bot, chatId, responseText, msg);
                    if (sentMessage && sentMessage.message_id && chatState.autopin[chatId]) bot.pinChatMessage(chatId, sentMessage.message_id, { disable_notification: false }).catch(() => {});
                    responseText = null;
                    break;

                case "!photoreload":
                    if (args.length === 0) { responseText = i("Usage") + ": " + b("!photoreload") + " <1-5>"; break; }
                    const slotNum = parseInt(args[0]);
                    if (isNaN(slotNum) || slotNum < 1 || slotNum > 5) { responseText = i("Invalid slot, use 1-5"); break; }
                    if (!msg.reply_to_message || !msg.reply_to_message.photo) { responseText = i("Reply to a photo"); break; }
                    const photoIndex = slotNum - 1;
                    const photos = getReloadPhotos(chatId);
                    const fileId = msg.reply_to_message.photo.pop().file_id;
                    while (photos.length <= photoIndex) photos.push(null);
                    photos[photoIndex] = { fileId: fileId, index: slotNum };
                    chatState.photoreload[chatId] = photos;
                    saveStateAndSync();
                    const validCount = photos.filter(p => p !== null).length;
                    responseText = i("Arsenal loaded") + "\n" + i("Slot") + ": " + toMono(slotNum) + "\n" + i("Ready") + ": " + toMono(validCount + "/5");
                    break;

                case "!resetphoto":
                    chatState.photoreload[chatId] = [];
                    saveStateAndSync();
                    responseText = i("Arsenal cleared");
                    break;

                case "!photoreply":
                    if (!msg.reply_to_message) { responseText = i("Reply to a user"); break; }
                    const photosList = getReloadPhotos(chatId);
                    if (photosList.filter(p => p !== null).length === 0) { responseText = i("No reloaded photos"); break; }
                    const targetUser = Number(msg.reply_to_message.from.id);
                    const captionText = args.join(" ") || "";
                    ensurePhotoReply(chatId)[targetUser] = { active: true, caption: captionText };
                    saveStateAndSync();
                    responseText = i("Photo retaliation") + "\n" + i("Target") + ": " + toMono(targetUser);
                    break;

                case "!dphotoreply":
                    if (!msg.reply_to_message) { responseText = i("Reply to a user"); break; }
                    const stopUser = Number(msg.reply_to_message.from.id);
                    const pr2 = ensurePhotoReply(chatId);
                    if (pr2[stopUser]) { delete pr2[stopUser]; saveStateAndSync(); responseText = i("Retaliation ceased"); }
                    else responseText = i("No active photo reply");
                    break;

                case "!photospam":
                    if (!msg.reply_to_message || !msg.reply_to_message.photo) { responseText = i("Reply to a photo"); break; }
                    const spamPhotoId = msg.reply_to_message.photo.pop().file_id;
                    ensurePhotoSpam(chatId);
                    chatState.photospam[chatId] = { active: true, photoFileId: spamPhotoId };
                    saveStateAndSync();
                    runPhotoSpam(chatId);
                    responseText = i("Photo spam activated");
                    break;

                case "!dphotospam":
                    forceReloadState();
                    const ps = ensurePhotoSpam(chatId);
                    if (ps.active) { ps.active = false; saveStateAndSync(); responseText = i("Photo spam ceased"); }
                    else responseText = i("No active photo spam");
                    break;

                case "!mute":
                    let muteId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!muteId || isNaN(muteId)) { responseText = i("Reply or provide id"); break; }
                    if (chatState.admins.includes(muteId)) { responseText = i("Cannot mute the owner"); break; }
                    const muteList = ensureList(chatId, 'muted');
                    if (!muteList.includes(muteId)) { muteList.push(muteId); saveStateAndSync(); }
                    responseText = i("Suppressed") + "\n" + i("Target") + ": " + toMono(muteId);
                    break;

                case "!unmute":
                    let unmuteId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!unmuteId || isNaN(unmuteId)) { responseText = i("Reply or provide id"); break; }
                    const unmuteList = ensureList(chatId, 'muted');
                    if (unmuteList.includes(unmuteId)) { chatState.muted[chatId] = unmuteList.filter(id => id !== unmuteId); saveStateAndSync(); responseText = i("Restored") + "\n" + i("Target") + ": " + toMono(unmuteId); }
                    else responseText = i("Not suppressed");
                    break;

                case "!mutelist":
                    forceReloadState();
                    const ml = ensureList(chatId, 'muted');
                    if (ml.length === 0) responseText = i("No one suppressed");
                    else {
                        let list = i("Suppressed list") + "\n" + i("Total") + ": " + toMono(ml.length) + "\n";
                        ml.forEach((id, idx) => { list += toMono(idx + 1) + ". " + toMono(id) + "\n"; });
                        responseText = list;
                    }
                    break;

                case "!sudo":
                    if (!isAdmin(fromId)) { responseText = i("Insufficient privileges"); break; }
                    let newAdminId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!newAdminId || isNaN(newAdminId)) { responseText = i("Reply or provide id"); break; }
                    if (!chatState.admins.includes(newAdminId)) { chatState.admins.push(newAdminId); saveStateAndSync(); }
                    responseText = i("Elevated") + "\n" + i("Target") + ": " + toMono(newAdminId);
                    break;

                case "!rmsudo":
                    if (!isAdmin(fromId)) { responseText = i("Insufficient privileges"); break; }
                    let removeAdminId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!removeAdminId || isNaN(removeAdminId)) { responseText = i("Reply or provide id"); break; }
                    if (envAdmins.includes(removeAdminId)) { responseText = i("Cannot remove owner"); break; }
                    if (chatState.admins.includes(removeAdminId)) { chatState.admins = chatState.admins.filter(id => id !== removeAdminId); saveStateAndSync(); }
                    responseText = i("Deposed") + "\n" + i("Target") + ": " + toMono(removeAdminId);
                    break;

                case "!slide":
                    if (!msg.reply_to_message) { responseText = i("Reply to a user"); break; }
                    const slideTexts = args.join(" ").split("|").filter(t => t.trim());
                    if (slideTexts.length === 0) { responseText = i("Provide texts separated by |"); break; }
                    chatState[chatId].slide = { active: true, targetId: Number(msg.reply_to_message.from.id), replyToMsgId: msg.reply_to_message.message_id, texts: slideTexts };
                    saveStateAndSync();
                    runSlide(chatId);
                    responseText = i("Infinite scroll") + "\n" + i("Target") + ": " + toMono(msg.reply_to_message.from.id) + "\n" + i("Slides") + ": " + toMono(slideTexts.length);
                    break;

                case "!dslide":
                    forceReloadState();
                    if (chatState[chatId].slide) chatState[chatId].slide.active = false;
                    saveStateAndSync();
                    responseText = i("Scroll frozen");
                    break;

                case "!vn":
                    if (!msg.reply_to_message) { responseText = i("Reply to a message"); break; }
                    if (args.join(" ").length === 0) { responseText = i("Provide text"); break; }
                    const vnText = args.join(" ");
                    chatState[chatId].vn = { active: true, text: vnText, replyToMsgId: msg.reply_to_message.message_id, targetId: Number(msg.reply_to_message.from.id) };
                    saveStateAndSync();
                    runVN(chatId);
                    responseText = i("Audio loop engaged") + "\n" + i("Target") + ": " + toMono(msg.reply_to_message.from.id);
                    break;

                case "!dvn":
                    forceReloadState();
                    if (chatState[chatId].vn) chatState[chatId].vn.active = false;
                    saveStateAndSync();
                    responseText = i("Audio loop halted");
                    break;

                case "!speed":
                    if (args.length < 2) { responseText = i("Usage") + ": " + b("!speed") + " <" + i("cmd") + "> <" + i("ms") + ">"; break; }
                    const type = args[0].toLowerCase(); let ms = parseInt(args[1]);
                    if (type === 'nc' && ms < 50) ms = 50;
                    if (type === 'desnc' && ms < 50) ms = 50;
                    if (type === 'photospam' && ms < 500) ms = 500;
                    if (type === 'aspam' && ms < 500) ms = 500;
                    if (type === 'raid' && ms < 1000) ms = 1000;
                    if (chatState.delay.hasOwnProperty(type)) {
                        chatState.delay[type] = ms;
                        saveStateAndSync();
                        responseText = i("Speed adjusted") + "\n" + toBold(type.toUpperCase()) + " → " + toMono(ms + "ms");
                    }
                    break;

                case "!nc":
                    chatState[chatId].nc = { active: true, texts: args.join(" ").split("|") };
                    if (!chatState[chatId].nc.currentDelay) chatState[chatId].nc.currentDelay = chatState.delay.nc || 100;
                    saveStateAndSync();
                    runNC(chatId);
                    responseText = i("Alteration engaged");
                    break;

                case "!dnc":
                    forceReloadState();
                    if (chatState[chatId].nc) chatState[chatId].nc.active = false;
                    saveStateAndSync();
                    responseText = i("Alteration halted");
                    break;

                case "!pfp":
                    if (!msg.reply_to_message?.photo) { responseText = i("Reply to a photo"); break; }
                    chatState[chatId].pfp = { active: true };
                    saveStateAndSync();
                    runPFP(chatId, msg.reply_to_message.photo.pop().file_id);
                    responseText = i("Rotation engaged");
                    break;

                case "!dpfp":
                    forceReloadState();
                    if (chatState[chatId].pfp) chatState[chatId].pfp.active = false;
                    saveStateAndSync();
                    responseText = i("Rotation halted");
                    break;

                case "!dspam":
                    forceReloadState();
                    if (chatState[chatId].spam) chatState[chatId].spam.active = false;
                    saveStateAndSync();
                    responseText = i("Terminated");
                    break;

                case "!target":
                    let tId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!tId) break;
                    if (!chatState.targets[chatId]) chatState.targets[chatId] = [];
                    chatState.targets[chatId].push(tId);
                    saveStateAndSync();
                    responseText = i("Designated");
                    break;

                case "!rmtarget":
                    let rmId = msg.reply_to_message ? Number(msg.reply_to_message.from.id) : Number(args[0]);
                    if (!rmId) break;
                    const trList = ensureList(chatId, 'targets');
                    const oldLen = trList.length;
                    chatState.targets[chatId] = trList.filter(id => id != rmId);
                    if (chatState.targets[chatId].length < oldLen) { saveStateAndSync(); responseText = i("Exempted"); }
                    else responseText = i("Not in target list");
                    break;

                case "!on":
                    responseText = i("Operational") + "\n" + i("Awaiting instructions");
                    break;

                default: break;
            }
            if (responseText) safeSendMessage(bot, chatId, responseText, msg);
        }
    });

    bot.on("new_chat_title", async (msg) => {
        const fromId = msg.from ? Number(msg.from.id) : null;
        const chatId = msg.chat.id;
        forceReloadState();
        const mutedList = ensureList(chatId, 'muted');
        if (fromId && mutedList.includes(fromId)) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    });
    bot.on("new_chat_photo", async (msg) => {
        const fromId = msg.from ? Number(msg.from.id) : null;
        const chatId = msg.chat.id;
        forceReloadState();
        const mutedList = ensureList(chatId, 'muted');
        if (fromId && mutedList.includes(fromId)) {
            bot.deleteMessage(chatId, msg.message_id).catch(() => {});
            const me = await bot.getMe().catch(() => {});
            if (me && fromId !== me.id) bot.deleteChatPhoto(chatId).catch(() => {});
        }
    });
    bot.on("delete_chat_photo", async (msg) => {
        const fromId = msg.from ? Number(msg.from.id) : null;
        const chatId = msg.chat.id;
        forceReloadState();
        const mutedList = ensureList(chatId, 'muted');
        if (fromId && mutedList.includes(fromId)) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    });
}

console.log("System ready — Author: Sahil");
