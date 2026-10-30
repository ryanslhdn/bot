
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ===================================
// TELEGRAM API
// ===================================

async function tg(method, data) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Telegram API error");
  }

  return result.result;
}

// ===================================
// HTML ESCAPE
// ===================================

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ===================================
// ACCOUNT TEMPLATE
// ===================================

const TEMPLATE =
`Nama:
Website:
Email:
Username:
Password:`;

// ===================================
// MAIN MENU
// ===================================

function mainMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: "➕ ADD NEW ACCOUNT",
          callback_data: "add"
        }
      ],
      [
        {
          text: "📋 INPUT FORMAT",
          callback_data: "format"
        },
        {
          text: "📢 CHANNEL INFO",
          callback_data: "channel"
        }
      ],
      [
        {
          text: "❓ HELP & GUIDE",
          callback_data: "help"
        }
      ]
    ]
  };
}

// ===================================
// BACK MENU
// ===================================

function backMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: "📋 COPY INPUT FORMAT",
          copy_text: {
            text: TEMPLATE
          }
        }
      ],
      [
        {
          text: "⬅️ BACK TO MENU",
          callback_data: "menu"
        }
      ]
    ]
  };
}

// ===================================
// PARSE ACCOUNT
// ===================================

function parseAccount(text) {
  const data = {};

  const aliases = {
    nama: "name",
    panel: "name",
    website: "website",
    email: "email",
    username: "username",
    password: "password"
  };

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(
      /^\s*([^:]+)\s*:\s*(.*)$/
    );

    if (!match) continue;

    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();

    if (aliases[key]) {
      data[aliases[key]] = value;
    }
  }

  return {
    name: data.name || "",
    website: data.website || "",
    email: data.email || "",
    username: data.username || "",
    password: data.password || ""
  };
}

// ===================================
// VALIDATE ACCOUNT
// ===================================

function validAccount(account) {
  if (!account.name) {
    return "Nama panel wajib diisi.";
  }

  if (account.website) {
    try {
      const url = new URL(account.website);

      if (!["http:", "https:"].includes(url.protocol)) {
        return "Website harus menggunakan HTTP atau HTTPS.";
      }
    } catch {
      return "Alamat website tidak valid.";
    }
  }

  if (
    !account.website &&
    !account.email &&
    !account.username &&
    !account.password
  ) {
    return "Isi minimal satu data akun.";
  }

  return null;
}

// ===================================
// CHANNEL BUTTONS
// ===================================

function accountButtons(account) {
  const rows = [];

  if (account.website) {
    rows.push([
      {
        text: "🌐 OPEN WEBSITE",
        url: account.website
      }
    ]);
  }

  if (account.email) {
    rows.push([
      {
        text: "📋 COPY EMAIL",
        copy_text: {
          text: account.email
        }
      }
    ]);
  }

  if (account.username) {
    rows.push([
      {
        text: "👤 COPY USERNAME",
        copy_text: {
          text: account.username
        }
      }
    ]);
  }

  if (account.password) {
    rows.push([
      {
        text: "🔑 COPY PASSWORD",
        copy_text: {
          text: account.password
        }
      }
    ]);
  }

  return {
    inline_keyboard: rows
  };
}

// ===================================
// ACCOUNT MESSAGE
// ===================================

function accountMessage(account) {
  let message = `🔐 <b>${esc(account.name)}</b>\n`;

  message += "━━━━━━━━━━━━━━━━━━\n";

  if (account.website) {
    message += `🌐 Website: ${esc(account.website)}\n`;
  }

  if (account.email) {
    message += `📧 Email: ${esc(account.email)}\n`;
  }

  if (account.username) {
    message += `👤 Username: ${esc(account.username)}\n`;
  }

  if (account.password) {
    message += `🔑 Password: ${esc(account.password)}\n`;
  }

  message += "━━━━━━━━━━━━━━━━━━\n";
  message += "<i>ACCOUNT PANEL SMS</i>";

  return message;
}

// ===================================
// EDIT MENU MESSAGE
// ===================================

async function renderPage(
  chatId,
  messageId,
  text,
  keyboard
) {
  return tg("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard
  });
}

// ===================================
// SHOW MAIN MENU
// ===================================

async function showMenu(
  chatId,
  name,
  messageId = null
) {
  const text =
    `👋 <b>WELCOME TO ACCOUNT PANEL SMS</b>\n\n` +
    `Hello, ${esc(name)}!\n\n` +
    "Manage your SMS panel accounts easily.\n\n" +
    "Select a menu below to continue.";

  if (messageId) {
    return renderPage(
      chatId,
      messageId,
      text,
      mainMenu()
    );
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: mainMenu()
  });
}

// ===================================
// SEND ERROR MESSAGE
// ===================================

async function sendError(chatId, message) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "⚠️ " + message
  });
}

// ===================================
// WEBHOOK
// ===================================

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(200).send(
      "ACCOUNT PANEL SMS ONLINE"
    );
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET || !CHANNEL_ID) {
    return res.status(500).send(
      "Configuration missing"
    );
  }

  if (
    req.headers["x-telegram-bot-api-secret-token"] !==
    WEBHOOK_SECRET
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const update = req.body;

    // =================================
    // BUTTON HANDLER
    // =================================

    if (update.callback_query) {
      const q = update.callback_query;

      const userId = String(q.from.id);
      const chatId = q.message.chat.id;
      const messageId = q.message.message_id;
      const action = q.data;

      await tg("answerCallbackQuery", {
        callback_query_id: q.id
      });

      if (!ADMIN_IDS.includes(userId)) {
        await sendError(
          chatId,
          "Access denied. Admin only."
        );

        return res.status(200).send("OK");
      }

      if (action === "menu") {
        await showMenu(
          chatId,
          q.from.first_name,
          messageId
        );
      }

      else if (action === "add") {
        await renderPage(
          chatId,
          messageId,

          "➕ <b>ADD NEW ACCOUNT</b>\n\n" +
          "Tekan tombol COPY INPUT FORMAT untuk menyalin formulir.\n\n" +
          `<pre>${esc(TEMPLATE)}</pre>\n\n` +
          "Isi data lalu kirim kembali ke bot.",

          backMenu()
        );
      }

      else if (action === "format") {
        await renderPage(
          chatId,
          messageId,

          "📋 <b>ACCOUNT INPUT FORMAT</b>\n\n" +
          `<pre>${esc(TEMPLATE)}</pre>\n\n` +
          "Tekan tombol di bawah untuk menyalin format.",

          backMenu()
        );
      }

      else if (action === "channel") {
        await renderPage(
          chatId,
          messageId,

          "📢 <b>CHANNEL INFORMATION</b>\n\n" +
          "Channel ID: <code>" +
          esc(CHANNEL_ID) +
          "</code>\n\n" +
          "Akun akan diposting otomatis ke channel tujuan.",

          {
            inline_keyboard: [
              [
                {
                  text: "⬅️ BACK TO MENU",
                  callback_data: "menu"
                }
              ]
            ]
          }
        );
      }

      else if (action === "help") {
        await renderPage(
          chatId,
          messageId,

          "❓ <b>HELP & GUIDE</b>\n\n" +
          "1. Pilih ADD NEW ACCOUNT.\n" +
          "2. Salin format akun.\n" +
          "3. Isi data akun.\n" +
          "4. Kirim formulir ke bot.\n" +
          "5. Bot memposting akun ke channel.\n\n" +
          "Pastikan data akun sudah benar.",

          backMenu()
        );
      }

      return res.status(200).send("OK");
    }

    // =================================
    // MESSAGE HANDLER
    // =================================

    const msg = update.message;

    if (!msg || !msg.text || !msg.from) {
      return res.status(200).send("OK");
    }

    const userId = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // =================================
    // ADMIN CHECK
    // =================================

    if (!ADMIN_IDS.includes(userId)) {
      await sendError(
        chatId,
        "You are not authorized to use this bot."
      );

      return res.status(200).send("OK");
    }

    // =================================
    // START COMMAND
    // =================================

    if (text === "/start" || text === "/start@YourBotUsername") {
      await showMenu(
        chatId,
        msg.from.first_name
      );

      return res.status(200).send("OK");
    }

    // =================================
    // DETECT ACCOUNT FORM
    // =================================

    const isAccountForm =
      /^\s*(nama|panel)\s*:/im.test(text);

    if (isAccountForm) {

      const account = parseAccount(text);
      const error = validAccount(account);

      if (error) {
        await sendError(
          chatId,
          error + "\nSilakan perbaiki formulir."
        );

        return res.status(200).send("OK");
      }

      // PROCESSING

      await tg("sendMessage", {
        chat_id: chatId,
        text: "⏳ Memproses akun..."
      });

      // POST TO CHANNEL

      const posted = await tg("sendMessage", {
        chat_id: CHANNEL_ID,
        text: accountMessage(account),
        parse_mode: "HTML",
        reply_markup: accountButtons(account)
      });

      // SUCCESS

      await tg("sendMessage", {
        chat_id: chatId,

        text:
          "✅ <b>ACCOUNT SUCCESSFULLY POSTED!</b>\n\n" +
          "Panel: " + esc(account.name) +
          "\n\nAkun berhasil dikirim ke channel.",

        parse_mode: "HTML",
        reply_markup: mainMenu()
      });

      return res.status(200).send("OK");
    }

    // =================================
    // UNKNOWN MESSAGE
    // =================================

    await sendError(
      chatId,
      "Format pesan tidak dikenali.\n\n" +
      "Silakan gunakan format berikut:\n\n" +
      `<pre>${esc(TEMPLATE)}</pre>`
    );

    return res.status(200).send("OK");

  } catch (error) {

    // Log error message only, never account data.
    console.error("BOT ERROR:", error.message);

    try {
      const msg = req.body?.message;

      if (msg?.chat?.id) {
        await tg("sendMessage", {
          chat_id: msg.chat.id,
          text:
            "❌ <b>GAGAL MEMPROSES AKUN</b>\n\n" +
            "Terjadi kesalahan saat memproses permintaan.\n" +
            "Periksa konfigurasi bot dan izin channel.",
          parse_mode: "HTML"
        });
      }
    } catch (_) {
      // Avoid exposing credentials or internal errors.
    }

    return res.status(200).send("OK");
  }
};
