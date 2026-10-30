
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function telegram(method, data) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Telegram API error");
  }

  return result.result;
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function parseAccount(text) {
  const fields = {};

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.*)$/);
    if (match) {
      fields[match[1].trim().toLowerCase()] =
        match[2].trim();
    }
  }

  return {
    name: fields.nama || fields.panel || "",
    website: fields.website || "",
    email: fields.email || "",
    username: fields.username || "",
    password: fields.password || ""
  };
}

function makeKeyboard(account) {
  const rows = [];

  if (account.website) {
    rows.push([{
      text: "🌐 BUKA WEBSITE",
      url: account.website
    }]);
  }

  if (account.email) {
    rows.push([{
      text: "📋 SALIN EMAIL",
      copy_text: { text: account.email }
    }]);
  }

  if (account.username) {
    rows.push([{
      text: "📋 SALIN USERNAME",
      copy_text: { text: account.username }
    }]);
  }

  if (account.password) {
    rows.push([{
      text: "🔑 SALIN PASSWORD",
      copy_text: { text: account.password }
    }]);
  }

  return { inline_keyboard: rows };
}

function makeMessage(account) {
  let message = `🔐 <b>${escapeHTML(account.name)}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;

  if (account.website) {
    message += `🌐 Website: ${escapeHTML(account.website)}\n`;
  }

  if (account.email) {
    message += `📧 Email: ${escapeHTML(account.email)}\n`;
  }

  if (account.username) {
    message += `👤 Username: ${escapeHTML(account.username)}\n`;
  }

  if (account.password) {
    message += `🔑 Password: ${escapeHTML(account.password)}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━`;

  return message;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("PANEL MANAGER BOT AKTIF");
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET) {
    return res.status(500).send("Environment belum lengkap");
  }

  if (
    req.headers["x-telegram-bot-api-secret-token"] !==
    WEBHOOK_SECRET
  ) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const update = req.body;

    // Mengambil ID channel privat
    if (update.channel_post) {
      const post = update.channel_post;

      if ((post.text || "").trim() === "/channelid") {
        await telegram("sendMessage", {
          chat_id: post.chat.id,
          text: `ID Channel: ${post.chat.id}`
        });
      }

      return res.status(200).send("OK");
    }

    const msg = update.message;
    if (!msg || !msg.text || !msg.from) {
      return res.status(200).send("OK");
    }

    const userId = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text === "/myid") {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: `Telegram ID kamu: ${userId}`
      });

      return res.status(200).send("OK");
    }

    if (!ADMIN_IDS.includes(userId)) {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "⛔ Kamu tidak memiliki izin menggunakan bot ini."
      });

      return res.status(200).send("OK");
    }

    if (text === "/start") {
      await telegram("sendMessage", {
        chat_id: chatId,
        text:
          "🤖 PANEL MANAGER BOT\n\n" +
          "Gunakan /add untuk mengirim akun panel.\n" +
          "Gunakan /help untuk melihat format input.\n" +
          "Gunakan /myid untuk melihat Telegram ID."
      });

      return res.status(200).send("OK");
    }

    if (text === "/help") {
      await telegram("sendMessage", {
        chat_id: chatId,
        text:
          "FORMAT INPUT AKUN:\n\n" +
          "/add\n" +
          "Nama: ZEBRA SMS\n" +
          "Website: https://zebrasms.com\n" +
          "Email: email@example.com\n" +
          "Username: riyan\n" +
          "Password: passwordkamu\n\n" +
          "Username dan email boleh dikosongkan."
      });

      return res.status(200).send("OK");
    }

    if (!/^\/add(?:@\w+)?(?:\s|$)/i.test(text)) {
      return res.status(200).send("OK");
    }

    if (!CHANNEL_ID) {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "CHANNEL_ID belum diatur di Vercel."
      });

      return res.status(200).send("OK");
    }

    const account = parseAccount(
      text.replace(/^\/add(?:@\w+)?\s*/i, "")
    );

    if (!account.name) {
      throw new Error("Nama panel wajib diisi.");
    }

    if (account.website) {
      let url;
      try {
        url = new URL(account.website);
      } catch {
        throw new Error("Format website tidak valid.");
      }

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Website harus menggunakan HTTP atau HTTPS.");
      }
    }

    if (
      !account.email &&
      !account.username &&
      !account.password &&
      !account.website
    ) {
      throw new Error("Minimal satu data akun harus diisi.");
    }

    await telegram("sendMessage", {
      chat_id: CHANNEL_ID,
      text: makeMessage(account),
      parse_mode: "HTML",
      reply_markup: makeKeyboard(account)
    });

    await telegram("sendMessage", {
      chat_id: chatId,
      text: `✅ ${account.name} berhasil diposting ke channel!`
    });

    return res.status(200).send("OK");

  } catch (error) {
    // Jangan mencatat isi akun atau password ke log.
    return res.status(200).send("Request diproses.");
  }
};
