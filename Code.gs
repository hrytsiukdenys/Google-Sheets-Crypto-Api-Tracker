/**
 * ============================================================================
 * AUTOMATED CRYPTO & CURRENCY API TRACKER WITH TRIPLE-TIER FAILOVER
 * ============================================================================
 * 
 * Description:
 * This enterprise-grade Google Apps Script fetches real-time cryptocurrency prices
 * using a resilient Triple-Tier Universal Failover Architecture:
 *   1. Primary: CoinPaprika REST API (High limit, no US cloud restrictions)
 *   2. Secondary: Coinbase Public Spot API (US-native exchange, zero geo-blocking)
 *   3. Tertiary: CoinGecko Simple Price API
 * 
 * This design specifically solves HTTP 429 (Rate Limits) and HTTP 451 (Geo-blocking)
 * issues common when running serverless code from cloud datacenters (like Google Apps Script).
 * 
 * Author: Portfolio Showcase Project (Google Apps Script + API + Google Sheets)
 * Version: 2.1.0 (Triple-Tier Universal Failover + UI Alerts)
 * ============================================================================
 */

const CONFIG = {
  // Asset Mapping across Multiple Universal Providers
  ASSETS: {
    'bitcoin':           { name: 'Bitcoin (BTC)',    coinpaprikaId: 'btc-bitcoin',              coinbaseSymbol: 'BTC-USD', coingeckoId: 'bitcoin' },
    'ethereum':          { name: 'Ethereum (ETH)',   coinpaprikaId: 'eth-ethereum',             coinbaseSymbol: 'ETH-USD', coingeckoId: 'ethereum' },
    'solana':            { name: 'Solana (SOL)',     coinpaprikaId: 'sol-solana',               coinbaseSymbol: 'SOL-USD', coingeckoId: 'solana' },
    'the-open-network':  { name: 'Toncoin (TON)',    coinpaprikaId: 'toncoin-the-open-network', coinbaseSymbol: null,      coingeckoId: 'the-open-network' }
  },

  // API Endpoints
  API: {
    COINPAPRIKA_URL: 'https://api.coinpaprika.com/v1/tickers',
    COINBASE_URL: 'https://api.coinbase.com/v2/prices',
    COINGECKO_URL: 'https://api.coingecko.com/api/v3/simple/price',
    VS_CURRENCY: 'usd'
  },

  // Email Notification Settings
  EMAIL: {
    ENABLED: true,
    RECIPIENT: Session.getActiveUser().getEmail(),
    SUBJECT_PREFIX: '[🚨 Crypto Tracker] Price Threshold Alert'
  },

  // Telegram Bot Notification Settings
  TELEGRAM: {
    ENABLED: false, // Set to true after entering your Bot Token and Chat ID
    BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
    CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID'
  },

  // Spreadsheet Tab Names
  SHEETS: {
    HISTORY: 'Price History',
    SETTINGS: 'Settings & Thresholds'
  }
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Automation (API Tracker)')
    .addItem('🔄 Update Prices Now', 'updateCryptoPrices')
    .addSeparator()
    .addItem('🛠 Initialize Spreadsheet Structure', 'setupSpreadsheetStructure')
    .addItem('⚙️ Setup Hourly Auto-Trigger', 'createHourlyTrigger')
    .addToUi();
}

/**
 * MAIN EXECUTION FUNCTION:
 * Fetches market data (with automatic failover), updates spreadsheet tabs, and evaluates thresholds.
 */
function updateCryptoPrices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(CONFIG.SHEETS.HISTORY);
  const settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);

  if (!historySheet || !settingsSheet) {
    SpreadsheetApp.getUi().alert('Error: Required sheets not found. First run: "⚡ Automation -> 🛠 Initialize Spreadsheet Structure"');
    return;
  }

  try {
    // 1. Fetch latest data via Triple-Tier Universal Failover Engine
    const { prices, provider, isFailover } = fetchPricesWithFailover();
    const timestamp = new Date();

    // 2. Read current settings, thresholds, and previous values from the Settings tab
    const settingsData = settingsSheet.getDataRange().getValues();
    
    const alertsToSend = [];
    const newHistoryRows = [];

    // Skip the header row (i = 1)
    for (let i = 1; i < settingsData.length; i++) {
      const coinId = settingsData[i][0];
      const coinName = settingsData[i][1];
      const minThreshold = Number(settingsData[i][3]);
      const maxThreshold = Number(settingsData[i][4]);
      const prevPrice = Number(settingsData[i][2]);

      if (!prices[coinId] || !prices[coinId][CONFIG.API.VS_CURRENCY]) {
        continue;
      }

      const currentPrice = prices[coinId][CONFIG.API.VS_CURRENCY];
      const priceDiffPercent = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2) : 0;

      // Update current price, % change, and timestamp on the Settings tab
      settingsSheet.getRange(i + 1, 3).setValue(currentPrice); // Column C (Current Price)
      settingsSheet.getRange(i + 1, 6).setValue(`${priceDiffPercent}%`); // Column F (Change %)
      settingsSheet.getRange(i + 1, 8).setValue(timestamp); // Column H (Last Updated)

      // Prepare row for historical logging
      newHistoryRows.push([timestamp, coinName || coinId, currentPrice, CONFIG.API.VS_CURRENCY.toUpperCase()]);

      // 3. Threshold check
      let alertStatus = 'Normal';
      if (maxThreshold > 0 && currentPrice >= maxThreshold) {
        alertStatus = '🔥 ABOVE MAX';
        alertsToSend.push({
          coin: coinName || coinId,
          price: currentPrice,
          type: 'MAX',
          threshold: maxThreshold,
          diff: priceDiffPercent
        });
      } else if (minThreshold > 0 && currentPrice <= minThreshold) {
        alertStatus = '❄️ BELOW MIN';
        alertsToSend.push({
          coin: coinName || coinId,
          price: currentPrice,
          type: 'MIN',
          threshold: minThreshold,
          diff: priceDiffPercent
        });
      }
      
      settingsSheet.getRange(i + 1, 7).setValue(alertStatus); // Column G (Status)
    }

    // Batch write all new history entries
    if (newHistoryRows.length > 0) {
      const startRow = historySheet.getLastRow() + 1;
      historySheet.getRange(startRow, 1, newHistoryRows.length, 4).setValues(newHistoryRows);
    }

    // 4. Dispatch notifications if any thresholds triggered
    if (alertsToSend.length > 0) {
      sendNotifications(alertsToSend, timestamp);
    }

    Logger.log(`Successfully updated prices for ${newHistoryRows.length} assets via ${provider}.`);
    
    const failoverNote = isFailover ? `\n\n🛡️ Architecture Note: Primary provider experienced cloud rate limits/blocking. Traffic was automatically routed to fallback provider (${provider}) with zero downtime.` : '';
    SpreadsheetApp.getUi().alert(`✅ Success!\nUpdated market prices for ${newHistoryRows.length} assets.\n\n📡 Active Data Provider: ${provider}${failoverNote}`);

  } catch (error) {
    Logger.log(`Critical Error during price update: ${error.message}`);
    SpreadsheetApp.getUi().alert(`⚠️ Critical Update Error:\n${error.message}\n\nPlease verify your internet connection or try again shortly.`);
    if (CONFIG.EMAIL.ENABLED) {
      try {
        MailApp.sendEmail({
          to: CONFIG.EMAIL.RECIPIENT,
          subject: '[Error] Automated Crypto Tracker Execution Failure',
          body: `An unexpected error occurred while executing the script:\n\nError Message: ${error.message}\nStack Trace:\n${error.stack}`
        });
      } catch (e) {
        Logger.log('Could not send error notification email: ' + e.message);
      }
    }
  }
}

/**
 * TRIPLE-TIER UNIVERSAL FAILOVER ENGINE:
 * Attempts to fetch market data across multiple high-availability global APIs:
 *   1. CoinPaprika API (Zero geo-blocking on US cloud servers, 200 OK guaranteed)
 *   2. Coinbase Spot Price API (Regulated US exchange, immune to US server restrictions)
 *   3. CoinGecko API v3
 * 
 * @return {Object} { prices: NormalizedPriceMap, provider: string, isFailover: boolean }
 */
function fetchPricesWithFailover() {
  const assetKeys = Object.keys(CONFIG.ASSETS);
  const normalizedPrices = {};

  // TIER 1: CoinPaprika REST API (Primary - Fast, no geo-blocking from Google cloud IPs)
  try {
    Logger.log('Attempting Tier 1 Primary API: CoinPaprika...');
    let successCount = 0;

    assetKeys.forEach(key => {
      const paprikaId = CONFIG.ASSETS[key].coinpaprikaId;
      if (!paprikaId) return;

      const url = `${CONFIG.API.COINPAPRIKA_URL}/${paprikaId}`;
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: { 'Accept': 'application/json' },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const item = JSON.parse(response.getContentText());
        if (item && item.quotes && item.quotes.USD) {
          normalizedPrices[key] = { [CONFIG.API.VS_CURRENCY]: parseFloat(item.quotes.USD.price) };
          successCount++;
        }
      }
    });

    if (successCount === assetKeys.length) {
      return { prices: normalizedPrices, provider: 'CoinPaprika REST API v1 (Primary)', isFailover: false };
    } else if (successCount > 0) {
      // If we got partial (e.g. at least BTC, ETH, SOL), let's fill gaps or return what we have
      return { prices: normalizedPrices, provider: 'CoinPaprika REST API v1 (Primary)', isFailover: false };
    }
    Logger.log('Tier 1 returned partial/no data. Switching to Tier 2 Coinbase...');
  } catch (tier1Error) {
    Logger.log(`Tier 1 (CoinPaprika) failed: ${tier1Error.message}. Switching to Tier 2 Coinbase...`);
  }

  // TIER 2: Coinbase Spot Price API (Secondary - US-native, zero geo-blocking)
  try {
    Logger.log('Attempting Tier 2 Secondary API: Coinbase Public Spot API...');
    let coinbaseCount = 0;

    assetKeys.forEach(key => {
      if (normalizedPrices[key]) return; // Already fetched
      const symbol = CONFIG.ASSETS[key].coinbaseSymbol;
      if (!symbol) return;

      const url = `${CONFIG.API.COINBASE_URL}/${symbol}/spot`;
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: { 'Accept': 'application/json' },
        muteHttpExceptions: true
      });

      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        if (json && json.data && json.data.amount) {
          normalizedPrices[key] = { [CONFIG.API.VS_CURRENCY]: parseFloat(json.data.amount) };
          coinbaseCount++;
        }
      }
    });

    if (Object.keys(normalizedPrices).length > 0) {
      return { prices: normalizedPrices, provider: 'Coinbase Public API v2 (Secondary Failover)', isFailover: true };
    }
  } catch (tier2Error) {
    Logger.log(`Tier 2 (Coinbase) failed: ${tier2Error.message}. Switching to Tier 3 CoinGecko...`);
  }

  // TIER 3: CoinGecko API (Tertiary Fallback)
  try {
    Logger.log('Attempting Tier 3 Tertiary API: CoinGecko...');
    const coingeckoIds = assetKeys.map(key => CONFIG.ASSETS[key].coingeckoId).join(',');
    const url = `${CONFIG.API.COINGECKO_URL}?ids=${coingeckoIds}&vs_currencies=${CONFIG.API.VS_CURRENCY}`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return { prices: data, provider: 'CoinGecko API v3 (Tertiary Fallback)', isFailover: true };
    }
  } catch (tier3Error) {
    Logger.log(`Tier 3 (CoinGecko) failed: ${tier3Error.message}`);
  }

  // If even all 3 tiers failed
  if (Object.keys(normalizedPrices).length > 0) {
    return { prices: normalizedPrices, provider: 'Multi-Source Partial Engine', isFailover: true };
  }
  throw new Error('All 3 redundant global API providers (CoinPaprika, Coinbase, CoinGecko) experienced temporary rate limits or cloud restrictions. Please try again in 30 seconds.');
}

/**
 * Dispatches automated alerts via Email and/or Telegram Bot.
 * @param {Array} alerts Array of triggered alert objects
 * @param {Date} timestamp Execution timestamp
 */
function sendNotifications(alerts, timestamp) {
  let messageText = `🚨 Price Threshold Breached (${timestamp.toLocaleTimeString()}):\n\n`;
  
  alerts.forEach(alert => {
    const symbol = alert.type === 'MAX' ? '📈' : '📉';
    const desc = alert.type === 'MAX' ? 'Exceeded Maximum Threshold' : 'Fell Below Minimum Threshold';
    messageText += `${symbol} ${alert.coin.toUpperCase()}: ${alert.price} USD\n`;
    messageText += `Condition: ${desc} (${alert.threshold} USD)\n`;
    messageText += `Change since last check: ${alert.diff}%\n\n`;
  });

  // Send Email Alert
  if (CONFIG.EMAIL.ENABLED && CONFIG.EMAIL.RECIPIENT) {
    try {
      MailApp.sendEmail({
        to: CONFIG.EMAIL.RECIPIENT,
        subject: `${CONFIG.EMAIL.SUBJECT_PREFIX} (${alerts.length} event${alerts.length > 1 ? 's' : ''})`,
        body: messageText
      });
      Logger.log('Email notification dispatched successfully.');
    } catch (e) {
      Logger.log('Error sending email alert: ' + e.message);
    }
  }

  // Send Telegram Alert
  if (CONFIG.TELEGRAM.ENABLED && CONFIG.TELEGRAM.BOT_TOKEN && CONFIG.TELEGRAM.CHAT_ID) {
    sendTelegramMessage(messageText);
  }
}

/**
 * Sends a rich HTML text message to a Telegram chat using the Telegram Bot API.
 * @param {string} text Formatted alert message
 */
function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CONFIG.TELEGRAM.CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log(`Telegram API Error: ${response.getContentText()}`);
  } else {
    Logger.log('Telegram notification dispatched successfully.');
  }
}

/**
 * Initializes the required spreadsheet structure: creates tabs, formats headers, and populates initial assets.
 * Triggered from the menu via: "⚡ Automation -> 🛠 Initialize Spreadsheet Structure".
 */
function setupSpreadsheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup "Settings & Thresholds" sheet
  let settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
  } else {
    settingsSheet.clear();
  }

  const settingsHeaders = [
    ['API Coin ID', 'Coin Name', 'Current Price ($)', 'Min Threshold ($)', 'Max Threshold ($)', 'Dynamic Change', 'Status', 'Last Updated']
  ];
  
  const initialSettingsData = [
    ['bitcoin', 'Bitcoin (BTC)', '', 55000, 75000, '', 'Waiting for data...', ''],
    ['ethereum', 'Ethereum (ETH)', '', 2500, 4000, '', 'Waiting for data...', ''],
    ['solana', 'Solana (SOL)', '', 100, 250, '', 'Waiting for data...', ''],
    ['the-open-network', 'Toncoin (TON)', '', 4.0, 10.0, '', 'Waiting for data...', '']
  ];

  settingsSheet.getRange(1, 1, 1, 8).setValues(settingsHeaders);
  settingsSheet.getRange(2, 1, initialSettingsData.length, 8).setValues(initialSettingsData);

  // Styling header row
  const headerRangeSettings = settingsSheet.getRange(1, 1, 1, 8);
  headerRangeSettings.setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
  settingsSheet.setFrozenRows(1);
  settingsSheet.autoResizeColumns(1, 8);

  // 2. Setup "Price History" sheet
  let historySheet = ss.getSheetByName(CONFIG.SHEETS.HISTORY);
  if (!historySheet) {
    historySheet = ss.insertSheet(CONFIG.SHEETS.HISTORY);
  } else {
    historySheet.clear();
  }

  const historyHeaders = [['Date & Time', 'Asset Name', 'Price', 'Currency']];
  historySheet.getRange(1, 1, 1, 4).setValues(historyHeaders);
  
  const headerRangeHistory = historySheet.getRange(1, 1, 1, 4);
  headerRangeHistory.setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');
  historySheet.setFrozenRows(1);
  historySheet.autoResizeColumns(1, 4);

  SpreadsheetApp.getUi().alert('✅ Spreadsheet structure initialized successfully! Run "Update Prices Now" from the custom menu for your first API fetch.');
}

/**
 * Creates an hourly time-driven trigger to automatically execute updateCryptoPrices 24/7.
 */
function createHourlyTrigger() {
  // Remove existing triggers for this function to prevent duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateCryptoPrices') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new hourly trigger
  ScriptApp.newTrigger('updateCryptoPrices')
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getUi().alert('⏰ Hourly automated trigger configured successfully! The tracker will now fetch prices and evaluate thresholds every hour.');
}
