// =======================================
// IMPORTAÇÕES
// =======================================
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const cron = require("node-cron");


const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const Pino = require("pino");

// =======================================
// CONFIGURAÇÕES
// =======================================
const ALLOW_SELF_TEST = false; // 🔴 deixe true para testar consigo mesmo

// =======================================
// CONTROLE DE RESPOSTA DIÁRIA
// =======================================
const repliedToday = new Map();
const processedMessages = new Set();

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
};

// =======================================
// ENVIO SEMANAL PARA CLIENTES
// =======================================
function loadClientes() {
  const data = fs.readFileSync("./data/clientes.json", "utf-8");
  return JSON.parse(data).clientes;
}

async function sendWeeklyMessage(sock) {
  const clientes = loadClientes();

  console.log(`📤 Enviando mensagem para ${clientes.length} clientes`);

  for (const number of clientes) {
    const jid = number + "@s.whatsapp.net";

    try {
      await sock.sendPresenceUpdate("composing", jid);
      await new Promise((r) => setTimeout(r, 2000));

      await sock.sendMessage(jid, {
        text:
          "Olá! 👋\n\n" +
          "Passando para lembrar das novidades dessa semana.\n" +
          "Qualquer dúvida, estou à disposição 😊",
      });

      // ⏱️ delay anti-ban
      await new Promise((r) => setTimeout(r, 8000));
    } catch (err) {
      console.error("❌ Erro ao enviar para", jid, err.message);
    }
  }

  console.log("✅ Envio semanal concluído");
}

// =======================================
// FUNÇÃO PRINCIPAL
// =======================================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    //printQRInTerminal: true,
  });

  // =======================================
  // EVENTOS DE CONEXÃO
  // =======================================
  sock.ev.on("connection.update", (update) => {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    console.log("📲 Escaneie o QR Code abaixo:\n");
    qrcode.generate(qr, { small: true });
  }

  if (connection === "open") {
    console.log("✅ WhatsApp conectado com sucesso!");

    // ===============================
    // 🧪 TESTE SEM ESPERAR A SEMANA
    // ===============================
    //setTimeout(async () => {
      //console.log("🧪 Disparando envio de TESTE...");
      //await sendWeeklyMessage(sock);
    //}, 15000); // 15 segundos após conectar

    // 🗓️ Envio semanal - Segunda às 10h
    cron.schedule("0 10 * * 1", async () => {
    console.log("⏰ Cron semanal disparado");
    await sendWeeklyMessage(sock);
  });
  }

  if (connection === "close") {
  const reason = lastDisconnect?.error?.output?.statusCode;

  if (reason === 515) {
    console.log("🔁 Reinicialização interna do WhatsApp (normal)");
    return startBot();
  }

  console.log("❌ Conexão encerrada. Motivo:", reason);

  if (reason !== DisconnectReason.loggedOut) {
    console.log("🔄 Reconectando...");
    startBot();
  } else {
    console.log("🔒 Sessão encerrada. Escaneie o QR novamente.");
  }
}

});

  sock.ev.on("creds.update", saveCreds);

  // =======================================
  // MENSAGENS
  // =======================================
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log("📩 messages.upsert:", type);

    if (!["notify", "append"].includes(type)) return;

    const msg = messages?.[0];
    if (!msg || !msg.message) return;

    // 🔒 TRAVA ABSOLUTA POR MENSAGEM
    if (processedMessages.has(msg.key.id)) {
      console.log("🔁 Mensagem duplicada ignorada:", msg.key.id);
      return;
    }
    processedMessages.add(msg.key.id);

    const from = msg.key.remoteJid;
    if (!from || from.endsWith("@g.us")) return;

    // 🔐 BLOQUEIA mensagens do próprio bot (exceto teste)
    const myNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const isSelfChat = from === myNumber;

    // Bloqueia mensagens do próprio bot, exceto self-chat em teste
    if (msg.key.fromMe && !(ALLOW_SELF_TEST && isSelfChat)) return;


    // 🔥 EXTRAÇÃO COMPLETA DE TEXTO
    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption;

    if (!texto) {
      console.log("📩 Mensagem sem texto (ignorada)");
      return;
    }

    console.log("💬 Texto recebido:", texto);

    // =======================================
    // REGRA: 1 RESPOSTA POR DIA
    // =======================================
    const today = todayKey();

    if (repliedToday.get(from) === today) {
      console.log("⏭️ Já respondeu hoje para:", from);
      return;
    }

    repliedToday.set(from, today);

    // =======================================
    // SIMULA DIGITANDO
    // =======================================
    await sock.sendPresenceUpdate("composing", from);
    await new Promise((res) => setTimeout(res, 2500));
    await sock.sendPresenceUpdate("paused", from);

    // =======================================
    // RESPOSTA AUTOMÁTICA PADRÃO
    // =======================================
    await sock.sendMessage(from, {
      text:
        "Olá! 👋\n\n" +
        "Recebi sua mensagem e em breve retornarei.\n" +
        "Obrigado pelo contato 😊",
    });
  });
}

// =======================================
// INICIA O BOT
// =======================================
startBot();
