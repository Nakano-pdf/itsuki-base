const config = require("../../config");
const path = require("path");
const fs = require("fs");
const timeHelper = require("../../src/lib/timeHelper");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const pluginConfig = {
  name: "nulis",
  alias: ["tulis", "write"],
  category: "tools",
  description: "Generate tulisan tangan di kertas",
  usage: ".nulis <teks>",
  example: ".nulis Aku cinta kamu selamanya",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

require("../../src/lib/assetManager").getAssetPath("fonts.zahraaa", "ttf")
  .then((p) => { if (p) GlobalFonts.registerFromPath(p, "Zahraaa"); })
  .catch(() => {});

function getContextInfo(title = "📝 *ɴᴜʟɪs*", body = "Tulisan tangan") {
  const saluranId = config.saluran?.id || "https://whatsapp.com/channel/0029VbDytkmBqbrF0rFKr12w";
  const saluranName = config.saluran?.name || config.bot?.name || "Itsuki Nakano";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };


  return contextInfo;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

async function handler(m, { sock }) {
  const text = m.args?.join(" ");

  if (!text) {
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> \`${m.prefix}nulis <teks>\`\n\n` +
        `> Contoh:\n` +
        `> \`${m.prefix}nulis Aku cinta kamu selamanya\``,
    );
  }

  if (text.length > 500) {
    return m.reply(`❌ *ᴛᴇᴋs ᴛᴇʀʟᴀʟᴜ ᴘᴀɴᴊᴀɴɢ*\n\n> Maksimal 500 karakter`);
  }

  const inputBuf = await require("../../src/lib/assetManager").getAssetBuffer("images.magernulis");

  if (!inputBuf) {
    return m.reply(
      `❌ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n> URL \`config.assets.images.magernulis\` belum diisi / gagal diunduh`,
    );
  }

  await m.react("🕕");
  await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Membuat tulisan tangan...`);

  try {
    const { loadImage } = require("@napi-rs/canvas");
    const bgImage = await loadImage(inputBuf);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0);

    const tgl = timeHelper.formatDate("DD/MM/YYYY");
    const hari = timeHelper.formatFull("dddd");

    ctx.font = "20px Zahraaa, Arial";
    ctx.fillStyle = "#1a1a2e";

    ctx.fillText(hari, 806, 78);

    ctx.font = "18px Zahraaa, Arial";
    ctx.fillText(tgl, 806, 102);

    ctx.font = "20px Zahraaa, Arial";
    const maxWidth = 600;
    const lineHeight = 28;
    const startX = 344;
    const startY = 142;

    const lines = wrapText(ctx, text, maxWidth);

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer("image/jpeg");

    await m.react("✅");
    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `✅ *ᴛᴜʟɪsᴀɴ ᴛᴀɴɢᴀɴ*\n\n> Hatihati ketahuan! 📖`,
        contextInfo: getContextInfo(),
      },
      { quoted: m },
    );
  } catch (error) {
    await m.react("❌");
    await m.reply(`❌ *Gomen ne~* ✦\n\n> ${error.message}\n\n_Ai udah coba yang terbaik tapi gagal juga... coba lagi nanti ya~ 🌸_`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
