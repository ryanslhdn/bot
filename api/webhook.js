
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
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await r.json();

  if (!result.ok) {
    throw new Error(result.description);
  }

  return result.result;
}

// ===================================
// HTML ESCAPE
// ===================================

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
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
// BACK MENU + COPY BUTTON
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

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.*)$/);

    if (match) {
      data[match[1].trim().toLowerCase()] =
        match[2].trim();
    }
  }

  return {
    name: data.nama || data.panel || "",
    website: data.website || "",
    email: data.email || "",
    username: data.username || "",
    password: data.password || ""
  };
}

// ===================================
// VALIDATE ACCOUNT
// ===================================

function validAccount(a) {
  if (!a.name) {
    return "Nama panel wajib diisi.";
  }

  if (a.website) {
    try {
      const u = new URL(a.website);

      if (!["http:", "https:"].includes(u.protocol)) {
        return "Website harus menggunakan HTTP atau HTTPS.";
      }
    } catch {
      return "Alamat website tidak valid.";
    }
  }

  if (!a.website && !a.email && !a.username && !a.password) {
    return "Isi minimal satu data akun.";
  }

  return null;
}

// ===================================
// CHANNEL BUTTONS
// ===================================

function accountButtons(a) {
  const rows = [];

  if (a.website) {
    rows.push([
      {
        text: "🌐 OPEN WEBSITE",
        url: a.website
      }
    ]);
  }

  if (a.email) {
    rows.push([
      {
        text: "📋 COPY EMAIL",
        copy_text: {
          text: a.email
        }
      }
    ]);
  }

  if (a.username) {
    rows.push([
      {
        text: "👤 COPY USERNAME",
        copy_text: {
          text: a.username
        }
      }
    ]);
  }

  if (a.password) {
    rows.push([
      {
        text: "🔑 COPY PASSWORD",
        copy_text: {
          text: a.password
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

function accountMessage(a) {
  let s = `🔐 <b>${esc(a.name)}</b>\n`;

  s += `━━━━━━━━━━━━━━━━━━\n`;

  if (a.website) {
    s += `🌐 Website: ${esc(a.website)}\n`;
  }

  if (a.email) {
    s += `📧 Email: ${esc(a.email)}\n`;
  }

  if (a.username) {
    s += `👤 Username: ${esc(a.username)}\n`;
  }

  if (a.password) {
    s += `🔑 Password: ${esc(a.password)}\n`;
  }

  s += `━━━━━━━━━━━━━━━━━━\n`;
  s += `<i>ACCOUNT PANEL SMS</i>`;

  return s;
}

// ===================================
// EDIT EXISTING MESSAGE
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
    `Manage your SMS panel accounts easily.\n\n` +
    `Select a menu below to continue.`;

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
// WEBHOOK HANDLER
// ===================================

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(200).send(
      "ACCOUNT PANEL SMS ONLINE"
    );
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET) {
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

    // ===================================
    // BUTTON HANDLER
    // ===================================

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
        await tg("sendMessage", {
          chat_id: chatId,
          text: "⛔ Access denied. Admin only."
        });

        return res.status(200).send("OK");
      }

      // BACK TO MENU

      if (action === "menu") {
        await showMenu(
          chatId,
          q.from.first_name,
          messageId
        );
      }

      // ADD NEW ACCOUNT

      else if (action === "add") {
        await renderPage(
          chatId,
          messageId,

          "➕ <b>ADD NEW ACCOUNT</b>\n\n" +
          "Silakan tekan tombol COPY INPUT FORMAT untuk menyalin format akun.\n\n" +
          `<pre>${esc(TEMPLATE)}</pre>\n\n` +
          "Isi data akun, lalu kirim kembali ke bot.",

          backMenu()
        );
      }

      // INPUT FORMAT

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

      // CHANNEL INFO

      else if (action === "channel") {
        await renderPage(
          chatId,
          messageId,

          "📢 <b>CHANNEL INFORMATION</b>\n\n" +
          "Channel ID: <code>" +
          esc(CHANNEL_ID || "Belum diatur") +
          "</code>\n\n" +
          "Posting akun akan dikirim otomatis ke channel tujuan.",

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

      // HELP & GUIDE

      else if (action === "help") {
        await renderPage(
          chatId,
          messageId,

          "❓ <b>HELP & GUIDE</b>\n\n" +
          "1. Pilih ADD NEW ACCOUNT.\n" +
          "2. Tekan COPY INPUT FORMAT.\n" +
          "3. Isi data akun.\n" +
          "4. Kirim formulir ke bot.\n" +
          "5. Bot otomatis memposting ke channel.\n\n" +
          "Pastikan data akun sudah benar sebelum dikirim.",

          backMenu()
        );
      }

      return res.status(200).send("OK");
    }

    // ===================================
    // MESSAGE HANDLER
    // ===================================

    const msg = update.message;

    if (!msg || !msg.text || !msg.from) {
      return res.status(200).send("OK");
    }

    const userId = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // ADMIN CHECK

    if (!ADMIN_IDS.includes(userId)) {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⛔ You are not authorized to use this bot."
      });

      return res.status(200).send("OK");
    }

    // START COMMAND

    if (text === "/start") {
      await showMenu(
        chatId,
        msg.from.first_name
      );

      return res.status(200).send("OK");
    }

    // RECEIVE ACCOUNT FORM

    if (/^(nama|panel)\s*:/im.test(text)) {
      const account = parseAccount(text);
      const error = validAccount(account);

      if (error) {
        await tg("sendMessage", {
          chat_id: chatId,
          text:
            "⚠️ " + error +
            "\n\nSilakan perbaiki formulir dan kirim ulang."
        });

        return res.status(200).send("OK");
      }

      if (!CHANNEL_ID) {
        throw new Error("CHANNEL_ID belum diatur.");
      }

      await tg("sendMessage", {
        chat_id: chatId,
        text: "⏳ Memproses akun..."
      });

      // POST TO CHANNEL

      await tg("sendMessage", {
        chat_id: CHANNEL_ID,
        text: accountMessage(account),
        parse_mode: "HTML",
        reply_markup: accountButtons(account)
      });

      // SUCCESS MESSAGE

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

    // OTHER MESSAGE

    await showMenu(
      chatId,
      msg.from.first_name
    );

    return res.status(200).send("OK");

  } catch (error) {
    // Do not log account credentials.
    return res.status(200).send("OK");
  }
};
