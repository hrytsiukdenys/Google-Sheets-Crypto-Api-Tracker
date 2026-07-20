# 📘 Step-by-Step Implementation & Testing Guide (GAS + API + Sheets)

This comprehensive guide walks you through setting up, testing, and presenting this automated price tracking project within **10–15 minutes** using your own Google account.

---

## 🟢 Step 1. Create a Google Spreadsheet & Connect the Code

1. Open [sheets.google.com](https://sheets.google.com) and click **"+ Blank"** to create a new spreadsheet.
2. Name the file, for example: `Automated Crypto & Currency Tracker (GAS + API)`.
3. In the top toolbar, navigate to: **Extensions → Apps Script**.
4. A new browser tab will open displaying the Google Apps Script editor. On the left sidebar, click `Code.gs`.
5. Completely delete any default placeholder code (such as `function myFunction() {}`).
6. Copy the **entire contents of `Code.gs`** from our project folder and paste it into the script editor.
7. Click the **"Save project" icon (💾)** on the toolbar (or press `Ctrl + S` / `Cmd + S`).

---

## 🟢 Step 2. Initialize Spreadsheet Structure (One-Click Setup)

1. Return to your Google Sheets browser tab and **refresh the page** (`F5` or `Cmd + R`).
2. Wait 3–5 seconds. A new custom menu dropdown will appear on your toolbar beside "Help": **`⚡ Automation (API Tracker)`**.
3. Click **`⚡ Automation (API Tracker) → 🛠 Initialize Spreadsheet Structure`**.
4. **First-Time Authorization Required:**
   - Google will prompt for permission to run the script. Click **"Continue"**.
   - Select your Google Account.
   - You will see a notice saying *"Google hasn't verified this app"*. This is completely normal for custom scripts written by your account.
   - Click **"Advanced"** → then click **"Go to project (unsafe)"** at the bottom.
   - Click **"Allow"** to grant permission for fetching API data and sending notification emails.
5. Click **`🛠 Initialize Spreadsheet Structure`** a second time.
6. The script will automatically build two formatted tabs inside your spreadsheet:
   - **`Settings & Thresholds`** — pre-loaded with sample assets (`bitcoin`, `ethereum`, `solana`, `the-open-network`) and threshold columns.
   - **`Price History`** — a clean log tab ready to capture timestamped price entries.

---

## 🟢 Step 3. Manual API Test & First Data Fetch

1. From the custom menu, select: **`⚡ Automation (API Tracker) → 🔄 Update Prices Now`**.
2. Open the **`Settings & Thresholds`** tab:
   - Notice that real-time prices from the CoinGecko API have populated the **"Current Price ($)"** column!
   - The **"Last Updated"** column shows the exact timestamp of the API call.
3. Open the **`Price History`** tab:
   - You will see historical log records appended for every tracked asset (ideal for building charts or analytics).
4. **Test Email Notifications:**
   - By default, the script sends alerts directly to **your active Gmail account**.
   - Go to the `Settings & Thresholds` tab and modify Bitcoin's **"Min Threshold ($)"** to a value **ABOVE** its current price (e.g., enter `100000`).
   - Click **`⚡ Automation (API Tracker) → 🔄 Update Prices Now`** again.
   - Bitcoin's status will update to `❄️ BELOW MIN`.
   - Check your Gmail inbox — you will immediately receive an alert email titled `[🚨 Crypto Tracker] Price Threshold Alert`!

---

## 🟢 Step 4. Configure Telegram Bot Notifications (Optional & Impressive)

Adding instant Telegram bot notifications creates an exceptional "wow effect" during client demonstrations and freelance proposal videos. Here is how to configure it in 3 minutes:

### 1. Create Your Bot in Telegram
1. Open Telegram and search for the official **`@BotFather`** bot (verified with a blue checkmark).
2. Send the `/newbot` command.
3. Enter a friendly display name (e.g., `Crypto Price Alert Bot`).
4. Enter a unique username ending in `_bot` (e.g., `my_portfolio_crypto_tracker_bot`).
5. `@BotFather` will reply with your **HTTP API Token** (looks like `1234567890:ABCdefGhiJKlmNoPQRstuVWxyz`). Copy this token.

### 2. Get Your Personal Telegram Chat ID
1. Search in Telegram for **`@userinfobot`** or **`@getmyid_bot`** and click *Start*.
2. The bot will reply with your numerical **`Id`** (e.g., `987654321`). Copy this ID.

### 3. Activate Telegram in Your Script
1. Return to your Apps Script editor (`Code.gs`).
2. At the very top of the file, locate the `CONFIG` object:
   ```javascript
   TELEGRAM: {
     ENABLED: false, // <-- Change to true
     BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN', // <-- Paste your token from BotFather inside the quotes
     CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID'      // <-- Paste your Chat ID inside the quotes
   },
   ```
3. Save your script (`Cmd + S` or `Ctrl + S`).
4. Click **`🔄 Update Prices Now`** in your spreadsheet. If any threshold is breached, your Telegram bot will instantly message your phone!

---

## 🟢 Step 5. Setup Hourly 24/7 Automation (Time Triggers)

To keep the tracker running in the background automatically (even when your browser is closed and your computer is asleep):

1. Click: **`⚡ Automation (API Tracker) → ⚙️ Setup Hourly Auto-Trigger`**.
2. The script will programmatically create a Google Cloud time-driven trigger. Every hour, Google's servers will fetch fresh API prices, append records to the History tab, and dispatch notifications if boundaries are exceeded.
3. *Alternative:* You can view and manage triggers manually in the Apps Script editor by clicking the **"Triggers" (alarm clock icon)** on the left sidebar → **"+ Add Trigger"** → selecting `updateCryptoPrices` → Time-driven → Hourly → Every hour.

---

## 💎 How to Present This Portfolio Case to Freelance Clients

When applying to job postings on **Upwork**, **Fiverr**, **Toptal**, or direct client pitches requiring API integration and spreadsheet automation, structure your presentation as follows:

### 1. Focus on Business Outcomes, Not Just Code
> *"I developed an enterprise financial monitoring backend on Google Apps Script that integrates with REST APIs, maintains an audit-ready historical database in Google Sheets, and dispatches real-time multi-channel alerts (Telegram & Email) when custom KPI thresholds are breached. Here is a link to the repository and system architecture..."*

### 2. Record a 60-Second Video Demonstration (High Conversion Rate)
Using Loom or QuickTime, record a quick walkthrough:
1. Show your spreadsheet tabs and click *Update Prices Now* from the custom menu.
2. Highlight the real-time API values populating the cells.
3. Show your phone or desktop screen capturing the instant Telegram notification arriving in real time.
*Clients respond significantly faster to live visual proof of working automation.*

### 3. Highlight Adaptability across Industries
When prospective clients ask: *"Can you adapt this for our company's workflow?"*, explain:
> *"The core backend architecture is modular and API-agnostic. Instead of cryptocurrency prices, I can connect this exact engine to **any REST API**: CRM lead exports (HubSpot, Salesforce), warehouse inventory levels, competitor price scrapers, ad spend tracking from Google/Meta Ads, or banking and ERP endpoints."*
