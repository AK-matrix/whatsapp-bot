# WhatsApp Group Bot 🤖

A lightweight WhatsApp bot built for **group management, AI chat, fun utilities**, and an **internal ledger system** to track payments, debts, and balances between group members.

---

## ✨ Features

- **AI Chat** – Converse with AK using recent group context (30-message window)
- **Group Utilities** – Mass tagging, admin controls, and moderation helpers
- **Ledger System** – Track shared expenses, debts, settlements, and balances
- **Fun Commands** – Games, spam (restricted), and sticker generation
- **Role-Based Access** – Admin-only and developer-only commands (hidden)

---

## 🧾 Commands

### General
- `!ping` – Check if bot is online  
- `ak <question>` – Chat with AK (context-aware)

### Group & Tagging
- `@everyone` / `@pgp` / `@utr` – Group-wide or subgroup tagging

### Fun
- `!flip` – Coin flip  
- `!8ball <question>` – Magic 8-ball  
- `!sticker` *(reply to image)* – Convert image to sticker

### Spam
- `!spam <count> <text>` – Spam messages  
  - Limited for regular users  
  - **2000+ messages: developer-only**

> 🔒 **Developer and ledger commands are intentionally hidden** to prevent misuse.

---

## 🚀 Setup & Run

1. **Add API Keys**  
   Paste your keys into the config or environment file:
   - `OPENAI_API_KEY` (GPT)
   - `GEMINI_API_KEY` (Gemini)

2. **Install & Run**
   ```bash
   npm install
   npm start
   
## 🔗 Connect WhatsApp

- A **QR code** will appear in the terminal  
- Scan it via **WhatsApp → Linked Devices**  
- Session is saved automatically  

---

## ▶️ Start Using

- Bot comes online  
- Commands work immediately in connected groups  

---

## ⚙️ Notes

- Ledger supports multi-member groups with admin-controlled operations  
- Designed to be minimal, fast, and extensible  

