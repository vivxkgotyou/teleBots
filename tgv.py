import os
import sys
import time
import json
import random
import logging
import threading
import requests
import telebot
from datetime import datetime
import pytz
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from flask import Flask, render_template_string
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("VivekEngine")

START_TIME = time.time()

# ==========================================
# 🔗 DYNAMIC WEB CONTROL URL STORAGE
# ==========================================
DATA_FILE = "bot_settings.json"
DEFAULT_URL = os.environ.get("RENDER_EXTERNAL_URL", "https://my-bot-zlmx.onrender.com/")

def load_web_url():
    """Reads saved URL from JSON file, falls back to ENV or Default."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                return data.get("web_url", DEFAULT_URL)
        except Exception as e:
            logger.error(f"Error reading {DATA_FILE}: {e}")
    return DEFAULT_URL

def save_web_url(url: str):
    """Saves updated URL into JSON file so it persists after restart."""
    try:
        with open(DATA_FILE, "w") as f:
            json.dump({"web_url": url}, f)
        logger.info(f"Updated RENDER_WEB_URL to: {url}")
    except Exception as e:
        logger.error(f"Error saving URL to {DATA_FILE}: {e}")

RENDER_WEB_URL = load_web_url()

# Dynamic Prefix (Global Variable)
PREFIX = "v"

# ==========================================
# ⚙ GLOBAL STATE TRACKERS
# ==========================================
ACTIVE_HUNTS = {}
ACTIVE_SPAM = {}
ACTIVE_NC = {}       # {chat_id: True/False}
ACTIVE_SLIDE = {}    # {chat_id: True/False} Swipe reply tracker
ACTIVE_AUTOREPLY = {}
ACTIVE_MUTED_USERS = {}  # {chat_id: {user_id: expiry_timestamp}}

# Dynamic Chat Tracker
KNOWN_CHATS = {}  # {chat_id: {'title': name, 'type': chat_type}}

SPAM_DELAY = 1.5
NC_DELAY = 0.5      # Superfast Default (500ms)
SLIDE_DELAY = 0.5   # Rapid Swipe Reply Delay (500ms)
AUTOREPLY_DELAY = 2.0
AUTOREPLY_MSG = None
TARGET_GCS = set()
TARGET_USERS = set()

# ==========================================
# 🔑 FLEXIBLE ENVIRONMENT CONFIGURATION
# ==========================================
BOT_TOKENS = []
BOT_INSTANCES = []

single_token = os.environ.get("BOT_TOKEN", "").strip()
if single_token:
    BOT_TOKENS.append(single_token)

i = 1
while True:
    tok = os.environ.get(f"BOT_TOKEN_{i}", "").strip()
    if not tok:
        break
    if tok not in BOT_TOKENS:
        BOT_TOKENS.append(tok)
    i += 1

if not BOT_TOKENS:
    logger.error("❌ No BOT_TOKEN found in Environment Variables!")

for token in BOT_TOKENS:
    try:
        instance = telebot.TeleBot(token, parse_mode="HTML")
        BOT_INSTANCES.append(instance)
    except Exception as e:
        logger.error(f"Failed to initialize bot instance: {e}")

OWNER_IDS_RAW = os.environ.get("OWNER_IDS", "")
OWNER_IDS = set(int(x.strip()) for x in OWNER_IDS_RAW.split(",") if x.strip().isdigit())
DYNAMIC_ADMINS = set()

def is_owner(user_id):
    if not OWNER_IDS:
        return True
    return user_id in OWNER_IDS

def is_admin(user_id):
    if not OWNER_IDS:
        return True
    return (user_id in OWNER_IDS) or (user_id in DYNAMIC_ADMINS)

def get_uptime():
    delta = int(time.time() - START_TIME)
    hours, remainder = divmod(delta, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours}h {minutes}m"

# Helper to check commands with dynamic prefix or standard slash
def check_cmd(message, cmd_name):
    if not message.text:
        return False
    text = message.text.strip().split()[0].lower()
    return text in [f"/{cmd_name}", f"{PREFIX}{cmd_name}"]

# ==========================================
# ✨ STYLISH ACKNOWLEDGEMENT TEXTS & AUTO-DELETE HELPER
# ==========================================
STYLISH_ACK_TEXTS = [
    "⚡ 𝑬𝒙𝒆𝒄𝒖𝒕𝒊𝒏𝒈 𝒀𝒐𝒖𝒓 𝑪𝒐𝒎𝒎𝒂𝒏𝒅, 𝑷𝒍𝒆𝒂𝒔𝒆 𝑾𝒂𝒊𝒕 𝑨 𝑷𝒐𝒎𝒆𝒏𝒕...",
    "🔥 𝑷𝒓𝒐𝒄𝒆𝒔𝒔𝒊𝒏𝒈 𝑹𝒆𝒒𝒖𝒆𝒔𝒕 • 𝑺𝒚𝒔𝒕𝒆𝒎 𝑰𝒔 𝑵𝒐𝒘 𝑭𝒖𝒍𝒍𝒚 𝑨𝒄𝒕𝒊𝒗𝒂𝒕𝒆𝒅!",
    "🚀 𝑨𝒄𝒕𝒊𝒐𝒏 𝑰𝒏𝒊𝒕𝒊𝒂𝒕𝒆𝒅 • 𝑷𝒍𝒆𝒂𝒔𝒆 𝑯𝒐𝒍𝒅 𝑶𝒏 𝑭𝒐𝒓 𝑨 𝑺𝒆𝒄𝒐𝒏𝒅...",
    "👑 𝑽𝒊𝒗𝒆𝒌 𝑩𝒐𝒕 𝑬𝒏𝒈𝒊𝒏𝒆 𝑰𝒔 𝑹𝒖𝒏𝒏𝒊𝒏𝒈 𝒀𝒐𝒖𝒓 𝑹𝒆𝒒𝒖𝒆𝒔𝒕 𝑵𝒐𝒘!",
    "💥 𝑪𝒐𝒎𝒎𝒂𝒏𝒅 𝑨𝒄𝒄𝒆𝒑𝒕𝒆𝒅 • 𝑺𝒕𝒂𝒓𝒕𝒊𝒏𝒈 𝑻𝒉𝒆 𝑶𝒑𝒆𝒓𝒂𝒕𝒊𝒐𝒏 𝑭𝒂𝒔𝒕 𝑨𝒏𝒅 𝑺𝒎𝒐𝒐𝒕𝒉!",
    "🎯 𝑻𝒂𝒓𝒈𝒆𝒕 𝑨𝒄𝒒𝒖𝒊𝒓𝒆𝒅 • 𝑬𝒙𝒆𝒄𝒖𝒕𝒊𝒏𝒈 𝒀𝒐𝒖𝒓 𝑫𝒆𝒔𝒊𝒓𝒆𝒅 𝑨𝒄𝒕𝒊𝒐𝒏 𝑹𝒊𝒈𝒉𝒕 𝑵𝒐𝒘!",
    "✨ 𝑨𝒖𝒕𝒐𝒎𝒂𝒕𝒊𝒐𝒏 𝑻𝒓𝒊𝒈𝒈𝒆𝒓𝒆𝒅 • 𝑷𝒍𝒆𝒂𝒔𝒆 𝑾𝒂𝒊𝒕 𝑭𝒐𝒓 𝑭𝒖𝒍𝒍 𝑬𝒙𝒆𝒄𝒖𝒕𝒊𝒐𝒏..."
]

def send_temp_ack(bot_instance, chat_id):
    text = random.choice(STYLISH_ACK_TEXTS)
    try:
        msg = bot_instance.send_message(chat_id, text)
        def delete_later():
            time.sleep(4.0)
            try:
                bot_instance.delete_message(chat_id, msg.message_id)
            except Exception as e:
                logger.error(f"Failed to auto-delete temp message: {e}")
        threading.Thread(target=delete_later, daemon=True).start()
    except Exception as e:
        logger.error(f"Failed to send temp ack: {e}")

# ==========================================
# 🎯 TRIGGER KEYWORDS & AUTO-ROASTS
# ==========================================
ABUSIVE_KEYWORDS = [
    "bhenchod", "bc", "mc", "madarchod", "chutiya", "lodu", "gand", "gaand", 
    "bhosda", "bhosdi", "laude", "lund", "randike", "chup", "ma", "kutta",
    "rndyke", "randi", "jhantu", "chod", "terigand", "bhenklode"
]

TARGET_NAMES = ["vivek", "@danggvivek", "Vivek"]

def should_trigger_roast(text):
    if not text:
        return False
    text_lower = text.lower()
    contains_name = any(name in text_lower for name in TARGET_NAMES)
    contains_abuse = any(word in text_lower for word in ABUSIVE_KEYWORDS)
    return contains_name and contains_abuse

AUTO_ROAST_RESPONSES = [
    "Abe 👂 sasta 2-rupee troll, Vivek sir ka naam lene se pehle muh saaf kar le! 💩",
    "Tu jitna marzi bhok le, Vivek sir tere baap hain aur hamesha rahenge! 🔥👑",
    "Jitna dimaag gaali dene me lagaya hai, utna padhai me lagata toh aaj majdoori na kar raha hota! 💀",
    "Aukat me reh ke baat kar, tera pura khandaan khareedne ka dum rakhte hain Vivek sir! 💸💥",
    "Beta, tere jaise 100 daily Vivek sir ke samne aake ghutne tekte hain. Nikal yahan se! ⚔️"
]

MIRZAPUR_HUNT_ROASTS = [
    "{target} Abe 👂 bhosdiwale, aukaat mein reh ke baat kar warna aisi jagah goli maarenge ki bawaseer ho jayega! 💣",
    "{target} Tumhare baap ka chota sa dhandha nahi hai jo jab man kiya chale aaye, shant baith warna gaand chod denge! 🔥",
    "{target} jada gand na fulao yahi ma chod denge tumhari ",
    "{target} Bhosdi ke, zyada bologe toh chhati me itna hole karenge ki confuse ho jaoge ki saas kahan se lein! 🎯"
]

# ==========================================
# 🌐 HIGH-TECH FUTURISTIC FLASK DASHBOARD
# ==========================================
web_app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ VIVEK BOTS ENGINE ⚡</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #030308;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow-x: hidden;
            padding: 20px;
        }

        body::before {
            content: '';
            position: absolute;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(0, 255, 136, 0.25), transparent 70%);
            top: 10%;
            left: 15%;
            filter: blur(50px);
            z-index: -1;
        }

        body::after {
            content: '';
            position: absolute;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(0, 242, 254, 0.25), transparent 70%);
            bottom: 10%;
            right: 15%;
            filter: blur(50px);
            z-index: -1;
        }

        .main-card {
            width: 100%;
            max-width: 750px;
            background: rgba(10, 10, 22, 0.85);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 255, 136, 0.4);
            border-radius: 25px;
            padding: 40px 25px;
            text-align: center;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.2), inset 0 0 25px rgba(0, 242, 254, 0.1);
            position: relative;
        }

        .status-header {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 50px;
            padding: 12px 20px;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            font-size: 0.95rem;
            color: #00ff88;
            letter-spacing: 1.5px;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
            margin-bottom: 30px;
            animation: pulse-border 2s infinite ease-in-out;
        }

        .green-dot {
            width: 12px;
            height: 12px;
            background-color: #00ff88;
            border-radius: 50%;
            box-shadow: 0 0 12px #00ff88;
            animation: blink 1.2s infinite;
        }

        .robot-container {
            position: relative;
            width: 180px;
            height: 180px;
            margin: 0 auto 30px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .hud-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 3px dashed #00f2fe;
            border-radius: 50%;
            animation: rotateHUD 12s linear infinite;
        }

        .hud-ring-inner {
            position: absolute;
            width: 82%;
            height: 82%;
            border: 2px solid rgba(0, 255, 136, 0.5);
            border-top-color: transparent;
            border-bottom-color: transparent;
            border-radius: 50%;
            animation: rotateHUD-rev 6s linear infinite;
        }

        .robot-avatar {
            width: 120px;
            height: 120px;
            background: radial-gradient(circle, #0e1126, #04050d);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 2px solid #00ff88;
            box-shadow: 0 0 25px rgba(0, 255, 136, 0.5);
            z-index: 2;
        }

        .robot-avatar svg {
            width: 70px;
            height: 70px;
            fill: #00f2fe;
            filter: drop-shadow(0 0 8px #00f2fe);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 35px;
        }

        .stat-box {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(0, 242, 254, 0.3);
            border-radius: 15px;
            padding: 18px;
            text-align: center;
        }

        .stat-box label {
            font-size: 0.75rem;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: block;
            margin-bottom: 5px;
        }

        .stat-box value {
            font-size: 1.3rem;
            color: #00f2fe;
            font-weight: 700;
            text-shadow: 0 0 8px rgba(0, 242, 254, 0.6);
        }

        .developer-footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed rgba(255, 255, 255, 0.15);
            font-family: 'Rajdhani', sans-serif;
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 2px;
            color: #ffd700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
        }

        .developer-footer a {
            color: #ff007f;
            text-decoration: none;
            transition: 0.3s ease;
        }

        .developer-footer a:hover {
            color: #00f2fe;
            text-shadow: 0 0 12px #00f2fe;
        }

        @keyframes pulse-border {
            0% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.3); }
            50% { box-shadow: 0 0 30px rgba(0, 255, 136, 0.7); }
            100% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.3); }
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
        }

        @keyframes rotateHUD {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes rotateHUD-rev {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }

        @media(max-width: 600px) {
            .status-header { font-size: 0.75rem; padding: 10px 15px; }
            .robot-container { width: 140px; height: 140px; }
            .robot-avatar { width: 95px; height: 95px; }
            .robot-avatar svg { width: 50px; height: 50px; }
            .developer-footer { font-size: 1rem; }
        }
    </style>
</head>
<body>

    <div class="main-card">
        <div class="status-header">
            <div class="green-dot"></div>
            VIVEK BOTS ARE 24/7 ACTIVE FOR NEXT 5 YEARS 🟢
        </div>

        <div class="robot-container">
            <div class="hud-ring"></div>
            <div class="hud-ring-inner"></div>
            <div class="robot-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7V5.73C9.4,5.39 9,4.74 9,4A2,2 0 0,1 11,2H12M7.5,13A1.5,1.5 0 0,0 6,14.5A1.5,1.5 0 0,0 7.5,16A1.5,1.5 0 0,0 9,14.5A1.5,1.5 0 0,0 7.5,13M16.5,13A1.5,1.5 0 0,0 15,14.5A1.5,1.5 0 0,0 16.5,16A1.5,1.5 0 0,0 18,14.5A1.5,1.5 0 0,0 16.5,13M12,17C9.33,17 7,18 7,18H17C17,18 14.67,17 12,17Z"/>
                </svg>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box">
                <label>ENGINE UPTIME</label>
                <value>{{ uptime }}</value>
            </div>
            <div class="stat-box">
                <label>LOADED INSTANCES</label>
                <value>{{ total_bots }} ACTIVE</value>
            </div>
            <div class="stat-box">
                <label>SYSTEM HEALTH</label>
                <value style="color: #00ff88;">100% OPTIMAL</value>
            </div>
        </div>

        <div class="developer-footer">
            DEVELOPER : <a href="https://t.me/danggvivek" target="_blank">@danggvivek/tg</a>
        </div>
    </div>

</body>
</html>
"""

@web_app.route('/')
def home():
    return render_template_string(
        HTML_TEMPLATE,
        uptime=get_uptime(),
        total_bots=len(BOT_INSTANCES)
    )

def run_flask():
    port = int(os.environ.get("PORT", 8080))
    web_app.run(host='0.0.0.0', port=port)

# ==========================================
# ⚙ BACKGROUND WORKER LOOPS
# ==========================================

def run_sequential_spam(chat_id, message_text):
    ACTIVE_SPAM[chat_id] = True
    bot = BOT_INSTANCES[0] if BOT_INSTANCES else None
    if not bot:
        return
    while ACTIVE_SPAM.get(chat_id):
        try:
            bot.send_message(chat_id, message_text)
            time.sleep(SPAM_DELAY)
        except Exception as e:
            logger.error(f"Spam sending error: {e}")
            time.sleep(3)

def run_target_hunt(chat_id, target_username):
    ACTIVE_HUNTS[chat_id] = True
    bot = BOT_INSTANCES[0] if BOT_INSTANCES else None
    if not bot:
        return
    while ACTIVE_HUNTS.get(chat_id):
        roast_template = random.choice(MIRZAPUR_HUNT_ROASTS)
        formatted_msg = roast_template.format(target=target_username)
        try:
            bot.send_message(chat_id, formatted_msg)
            time.sleep(2.0)
        except Exception as e:
            logger.error(f"Hunt sending error: {e}")
            time.sleep(5)

def run_nc_spam(chat_id, new_title):
    """Superfast Continuous Name Changer Loop (/nc)"""
    ACTIVE_NC[chat_id] = True
    bot = BOT_INSTANCES[0] if BOT_INSTANCES else None
    if not bot:
        return
    count = 1
    while ACTIVE_NC.get(chat_id):
        try:
            formatted_title = f"{new_title} [{count}]"
            bot.set_chat_title(chat_id, formatted_title)
            count += 1
            time.sleep(NC_DELAY)
        except Exception as e:
            logger.error(f"Name change error: {e}")
            time.sleep(2.0)

def run_slide_reply(chat_id, reply_to_id, text_to_send):
    """Continuous Rapid Swipe Reply Loop (/slide)"""
    ACTIVE_SLIDE[chat_id] = True
    bot = BOT_INSTANCES[0] if BOT_INSTANCES else None
    if not bot:
        return
    while ACTIVE_SLIDE.get(chat_id):
        try:
            bot.send_message(chat_id, text_to_send, reply_to_message_id=reply_to_id)
            time.sleep(SLIDE_DELAY)
        except Exception as e:
            logger.error(f"Slide reply error: {e}")
            time.sleep(2.0)

# ==========================================
# 📱 MAIN DASHBOARD UI BUILDER
# ==========================================
def build_custom_dashboard():
    text = (
        "<code>╭──────────────────────────────────────╮\n"
        "│          𝙑 𝙄 𝙑 𝙀 𝙆                  │\n"
        "│       𝙎𝙔𝙎𝙏𝙀𝙈 𝘾𝙊𝙉𝙏𝙍𝙊𝙇              │\n"
        "│        ───────────────               │\n"
        "│                                      │\n"
        "│   〘 𝙈𝙀𝙉𝙐 〙                         │\n"
        "│                                      │\n"
        "│   [ 𝙐𝙎𝙀𝙍𝙎 ]       [ 𝙂𝙍𝙊𝙐𝙋𝙎 ]        │\n"
        "│                                      │\n"
        "│   [ 𝘼𝙐𝙏𝙊𝙍𝙀𝙋 ]     [ 𝙎𝙔𝙎𝙏𝙀𝙈 ]        │\n"
        "│                                      │\n"
        "│   [       𝙒𝙀𝘽  𝘾𝙊𝙉𝙏𝙍𝙊𝙇       ]   │\n"
        "│                                      │\n"
        "│          𝙑𝙄𝙑𝙀𝙆'𝙎 𝘿𝙊𝙈𝘼𝙄𝙉             │\n"
        "╰──────────────────────────────────────╯</code>\n\n"
        f"<b>Prefix Mode:</b> <code>{PREFIX}</code>\n"
        f"<b>Active Bots:</b> <code>{len(BOT_INSTANCES)}</code>"
    )
    markup = InlineKeyboardMarkup(row_width=2)
    
    btn_users = InlineKeyboardButton("𝙐𝙎𝙀𝙍𝙎", callback_data="sub_users")
    btn_groups = InlineKeyboardButton("𝙂𝙍𝙊𝙐𝙋𝙎", callback_data="sub_groups")
    markup.add(btn_users, btn_groups)
    
    btn_autorep = InlineKeyboardButton("𝘼𝙐𝙏𝙊𝙍𝙀𝙋", callback_data="sub_autorep")
    btn_system = InlineKeyboardButton("𝙎𝙔𝙎𝙏𝙀𝙈", callback_data="sub_system")
    markup.add(btn_autorep, btn_system)
    
    btn_web = InlineKeyboardButton("𝙒𝙀𝘽 𝘾𝙊𝙉𝙏𝙍𝙊𝙇", url=RENDER_WEB_URL)
    markup.add(btn_web)
    
    return text, markup

# ==========================================
# 🤖 BOT HANDLERS & COMMAND REGISTRATION
# ==========================================
def register_handlers(bot_instance):

    # ----------------------------------------------------
    # 👑 OWNER-ONLY ADMIN CONTROL
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'setlink'))
    def set_link_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        global RENDER_WEB_URL
        
        if not is_owner(message.from_user.id):
            return bot_instance.reply_to(message, "⛔ <b>Access Denied:</b> Ye command sirf Owner ke liye hai.")
        
        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(
                message, 
                f"⚠️ <b>Format:</b> <code>/{PREFIX}setlink <NEW_URL></code>\n\n"
                "<b>Example:</b>\n<code>/setlink https://my-bot-service.onrender.com/</code>"
            )
        
        new_url = args[1].strip()
        if not (new_url.startswith("http://") or new_url.startswith("https://")):
            return bot_instance.reply_to(message, "❌ <b>Invalid URL!</b> URL <code>http://</code> ya <code>https://</code> se start honi chahiye.")
        
        RENDER_WEB_URL = new_url
        save_web_url(new_url)
        
        bot_instance.reply_to(
            message, 
            f"✅ <b>Success!</b> Web Control Button link updated successfully for all bots.\n\n"
            f"🔗 <b>New Target URL:</b> <code>{RENDER_WEB_URL}</code>"
        )

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'adminpanel') or check_cmd(m, 'owner'))
    def owner_admin_panel(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_owner(message.from_user.id):
            return
        
        panel_text = (
            "👑 <b>OWNER EXCLUSIVE CONTROL PANEL</b>\n\n"
            f"📌 <b>Current Web Control URL:</b>\n<code>{RENDER_WEB_URL}</code>\n\n"
            "<b>Available Owner Commands:</b>\n"
            f"• <code>/{PREFIX}setlink <URL></code> - Web Control button ki link change karein\n"
            f"• <code>/{PREFIX}addadmin <id></code> - Naya Admin add karein\n"
            f"• <code>/{PREFIX}removeadmin <id></code> - Admin remove karein\n"
            f"• <code>/{PREFIX}showadmins</code> - Admins ki list dekhein"
        )
        bot_instance.reply_to(message, panel_text)

    # ----------------------------------------------------
    # 🔤 DYNAMIC PREFIX SETTER
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'prefix') or check_cmd(m, 'setprefix'))
    def change_prefix_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        global PREFIX
        if not is_admin(message.from_user.id):
            return bot_instance.reply_to(message, "❌ Admin access required to change prefix.")
        
        args = message.text.split()
        if len(args) > 1:
            PREFIX = args[1]
            bot_instance.reply_to(message, f"✅ <b>Bot Prefix Successfully Updated To:</b> <code>{PREFIX}</code>")
        else:
            bot_instance.reply_to(message, f"⚠️ <b>Current Prefix:</b> <code>{PREFIX}</code>\n\nUsage: <code>/prefix <new_symbol></code> (e.g. <code>/prefix !</code> or <code>/prefix .</code>)")

    # ----------------------------------------------------
    # 📲 START / MENU COMMAND HANDLER
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda msg: check_cmd(msg, 'start') or check_cmd(msg, 'menu'))
    def send_welcome_dashboard(message):
        send_temp_ack(bot_instance, message.chat.id)
        text, markup = build_custom_dashboard()
        bot_instance.reply_to(message, text, reply_markup=markup)

    @bot_instance.callback_query_handler(func=lambda call: True)
    def handle_callbacks(call):
        data = call.data
        if data == "main_menu":
            text, markup = build_custom_dashboard()
            bot_instance.edit_message_text(text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)

        elif data == "sub_users":
            text = (
                "<code>╭─ 𝙐𝙎𝙀𝙍 𝘾𝙊𝙉𝙏𝙍𝙊𝙇 ─╮\n\n"
                f" /{PREFIX}addadmin     /{PREFIX}removeadmin\n"
                f" /{PREFIX}showadmins   /{PREFIX}targetadd\n"
                f" /{PREFIX}fucktarget   /{PREFIX}hunt\n"
                f" /{PREFIX}stophunt     /{PREFIX}prefix\n\n"
                "╰──────────────────╯</code>"
            )
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton("↩ 𝘽𝘼𝘾𝙆", callback_data="main_menu"))
            bot_instance.edit_message_text(text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)

        elif data == "sub_groups":
            text = (
                "<code>╭─ 𝙐𝙎𝙀𝙍 𝙂𝙍𝙊𝙐𝙋 𝘾𝙊𝙍𝙀 ─╮\n\n"
                f" /{PREFIX}fetchallgroup   /{PREFIX}fetchallchats\n"
                f" /{PREFIX}targetgc        /{PREFIX}sendmessage\n"
                f" /{PREFIX}leave           /{PREFIX}nc\n"
                f" /{PREFIX}stopnc          /{PREFIX}ncdelay\n\n"
                "╰────────────────╯</code>"
            )
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton("↩ 𝘽𝘼𝘾𝙆", callback_data="main_menu"))
            bot_instance.edit_message_text(text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)

        elif data == "sub_autorep":
            text = (
                "<code>╭─ 𝘼𝙐𝙏𝙊 𝙎𝙔𝙎𝙏𝙀𝙈 ─╮\n\n"
                f" /{PREFIX}autoreply       /{PREFIX}stopautoreply\n"
                f" /{PREFIX}spam            /{PREFIX}stopspam\n"
                f" /{PREFIX}spamdelay       /{PREFIX}slide\n"
                f" /{PREFIX}stopslide       /{PREFIX}slidedelay\n\n"
                "╰─────────────────╯</code>"
            )
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton("↩ 𝘽𝘼𝘾𝙆", callback_data="main_menu"))
            bot_instance.edit_message_text(text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)

        elif data == "sub_system":
            text = (
                "<code>╭─ 𝙎𝙔𝙎𝙏𝙀𝙈 𝘾𝙊𝙍𝙀 ─╮\n\n"
                f" /{PREFIX}mute       /{PREFIX}del\n"
                f" /{PREFIX}image      /{PREFIX}status\n"
                f" /{PREFIX}dynamicstop\n\n"
                "╰─────────────────╯</code>"
            )
            markup = InlineKeyboardMarkup().add(InlineKeyboardButton("↩ 𝘽𝘼𝘾𝙆", callback_data="main_menu"))
            bot_instance.edit_message_text(text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)

        bot_instance.answer_callback_query(call.id)

    # ----------------------------------------------------
    # 🛡 ADMIN COMMANDS (SUPPORT BOTH REPLY & ID ARGUMENT)
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'addadmin'))
    def add_admin_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_owner(message.from_user.id):
            return bot_instance.reply_to(message, "❌ Only Owner can add Admins.")
        
        target_id = None
        args = message.text.split()
        
        if message.reply_to_message and message.reply_to_message.from_user:
            target_id = message.reply_to_message.from_user.id
        elif len(args) > 1 and args[1].isdigit():
            target_id = int(args[1])

        if target_id:
            DYNAMIC_ADMINS.add(target_id)
            bot_instance.reply_to(message, f"✅ Admin <code>{target_id}</code> added successfully.")
        else:
            bot_instance.reply_to(message, f"⚠️ Usage: Reply to a user's message with <code>/{PREFIX}addadmin</code> or type <code>/{PREFIX}addadmin &lt;user_id&gt;</code>")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'removeadmin'))
    def remove_admin_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_owner(message.from_user.id):
            return bot_instance.reply_to(message, "❌ Only Owner can remove Admins.")
        
        target_id = None
        args = message.text.split()
        
        if message.reply_to_message and message.reply_to_message.from_user:
            target_id = message.reply_to_message.from_user.id
        elif len(args) > 1 and args[1].isdigit():
            target_id = int(args[1])

        if target_id:
            DYNAMIC_ADMINS.discard(target_id)
            bot_instance.reply_to(message, f"🗑 Admin <code>{target_id}</code> removed.")
        else:
            bot_instance.reply_to(message, f"⚠ Usage: Reply to a user's message with <code>/{PREFIX}removeadmin</code> or type <code>/{PREFIX}removeadmin &lt;user_id&gt;</code>")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'showadmins'))
    def show_admins_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        owners_str = ", ".join(str(o) for o in OWNER_IDS) or "None"
        admins_str = ", ".join(str(a) for a in DYNAMIC_ADMINS) or "None"
        bot_instance.reply_to(message, f"<b>👑 Owners:</b> {owners_str}\n<b>🛡 Admins:</b> {admins_str}")

    # ----------------------------------------------------
    # 💬 SPAM CONTROLS
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'spam'))
    def start_spam_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return bot_instance.reply_to(message, "❌ Admin access required.")
        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(message, f"⚠️ Usage: `/{PREFIX}spam <message>`")
        msg_text = args[1]
        bot_instance.reply_to(message, f"⚡ Starting Continuous Spam (Delay: {SPAM_DELAY}s)...")
        threading.Thread(target=run_sequential_spam, args=(message.chat.id, msg_text), daemon=True).start()

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'stopspam'))
    def stop_spam_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        ACTIVE_SPAM[message.chat.id] = False
        bot_instance.reply_to(message, "🛑 Spam stopped for this chat.")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'spamdelay'))
    def set_spam_delay(message):
        send_temp_ack(bot_instance, message.chat.id)
        global SPAM_DELAY
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        if len(args) > 1 and args[1].isdigit():
            SPAM_DELAY = int(args[1]) / 1000.0
            bot_instance.reply_to(message, f"⏱ Spam delay set to <code>{args[1]} ms</code>.")
        else:
            bot_instance.reply_to(message, f"⚠ Usage: `/{PREFIX}spamdelay <milliseconds>`")

    # ----------------------------------------------------
    # 🔄 CONTINUOUS SWIPE REPLY CONTROLS (/slide)
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'slide'))
    def start_slide_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        
        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(message, f"⚠️ Usage: Kisi message par reply karke type karein `/{PREFIX}slide <text>`")
        
        if not message.reply_to_message:
            return bot_instance.reply_to(message, "❌ Pehle kisi user ke message par reply karke `slide` command lagayein!")
        
        text_to_send = args[1].strip()
        reply_to_id = message.reply_to_message.message_id
        
        bot_instance.reply_to(
            message, 
            f"🚀 <b>SWIPE REPLY ATTACK STARTED!</b>\n\n"
            f"🎯 <b>Target Message ID:</b> <code>{reply_to_id}</code>\n"
            f"💬 <b>Text:</b> <i>{text_to_send}</i>\n"
            f"⏱ <b>Delay:</b> <code>{int(SLIDE_DELAY * 1000)} ms</code>"
        )
        threading.Thread(target=run_slide_reply, args=(message.chat.id, reply_to_id, text_to_send), daemon=True).start()

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'stopslide'))
    def stop_slide_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        ACTIVE_SLIDE[message.chat.id] = False
        bot_instance.reply_to(message, "🛑 Swipe reply attack stopped.")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'slidedelay'))
    def set_slide_delay_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        global SLIDE_DELAY
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        if len(args) > 1 and args[1].isdigit():
            SLIDE_DELAY = int(args[1]) / 1000.0
            bot_instance.reply_to(message, f"⚡ Slide Reply Delay Updated: <code>{args[1]} ms</code>")
        else:
            bot_instance.reply_to(message, f"⚠ Usage: `/{PREFIX}slidedelay <ms>` (e.g. `/{PREFIX}slidedelay 300`)")

    # ----------------------------------------------------
    # 🏷 NAME CHANGER CONTROLS (/nc, /stopnc, /ncdelay)
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'nc'))
    def change_nc_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        if message.chat.type not in ['group', 'supergroup']:
            return bot_instance.reply_to(message, "❌ Ye command sirf groups me kaam karegi.")

        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(message, f"⚠️ Usage: `/{PREFIX}nc <New Name>`")

        new_title = args[1].strip()
        bot_instance.reply_to(message, f"🚀 <b>SUPERFAST Name Change Attack Started!</b>\n\n📌 <b>Target Name:</b> <code>{new_title}</code>\n⏱ <b>Delay:</b> <code>{int(NC_DELAY * 1000)} ms</code>")
        threading.Thread(target=run_nc_spam, args=(message.chat.id, new_title), daemon=True).start()

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'stopnc'))
    def stop_nc_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        ACTIVE_NC[message.chat.id] = False
        bot_instance.reply_to(message, "🛑 Name changer loop stopped.")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'ncdelay'))
    def set_nc_delay_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        global NC_DELAY
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        if len(args) > 1 and args[1].isdigit():
            NC_DELAY = int(args[1]) / 1000.0
            bot_instance.reply_to(message, f"⚡ Name Change Delay Updated: <code>{args[1]} ms</code> (Superfast Mode Active!)")
        else:
            bot_instance.reply_to(message, f"⚠ Usage: `/{PREFIX}ncdelay <milliseconds>`\nExample: `/{PREFIX}ncdelay 10` for maximum speed.")

    # ----------------------------------------------------
    # 🤖 AUTO REPLY CONTROLS
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'autoreply'))
    def set_autoreply_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        global AUTOREPLY_MSG
        if not is_admin(message.from_user.id):
            return
        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(message, f"⚠️ Usage: `/{PREFIX}autoreply <message>`")
        AUTOREPLY_MSG = args[1]
        ACTIVE_AUTOREPLY[message.chat.id] = True
        bot_instance.reply_to(message, f"🤖 Auto Reply activated: <i>{AUTOREPLY_MSG}</i>")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'stopautoreply'))
    def stop_autoreply_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        ACTIVE_AUTOREPLY[message.chat.id] = False
        bot_instance.reply_to(message, "🛑 Auto Reply deactivated.")

    # ----------------------------------------------------
    # 🌐 GROUP & BROADCAST CONTROLS
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'fetchallgroup') or check_cmd(m, 'fetchallgc'))
    def fetch_all_groups_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        
        group_list = [f"• <b>{info['title']}</b> | ID: <code>{cid}</code>" 
                      for cid, info in KNOWN_CHATS.items() 
                      if info['type'] in ['group', 'supergroup']]
        
        if group_list:
            res = "<b>👥 Active Bot Groups List:</b>\n\n" + "\n".join(group_list)
        else:
            res = "ℹ️ No active groups tracked yet. Send a message in groups where the bot is added!"
        
        bot_instance.reply_to(message, res)

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'fetchallchats'))
    def fetch_all_chats_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        
        chat_list = [f"• [{info['type'].upper()}] <b>{info['title']}</b> | ID: <code>{cid}</code>" 
                     for cid, info in KNOWN_CHATS.items()]
        
        if chat_list:
            res = "<b>💬 All Active Bot Chats (DM + Groups):</b>\n\n" + "\n".join(chat_list)
        else:
            res = "ℹ️ No active chats tracked yet."
        
        bot_instance.reply_to(message, res)

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'targetgc'))
    def add_target_gc(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        if len(args) > 1:
            try:
                gid = int(args[1])
                TARGET_GCS.add(gid)
                bot_instance.reply_to(message, f"🎯 Group <code>{gid}</code> added to target broadcast list.")
            except ValueError:
                bot_instance.reply_to(message, "⚠️ Invalid Group ID.")
        else:
            TARGET_GCS.add(message.chat.id)
            bot_instance.reply_to(message, f"🎯 Current Group <code>{message.chat.id}</code> added to target list.")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'sendmessage'))
    def send_broadcast_msg(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        args = message.text.split(maxsplit=1)
        if len(args) < 2:
            return bot_instance.reply_to(message, f"⚠ Usage: `/{PREFIX}sendmessage <msg>`")
        msg = args[1]
        destinations = TARGET_GCS if TARGET_GCS else [message.chat.id]
        success = 0
        for gid in destinations:
            try:
                bot_instance.send_message(gid, msg)
                success += 1
            except Exception as e:
                logger.error(f"Broadcast error for {gid}: {e}")
        bot_instance.reply_to(message, f"🚀 Sent message to <code>{success}</code> targeted location(s).")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'leave'))
    def leave_chat_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        target_chat = int(args[1]) if len(args) > 1 and (args[1].isdigit() or args[1].startswith('-')) else message.chat.id
        bot_instance.reply_to(message, f"👋 Leaving chat <code>{target_chat}</code>...")
        try:
            bot_instance.leave_chat(target_chat)
        except Exception as e:
            logger.error(f"Leave chat error: {e}")

    # ----------------------------------------------------
    # 🙍 USER / TARGET CONTROLS (HUNT & FUCKTARGET)
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'targetadd'))
    def add_target_user(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        args = message.text.split()
        if len(args) > 1:
            target = args[1]
            TARGET_USERS.add(target)
            bot_instance.reply_to(message, f"🎯 User {target} added to Attack Targets.")
        elif message.reply_to_message:
            target = f"@{message.reply_to_message.from_user.username}" if message.reply_to_message.from_user.username else str(message.reply_to_message.from_user.id)
            TARGET_USERS.add(target)
            bot_instance.reply_to(message, f"🎯 User {target} added to Attack Targets.")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'fucktarget') or check_cmd(m, 'hunt'))
    def fuck_target_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        args = message.text.split(maxsplit=1)
        custom_msg = args[1] if len(args) > 1 else "Abe gadhe, sun le bss!"
        if not TARGET_USERS:
            return bot_instance.reply_to(message, f"⚠ No target set. Add target using `/{PREFIX}targetadd @user` first.")
        
        target = list(TARGET_USERS)[0]
        bot_instance.reply_to(message, f"💥 Attacking target {target}!")
        threading.Thread(target=run_target_hunt, args=(message.chat.id, f"{target} {custom_msg}"), daemon=True).start()

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'stophunt') or check_cmd(m, 'stopfucktarget'))
    def stop_hunt_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        ACTIVE_HUNTS[message.chat.id] = False
        bot_instance.reply_to(message, "🛑 Hunt / Target attack stopped.")

    # ----------------------------------------------------
    # 🔇 MUTE / DELETE CONTROLS
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'mute'))
    def mute_user_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        if not message.reply_to_message:
            return bot_instance.reply_to(message, f"⚠️ Reply to user message with `/{PREFIX}mute <sec>`.")
        
        args = message.text.split()
        sec = int(args[1]) if len(args) > 1 and args[1].isdigit() else 60
        target_id = message.reply_to_message.from_user.id
        
        chat_mutes = ACTIVE_MUTED_USERS.setdefault(message.chat.id, {})
        chat_mutes[target_id] = time.time() + sec
        bot_instance.reply_to(message, f"🔇 User muted for <code>{sec}</code> seconds (Auto-Deleting messages).")

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'del'))
    def delete_replied_msg(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        if message.reply_to_message:
            try:
                bot_instance.delete_message(message.chat.id, message.reply_to_message.message_id)
                bot_instance.delete_message(message.chat.id, message.message_id)
            except Exception as e:
                logger.error(f"Delete message error: {e}")

    # ----------------------------------------------------
    # 🖼 MEDIA CONTROLS
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'image'))
    def image_search_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        args = message.text.split(maxsplit=1)
        query = args[1] if len(args) > 1 else "nature"
        bot_instance.reply_to(message, f"🔍 Fetching image for <i>'{query}'</i>...")
        img_url = f"https://source.unsplash.com/800x600/?{requests.utils.quote(query)}"
        try:
            bot_instance.send_photo(message.chat.id, img_url, caption=f"🖼 Image result for: <b>{query}</b>")
        except Exception as e:
            bot_instance.reply_to(message, "❌ Unable to fetch image at this moment.")

    # ----------------------------------------------------
    # ⚙ SYSTEM & DYNAMIC STOP
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'status'))
    def status_cmd(message):
        send_temp_ack(bot_instance, message.chat.id)
        status_text = (
            "<b>⚙ SYSTEM LIVE MONITORING</b>\n\n"
            f"• <b>Prefix:</b> <code>{PREFIX}</code>\n"
            f"• <b>Uptime:</b> <code>{get_uptime()}</code>\n"
            f"• <b>Web Control Link:</b> <code>{RENDER_WEB_URL}</code>\n"
            f"• <b>Spam Active:</b> <code>{ACTIVE_SPAM.get(message.chat.id, False)}</code>\n"
            f"• <b>Slide Active:</b> <code>{ACTIVE_SLIDE.get(message.chat.id, False)}</code>\n"
            f"• <b>NC Spam Active:</b> <code>{ACTIVE_NC.get(message.chat.id, False)}</code>\n"
            f"• <b>NC Delay:</b> <code>{int(NC_DELAY * 1000)} ms</code>\n"
            f"• <b>Hunt Active:</b> <code>{ACTIVE_HUNTS.get(message.chat.id, False)}</code>\n"
            f"• <b>AutoReply Active:</b> <code>{ACTIVE_AUTOREPLY.get(message.chat.id, False)}</code>\n"
            f"• <b>Target GCs:</b> <code>{len(TARGET_GCS)}</code>\n"
            f"• <b>Target Users:</b> <code>{len(TARGET_USERS)}</code>"
        )
        bot_instance.reply_to(message, status_text)

    @bot_instance.message_handler(func=lambda m: check_cmd(m, 'dynamicstop'))
    def dynamic_stop_all(message):
        send_temp_ack(bot_instance, message.chat.id)
        if not is_admin(message.from_user.id):
            return
        cid = message.chat.id
        ACTIVE_SPAM[cid] = False
        ACTIVE_HUNTS[cid] = False
        ACTIVE_NC[cid] = False
        ACTIVE_SLIDE[cid] = False
        ACTIVE_AUTOREPLY[cid] = False
        bot_instance.reply_to(message, "🛑 <b>DYNAMIC STOP EXECUTED:</b> All background operations killed!")

    # ----------------------------------------------------
    # 📩 GLOBAL MESSAGE HANDLER & AUTO-ROAST & AUTO-MUTE
    # ----------------------------------------------------
    @bot_instance.message_handler(func=lambda msg: True)
    def handle_all_messages(message):
        chat_title = message.chat.title if message.chat.title else (
            message.from_user.first_name if message.from_user else "Private User"
        )
        KNOWN_CHATS[message.chat.id] = {
            'title': chat_title,
            'type': message.chat.type
        }

        # Mute check
        chat_mutes = ACTIVE_MUTED_USERS.get(message.chat.id, {})
        if message.from_user and message.from_user.id in chat_mutes:
            if time.time() < chat_mutes[message.from_user.id]:
                try:
                    bot_instance.delete_message(message.chat.id, message.message_id)
                    return
                except Exception:
                    pass
            else:
                del chat_mutes[message.from_user.id]

        # Auto Reply check
        if ACTIVE_AUTOREPLY.get(message.chat.id) and AUTOREPLY_MSG and not message.from_user.is_bot:
            time.sleep(AUTOREPLY_DELAY)
            try:
                bot_instance.reply_to(message, AUTOREPLY_MSG)
            except Exception as e:
                logger.error(f"AutoReply error: {e}")

        # Auto Roast Trigger check
        if message.text and should_trigger_roast(message.text):
            roast_msg = random.choice(AUTO_ROAST_RESPONSES)
            try:
                bot_instance.reply_to(message, roast_msg)
            except Exception as e:
                logger.error(f"Failed to send Auto-Roast: {e}")

# Register handlers for all loaded bots
for b_inst in BOT_INSTANCES:
    register_handlers(b_inst)

def start_bot_polling(bot_instance):
    try:
        bot_instance.infinity_polling(skip_pending=True)
    except Exception as e:
        logger.error(f"Polling error: {e}")

# ==========================================
# 🚀 MAIN APPLICATION ENTRY POINT
# ==========================================
if __name__ == "__main__":
    threading.Thread(target=run_flask, daemon=True).start()
    logger.info(f"🔥 VIVEK ENGINE STARTED WITH {len(BOT_INSTANCES)} BOT(S)")
    
    if BOT_INSTANCES:
        threads = []
        for b_inst in BOT_INSTANCES:
            t = threading.Thread(target=start_bot_polling, args=(b_inst,), daemon=True)
            t.start()
            threads.append(t)
        
        for t in threads:
            t.join()
    else:
        logger.error("No valid BOT_TOKEN provided in Environment variables.")
        while True:
            time.sleep(3600)
