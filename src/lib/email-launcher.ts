export type EmailParams = {
  to?: string;
  subject?: string;
  body?: string;
  provider?: "gmail" | "outlook" | "yahoo";
};

const enc = encodeURIComponent;
const crlf = (s = "") => s.replace(/\r?\n/g, "\r\n");

export const buildWebCompose = ({ to = "", subject = "", body = "", provider = "gmail" }: EmailParams) => {
  const b = crlf(body || "");
  if (provider === "outlook") {
    // For Outlook, we need to encode the entire mailto URL
    const params: string[] = [];
    if (to) params.push(`to=${encodeURIComponent(to)}`);
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (b) params.push(`body=${encodeURIComponent(b)}`);
    return `https://outlook.office.com/mail/deeplink/compose?${params.join('&')}`;
  }
  if (provider === "yahoo") {
    const q = new URLSearchParams();
    if (to) q.set("to", to);
    if (subject) q.set("subject", subject);
    if (b) q.set("body", b);
    return `https://compose.mail.yahoo.com/?${q.toString()}`;
  }
  // Gmail
  const g = new URLSearchParams({ view: "cm", fs: "1" });
  if (to) g.set("to", to);
  if (subject) g.set("su", subject);
  if (b) g.set("body", b);
  return `https://mail.google.com/mail/?${g.toString()}`;
};

export const guessProvider = (to?: string): EmailParams["provider"] => {
  const d = (to || "").split("@")[1]?.toLowerCase() || "";
  if (/outlook|hotmail|live|office/.test(d)) return "outlook";
  if (/yahoo\./.test(d)) return "yahoo";
  return "gmail";
};

export const openComposeTab = (params: EmailParams) => {
  const url = buildWebCompose(params);
  // doit être appelé SYNCHRONE depuis onClick
  const w = window.open(url, "_blank", "noopener");
  if (!w) {
    // dernier recours : ancre programmatique
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.position = "fixed";
    a.style.left = "-9999px";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

export const launchEmail = ({ to = "", subject = "", body = "" }: EmailParams) => {
  const mailto = `mailto:${to ? enc(to) : ""}?subject=${enc(subject)}&body=${enc(crlf(body))}`;
  const inIframe = (() => { 
    try { 
      return window.self !== window.top; 
    } catch { 
      return true; 
    } 
  })();

  // 1) Tentative app native (mailto)
  if (!inIframe) {
    try { 
      window.location.href = mailto; 
    } catch {}
    
    // 2) Ouvre aussi Gmail en nouvel onglet (assure l'ouverture)
    const g = new URLSearchParams({ view: "cm", fs: "1" });
    if (to) g.set("to", to);
    if (subject) g.set("su", subject);
    if (body) g.set("body", crlf(body));
    window.open(`https://mail.google.com/mail/?${g.toString()}`, "_blank", "noopener");
    return;
  }

  // 3) En iframe : ouvrir directement Gmail
  const q = new URLSearchParams({ view: "cm", fs: "1" });
  if (to) q.set("to", to);
  if (subject) q.set("su", subject);
  if (body) q.set("body", crlf(body));
  const w = window.open(`https://mail.google.com/mail/?${q.toString()}`, "_blank", "noopener");
  
  if (!w) {
    // 4) Dernier recours : <a target=_blank>
    const a = document.createElement("a");
    a.href = mailto; 
    a.target = "_blank"; 
    a.rel = "noopener"; 
    a.style.display = "none";
    document.body.appendChild(a); 
    a.click(); 
    a.remove();
  }
};