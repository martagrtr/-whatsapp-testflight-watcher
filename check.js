import https from "https";

const LINKS = [
  {
    name: "WhatsApp Messenger",
    url: "https://testflight.apple.com/join/YcmGWyxV"
  },
  {
    name: "WhatsApp iPad",
    url: "https://testflight.apple.com/join/8sLvv90R"
  },
  {
    name: "WhatsApp Business",
    url: "https://testflight.apple.com/join/oscYikr0"
  }
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      res => {
        let data = "";
        res.on("data", chunk => (data += chunk));
        res.on("end", () => resolve(data.toLowerCase()));
      }
    ).on("error", reject);
  });
}

function getStatus(html) {
  if (html.includes("no se aceptan testers nuevos")) return "CERRADO";
  if (html.includes("this beta is full")) return "CERRADO";
  if (html.includes("not accepting")) return "CERRADO";
  if (html.includes(">accept<") || html.includes(">aceptar<")) return "ABIERTO";
  return "DESCONOCIDO";
}

async function notifyPushover(message) {
  if (!process.env.PUSHOVER_APP_TOKEN || !process.env.PUSHOVER_USER_KEY) return;

  const body = new URLSearchParams({
    token: process.env.PUSHOVER_APP_TOKEN,
    user: process.env.PUSHOVER_USER_KEY,
    message
  });

  await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
}

(async () => {
  for (const link of LINKS) {
    try {
      const html = await fetchPage(link.url);
      const status = getStatus(html);

      if (status === "ABIERTO") {
        const msg = `🚀 ${link.name} ABIERTO\n${link.url}`;
        await notifyPushover(msg);
        console.log(msg);
      }
    } catch (err) {
      console.error("Error comprobando", link.name, err.message);
    }
  }
})();
