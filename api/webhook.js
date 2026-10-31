"use strict";

// ===================================
// CONFIGURATION
// ===================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const DIRECTORY_CHANNEL_ID = process.env.DIRECTORY_CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ===================================
// TELEGRAM API CLIENT
// ===================================

async function tg(method, data) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || `Telegram API error (${method})`);
  }

  return result.result;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ===================================
// TEXT HELPERS
// ===================================

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function truncate(value, max) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
// DIRECTORY DATA
// ===================================

const SECTIONS = {
  panels: {
    emoji: "🌐",
    title: "SMS PANEL DIRECTORY",
    perChunk: 10,
    perPage: 5
  },
  managers: {
    emoji: "📞",
    title: "OTHER MANAGER CONTACTS",
    perChunk: 10,
    perPage: 5
  },
  others: {
    emoji: "🔗",
    title: "OTHER SMS PANELS",
    perChunk: 10,
    perPage: 5
  }
};

const DIRECTORY = {
  panels: [
    { name: "ZEBRA SMS", website: "https://zebrasms.com", contacts: ["@Zebra_Sms_Support_Admin"] },
    { name: "PURPLE SMS", website: "https://www.purple-numbers.com", contacts: ["hemant98jangir@outlook.com"] },
    { name: "ZENTO SMS", website: "http://54.38.176.48/ints/login", contacts: ["+92 341 7050755"] },
    { name: "GREEN SMS", website: "http://143.110.245.86/accounts/login", contacts: ["+966 536947831"] },
    { name: "METEORITE SMS", website: "http://217.23.5.21/ints/", contacts: ["+998 97 078 2635"] },
    { name: "WOLF SMS", website: "http://213.32.24.208/ints/login", contacts: ["+44 7490312808"] },
    { name: "PROTON SMS", website: "http://109.236.84.81/ints/login", contacts: ["+20 15 54067100", "+20 1273010344", "+20 1080661773"] },
    { name: "SHARK SMS", website: "https://sharksms.org", contacts: ["+44 7946 201328"] },
    { name: "IMS SMS", website: "https://imssms.org", contacts: ["+44 7361 600181", "+964 7806228904", "+44 7414 656797"] },
    { name: "MY SMS", website: "https://www.mysmsportal.com", contacts: ["+44 7960 315249"] },
    { name: "REZ SMS", website: "https://rezsms.org", contacts: ["+959662868823", "+2349069421575"] },
    { name: "KSI SMS", website: "https://ksiiprn.com", contacts: ["@KSISMSIPRN"] },
    { name: "BIRD SMS", website: "https://birdsms.com", contacts: ["@birdsms_support"] },
    { name: "SEVEN1TEL", website: "https://sevenonetel.com", contacts: ["sup.seven1tel@outlook.com"] },
    { name: "HADI SMS", website: "http://smshadi.net", contacts: ["smshaneenstar@outlook.com"] },
    { name: "MAIT SMS", website: "https://masdaralkon.com", contacts: ["+966 564937674", "+44 7781 563955", "support@masdaralkon.com"] },
    { name: "TEMPNUMBERS", website: "https://tempnumbers.net", contacts: ["+447830771120", "+447411201073"] },
    { name: "TEMPSMS", website: "https://tempsms.io", contacts: ["tempsmsservice@outlook.com"] },
    { name: "MARKOISMS", website: "http://51.75.144.178/ints/login", contacts: ["support@markoitech.com"] },
    { name: "FLEX SMS", website: "http://168.119.13.175/ints/", contacts: ["+447828716066"] }
  ],

  managers: [
    { name: "GAZA", contacts: ["support@gazaiprn.com"] },
    { name: "TIME SMS", contacts: ["+44 7346 451813", "+44 7769 572231"] },
    { name: "UNITED SMS", contacts: ["+1 725 224 8326"] },
    { name: "ZK SMS", contacts: ["+213 666 829991"] },
    { name: "BOLT SMS", contacts: ["+972 56 711 4351"] },
    { name: "TRUE SMS", contacts: ["+972 598717597"] },
    { name: "FLY SMS", contacts: ["+32 467 648854", "+44 7848 194502", "+44 7853 871505"] },
    { name: "ZIVA SMS", contacts: ["+90 544 299 4611"] },
    { name: "CODNI SMS", contacts: ["+970 566 180 193", "+970 566 180 195"] },
    { name: "ROXY SMS", contacts: ["+970 566 180 193", "+44 7418315957", "roxysms24@gmail.com"] },
    { name: "NUMBER PANEL", contacts: ["+44 7411 201073"] },
    { name: "SHADOW PANEL", contacts: ["+44 7445 501417"] },
    { name: "SNIPER SMS", contacts: ["+20 10 92057548"] },
    { name: "ZEROX SMS", contacts: ["info@zeroxxsms.org", "+44 7865029442"] },
    { name: "KM CARRIER SMS", contacts: ["support@kmcarrier.com"] },
    { name: "BASHA SMS", contacts: [] },
    { name: "MSI SMS", contacts: ["+44 7723151172", "+44 7853286619", "+44 7412807922"] },
    { name: "FLYN SMS", contacts: ["+20 12 25812243"] },
    { name: "IPRN TEL SMS", contacts: ["support@iprntel.com"] },
    { name: "SMS GEN PANEL", contacts: ["abir@smsgen.net"] },
    { name: "SQUAD PANEL SMS", contacts: ["+971 55 654 2130"] },
    { name: "MEDIATEL TEAMS", contacts: ["wilsem@mediatel.com"] },
    { name: "ORANGE TEAMS", contacts: ["orange.carrier@hotmail.com"] },
    { name: "SMS STATE", contacts: ["issac@emrako.com"] },
    { name: "SNAP SMS", contacts: ["+44 7781 550721"] },
    { name: "PREMIUMY SMS TEAM", contacts: ["support-sms@premiumy.net"] },
    { name: "AXIONEL SMS", contacts: ["+383 43861936"] },
    { name: "SL SMS", contacts: ["+92 301 5987900"] },
    { name: "ATXVOICE SMS", contacts: ["+44 7488845393", "hello@atxvoice.com"] },
    { name: "PENSTARZ IPRN SMS", contacts: ["+1 928 255 1909"] }
  ],

  others: [
    { name: "SMS LAPUS", website: "http://143.246.43.181/ints/login" },
    { name: "SMS ITS", website: "http://51.77.132.62/ints/login" },
    { name: "PREMIUM SMS NUMBERS", website: "http://148.72.153.186/sms/" },
    { name: "SMS SQUAD", website: "http://51.77.221.209/ints/login" },
    { name: "SNIPER SMS", website: "http://135.125.222.224/ints/login" },
    { name: "LAMIX", website: "https://panel.lamix.org" },
    { name: "TELEROUTEX", website: "https://teleroutex.com" },
    { name: "SMS NODE", website: "https://smsnode.app" },
    { name: "METEORITE INFO", website: "https://meteoriteinfo.com" }
  ]
};

// ===================================
// DIRECTORY TEXT BUILDERS
// ===================================

function entryText(entry, number) {
  let text = `<b>${number}. ${esc(entry.name)}</b>\n`;

  if (entry.website) {
    text += `🌐 ${esc(entry.website)}\n`;
  }

  for (const contact of entry.contacts || []) {
    text += `📞 ${esc(contact)}\n`;
  }

  return text;
}

function entryButtons(entry) {
  const rows = [];

  if (entry.website) {
    rows.push([
      {
        text: `🌐 ${truncate(entry.name, 50)}`,
        url: entry.website
      }
    ]);
  }

  const contacts = entry.contacts || [];

  if (contacts.length === 0 && entry.website) {
    rows.push([
      {
        text: "📋 COPY LINK",
        copy_text: { text: entry.website }
      }
    ]);
  }

  for (const contact of contacts) {
    rows.push([
      {
        text: `📋 ${truncate(contact, 55)}`,
        copy_text: { text: contact }
      }
    ]);
  }

  return rows;
}

function directoryText() {
  const total =
    DIRECTORY.panels.length +
    DIRECTORY.managers.length +
    DIRECTORY.others.length;

  return (
    "🗂 <b>SMS PANEL DIRECTORY</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `Total <b>${total}</b> entri tersedia.\n\n` +
    "Pilih kategori di bawah ini 👇"
  );
}

function directoryMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: `🌐 SMS PANELS (${DIRECTORY.panels.length})`,
          callback_data: "dsec:panels:0"
        }
      ],
      [
        {
          text: `📞 MANAGER CONTACTS (${DIRECTORY.managers.length})`,
          callback_data: "dsec:managers:0"
        }
      ],
      [
        {
          text: `🔗 OTHER PANELS (${DIRECTORY.others.length})`,
          callback_data: "dsec:others:0"
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

function buildDirectoryPage(sectionKey, page) {
  const section = SECTIONS[sectionKey];
  const entries = DIRECTORY[sectionKey];
  const perPage = section.perPage;
  const totalPages = Math.max(1, Math.ceil(entries.length / perPage));

  page = Number.isFinite(page) ? page : 0;
  page = Math.min(Math.max(0, page), totalPages - 1);

  const start = page * perPage;
  const slice = entries.slice(start, start + perPage);
  const buttons = [];

  let text =
    `${section.emoji} <b>${section.title}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `<i>Halaman ${page + 1} / ${totalPages} • ${entries.length} entri</i>\n\n`;

  slice.forEach((entry, index) => {
    text += entryText(entry, start + index + 1) + "\n";
    buttons.push(...entryButtons(entry));
  });

  const nav = [];

  if (page > 0) {
    nav.push({
      text: "⬅️ PREV",
      callback_data: `dsec:${sectionKey}:${page - 1}`
    });
  }

  if (page < totalPages - 1) {
    nav.push({
      text: "NEXT ➡️",
      callback_data: `dsec:${sectionKey}:${page + 1}`
    });
  }

  if (nav.length) buttons.push(nav);

  buttons.push([
    {
      text: "⬅️ BACK TO DIRECTORY",
      callback_data: "dir"
    }
  ]);

  return {
    text,
    keyboard: { inline_keyboard: buttons }
  };
}

function buildDirectoryChunks(sectionKey) {
  const section = SECTIONS[sectionKey];
  const entries = DIRECTORY[sectionKey];
  const chunks = [];

  for (let start = 0; start < entries.length; start += section.perChunk) {
    const slice = entries.slice(start, start + section.perChunk);
    const end = start + slice.length;
    const buttons = [];

    let text =
      `${section.emoji} <b>${section.title}</b>\n` +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      `<i>${start + 1} – ${end} of ${entries.length}</i>\n\n`;

    slice.forEach((entry, index) => {
      text += entryText(entry, start + index + 1) + "\n";
      buttons.push(...entryButtons(entry));
    });

    chunks.push({
      text: text.trim(),
      buttons
    });
  }

  return chunks;
}

// ===================================
// PUBLISH DIRECTORY
// ===================================

async function publishDirectory() {
  if (!DIRECTORY_CHANNEL_ID) {
    throw new Error("DIRECTORY_CHANNEL_ID belum dikonfigurasi.");
  }

  await tg("sendMessage", {
    chat_id: DIRECTORY_CHANNEL_ID,
    text:
      "📋 <b>SMS PANEL DIRECTORY</b>\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🌐 Daftar panel SMS, manager contact, dan panel lainnya.\n\n" +
      "📌 Tekan tombol 🌐 untuk membuka website.\n" +
      "📌 Tekan tombol 📋 untuk menyalin kontak / link.",
    parse_mode: "HTML"
  });

  await sleep(400);

  let count = 0;

  for (const key of ["panels", "managers", "others"]) {
    for (const chunk of buildDirectoryChunks(key)) {
      await tg("sendMessage", {
        chat_id: DIRECTORY_CHANNEL_ID,
        text: chunk.text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: chunk.buttons }
      });

      count++;
      await sleep(400);
    }
  }

  return count;
}

function publishConfirmText() {
  const total =
    DIRECTORY.panels.length +
    DIRECTORY.managers.length +
    DIRECTORY.others.length;

  return (
    "🚀 <b>PUBLISH DIRECTORY</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `Bot akan mengirim <b>${total}</b> entri directory ke channel:\n` +
    `<code>${esc(DIRECTORY_CHANNEL_ID || "-")}</code>\n\n` +
    "Pastikan bot sudah menjadi admin di channel tersebut.\n\n" +
    "Lanjutkan?"
  );
}

function publishConfirmMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ YES, PUBLISH NOW",
          callback_data: "publish_run"
        }
      ],
      [
        {
          text: "⬅️ CANCEL",
          callback_data: "menu"
        }
      ]
    ]
  };
}

// ===================================
// MENUS
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
          text: "🗂 DIRECTORY",
          callback_data: "dir"
        },
        {
          text: "📋 INPUT FORMAT",
          callback_data: "format"
        }
      ],
      [
        {
          text: "📢 CHANNEL INFO",
          callback_data: "channel"
        },
        {
          text: "❓ HELP & GUIDE",
          callback_data: "help"
        }
      ],
      [
        {
          text: "🚀 PUBLISH DIRECTORY",
          callback_data: "publish"
        }
      ]
    ]
  };
}

function backMenu() {
  return {
    inline_keyboard: [
      [
        {
          text: "📋 COPY INPUT FORMAT",
          copy_text: { text: TEMPLATE }
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

function backToMenu() {
  return {
    inline_keyboard: [
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
// ACCOUNT PARSER & VALIDATOR
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
    const match = line.match(/^\s*([^:]+)\s*:\s*(.*)$/);
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
// ACCOUNT MESSAGE & BUTTONS
// ===================================

function accountMessage(account) {
  let message = `🔐 <b>${esc(account.name)}</b>\n`;
  message += "━━━━━━━━━━━━━━━━━━━━\n";

  if (account.website) {
    message += `🌐 <b>Website</b>: ${esc(account.website)}\n`;
  }
  if (account.email) {
    message += `📧 <b>Email</b>: ${esc(account.email)}\n`;
  }
  if (account.username) {
    message += `👤 <b>Username</b>: ${esc(account.username)}\n`;
  }
  if (account.password) {
    message += `🔑 <b>Password</b>: ${esc(account.password)}\n`;
  }

  message += "━━━━━━━━━━━━━━━━━━━━\n";
  message += "<i>📱 ACCOUNT PANEL SMS</i>";

  return message;
}

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
        text: "📧 COPY EMAIL",
        copy_text: { text: account.email }
      }
    ]);
  }

  if (account.username) {
    rows.push([
      {
        text: "👤 COPY USERNAME",
        copy_text: { text: account.username }
      }
    ]);
  }

  if (account.password) {
    rows.push([
      {
        text: "🔑 COPY PASSWORD",
        copy_text: { text: account.password }
      }
    ]);
  }

  const full = [
    account.name && `Nama: ${account.name}`,
    account.website && `Website: ${account.website}`,
    account.email && `Email: ${account.email}`,
    account.username && `Username: ${account.username}`,
    account.password && `Password: ${account.password}`
  ]
    .filter(Boolean)
    .join("\n");

  if (full && full.length <= 256) {
    rows.push([
      {
        text: "📋 COPY ALL DATA",
        copy_text: { text: full }
      }
    ]);
  }

  return { inline_keyboard: rows };
}

// ===================================
// RENDER HELPERS
// ===================================

async function renderPage(chatId, messageId, text, keyboard) {
  try {
    return await tg("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  } catch (error) {
    if (/message is not modified/i.test(error.message)) {
      return null;
    }
    throw error;
  }
}

async function showMenu(chatId, name, messageId = null) {
  const text =
    "👋 <b>WELCOME TO ACCOUNT PANEL SMS</b>\n" +
    "━━━━━━━━━━━━━━━━━━━━\n\n" +
    `Hello, <b>${esc(name)}</b>!\n\n` +
    "Kelola akun panel SMS dan lihat directory panel dengan mudah.\n\n" +
    "Pilih menu di bawah untuk melanjutkan. 👇";

  if (messageId) {
    return renderPage(chatId, messageId, text, mainMenu());
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: mainMenu()
  });
}

async function sendError(chatId, message) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "⚠️ " + message
  });
}

// ===================================
// MESSAGE HANDLERS
// ===================================

async function handleAccountForm(chatId, text) {
  const account = parseAccount(text);
  const error = validAccount(account);

  if (error) {
    await sendError(chatId, `${error}\nSilakan perbaiki formulir.`);
    return;
  }

  const processing = await tg("sendMessage", {
    chat_id: chatId,
    text: "⏳ <b>Memproses akun...</b>",
    parse_mode: "HTML"
  });

  try {
    await tg("sendMessage", {
      chat_id: CHANNEL_ID,
      text: accountMessage(account),
      parse_mode: "HTML",
      reply_markup: accountButtons(account)
    });

    await tg("deleteMessage", {
      chat_id: chatId,
      message_id: processing.message_id
    }).catch(() => {});

    await tg("sendMessage", {
      chat_id: chatId,
      text:
        "✅ <b>ACCOUNT SUCCESSFULLY POSTED</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        `📱 Panel: <b>${esc(account.name)}</b>\n` +
        "📢 Status: <i>Terkirim ke channel</i>\n\n" +
        "Akun berhasil dipublikasikan.",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ ADD ANOTHER ACCOUNT",
              callback_data: "add"
            }
          ],
          [
            {
              text: "🏠 MAIN MENU",
              callback_data: "menu"
            }
          ]
        ]
      }
    });
  } catch (error) {
    await tg("deleteMessage", {
      chat_id: chatId,
      message_id: processing.message_id
    }).catch(() => {});

    console.error("ACCOUNT POST ERROR:", error.message);

    await sendError(
      chatId,
      "Gagal memposting akun. Periksa konfigurasi bot dan izin channel."
    );
  }
}

async function handleMessage(msg) {
  if (!msg.text || !msg.from) return;

  const userId = String(msg.from.id);
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (!ADMIN_IDS.includes(userId)) {
    await sendError(chatId, "You are not authorized to use this bot.");
    return;
  }

  if (text.startsWith("/start")) {
    await showMenu(chatId, msg.from.first_name);
    return;
  }

  if (text.startsWith("/publish")) {
    if (!DIRECTORY_CHANNEL_ID) {
      await sendError(chatId, "DIRECTORY_CHANNEL_ID belum diset.");
      return;
    }

    await tg("sendMessage", {
      chat_id: chatId,
      text: publishConfirmText(),
      parse_mode: "HTML",
      reply_markup: publishConfirmMenu()
    });

    return;
  }

  if (text.startsWith("/directory") || text.startsWith("/dir")) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: directoryText(),
      parse_mode: "HTML",
      reply_markup: directoryMenu()
    });

    return;
  }

  const isAccountForm = /^\s*(nama|panel)\s*:/im.test(text);

  if (isAccountForm) {
    await handleAccountForm(chatId, text);
    return;
  }

  await sendError(
    chatId,
    "Format pesan tidak dikenali.\n\n" +
    "Silakan gunakan /start untuk membuka menu."
  );
}

async function handleCallback(q) {
  const userId = String(q.from.id);
  const chatId = q.message?.chat?.id;
  const messageId = q.message?.message_id;
  const action = q.data || "";

  await tg("answerCallbackQuery", {
    callback_query_id: q.id
  }).catch(() => {});

  if (!chatId || !messageId) return;

  if (!ADMIN_IDS.includes(userId)) {
    await sendError(chatId, "Access denied. Admin only.");
    return;
  }

  if (action === "menu") {
    await showMenu(chatId, q.from.first_name, messageId);
    return;
  }

  if (action === "add") {
    await renderPage(
      chatId,
      messageId,
      "➕ <b>ADD NEW ACCOUNT</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "Salin format di bawah, isi data akun, lalu kirim kembali ke bot.\n\n" +
      `<pre>${esc(TEMPLATE)}</pre>\n\n` +
      "📌 Field <b>Nama</b> wajib diisi.\n" +
      "📌 Minimal satu data akun harus diisi.",
      backMenu()
    );
    return;
  }

  if (action === "format") {
    await renderPage(
      chatId,
      messageId,
      "📋 <b>ACCOUNT INPUT FORMAT</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `<pre>${esc(TEMPLATE)}</pre>\n\n` +
      "Tekan tombol di bawah untuk menyalin format.",
      backMenu()
    );
    return;
  }

  if (action === "channel") {
    await renderPage(
      chatId,
      messageId,
      "📢 <b>CHANNEL INFORMATION</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "📥 <b>Account Channel</b>\n" +
      `<code>${esc(CHANNEL_ID)}</code>\n\n` +
      "🗂 <b>Directory Channel</b>\n" +
      `<code>${esc(DIRECTORY_CHANNEL_ID || "belum diset")}</code>\n\n` +
      "Akun baru diposting ke Account Channel.\n" +
      "Directory panel diposting ke Directory Channel.",
      backToMenu()
    );
    return;
  }

  if (action === "help") {
    await renderPage(
      chatId,
      messageId,
      "❓ <b>HELP & GUIDE</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "1️⃣ Pilih <b>ADD NEW ACCOUNT</b>.\n" +
      "2️⃣ Salin format akun.\n" +
      "3️⃣ Isi data akun.\n" +
      "4️⃣ Kirim formulir ke bot.\n" +
      "5️⃣ Bot memposting akun ke Account Channel.\n\n" +
      "🗂 Gunakan <b>DIRECTORY</b> untuk melihat daftar panel.\n" +
      "🚀 Gunakan <b>PUBLISH DIRECTORY</b> untuk mengirim directory ke channel.\n\n" +
      "Pastikan data akun sudah benar.",
      backToMenu()
    );
    return;
  }

  if (action === "dir") {
    await renderPage(chatId, messageId, directoryText(), directoryMenu());
    return;
  }

  if (action.startsWith("dsec:")) {
    const [, sectionKey, pageRaw] = action.split(":");

    if (!SECTIONS[sectionKey]) {
      await renderPage(
        chatId,
        messageId,
        "⚠️ Section tidak ditemukan.",
        directoryMenu()
      );
      return;
    }

    const page = parseInt(pageRaw, 10) || 0;
    const view = buildDirectoryPage(sectionKey, page);

    await renderPage(chatId, messageId, view.text, view.keyboard);
    return;
  }

  if (action === "publish") {
    if (!DIRECTORY_CHANNEL_ID) {
      await renderPage(
        chatId,
        messageId,
        "⚠️ <b>DIRECTORY_CHANNEL_ID belum diset.</b>\n\n" +
        "Tambahkan environment variable tersebut di Vercel.",
        backToMenu()
      );
      return;
    }

    await renderPage(
      chatId,
      messageId,
      publishConfirmText(),
      publishConfirmMenu()
    );
    return;
  }

  if (action === "publish_run") {
    if (!DIRECTORY_CHANNEL_ID) {
      await renderPage(
        chatId,
        messageId,
        "⚠️ <b>DIRECTORY_CHANNEL_ID belum diset.</b>",
        backToMenu()
      );
      return;
    }

    await renderPage(
      chatId,
      messageId,
      "⏳ <b>Publishing directory...</b>\n\n" +
      "Sedang mengirim entri ke channel directory. Mohon tunggu.",
      { inline_keyboard: [] }
    );

    try {
      const count = await publishDirectory();

      await renderPage(
        chatId,
        messageId,
        "✅ <b>DIRECTORY PUBLISHED</b>\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        `📨 <b>${count}</b> pesan berhasil dikirim ke channel directory.`,
        backToMenu()
      );
    } catch (error) {
      console.error("PUBLISH ERROR:", error.message);

      await renderPage(
        chatId,
        messageId,
        "❌ <b>GAGAL PUBLISH</b>\n\n" +
        "Pastikan bot adalah admin di channel directory " +
        "dan <code>DIRECTORY_CHANNEL_ID</code> sudah benar.",
        backToMenu()
      );
    }
    return;
  }
}

// ===================================
// WEBHOOK ENTRYPOINT
// ===================================

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("ACCOUNT PANEL SMS ONLINE");
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET || !CHANNEL_ID) {
    return res.status(500).send("Configuration missing");
  }

  if (
    req.headers["x-telegram-bot-api-secret-token"] !== WEBHOOK_SECRET
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const update = req.body;

    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return res.status(200).send("OK");
    }

    if (update.message) {
      await handleMessage(update.message);
      return res.status(200).send("OK");
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("BOT ERROR:", error.message);

    try {
      const chatId = req.body?.message?.chat?.id;

      if (chatId) {
        await tg("sendMessage", {
          chat_id: chatId,
          text:
            "❌ <b>GAGAL MEMPROSES PERMINTAAN</b>\n\n" +
            "Terjadi kesalahan internal. Silakan coba lagi.",
          parse_mode: "HTML"
        });
      }
    } catch (_) {
      // Jangan pernah menampilkan credential / error internal.
    }

    return res.status(200).send("OK");
  }
};
