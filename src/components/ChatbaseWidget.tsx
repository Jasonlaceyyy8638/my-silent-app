"use client";

import { useEffect } from "react";

const CHATBASE_EMBED_URL = "https://www.chatbase.co/embed.min.js";
const DOMAIN = "www.chatbase.co";
const LOAD_TIMEOUT_MS = 12_000;

const CHATBOT_ID =
  typeof process.env.NEXT_PUBLIC_CHATBOT_ID === "string" &&
  process.env.NEXT_PUBLIC_CHATBOT_ID.trim() !== ""
    ? process.env.NEXT_PUBLIC_CHATBOT_ID.trim()
    : "7RFDPJoo-X5H0MuLzhDgY";

function loadChatbase() {
  if (typeof window === "undefined") return;
  if (document.getElementById("chatbase-embed")) return;
  if (!CHATBOT_ID) return;

  (window as unknown as { chatbaseConfig?: { defaultOpen?: boolean } }).chatbaseConfig = {
    defaultOpen: false,
  };

  const script = document.createElement("script");
  script.id = "chatbase-embed";
  script.src = CHATBASE_EMBED_URL;
  script.setAttribute("chatbotId", CHATBOT_ID);
  script.setAttribute("data-chatbot-id", CHATBOT_ID);
  script.setAttribute("domain", DOMAIN);
  script.setAttribute("data-domain", DOMAIN);
  script.defer = true;
  script.async = true;

  const timeout = window.setTimeout(() => {
    if (!(window as unknown as { chatbase?: unknown }).chatbase) {
      script.remove();
      document.querySelectorAll('iframe[src*="chatbase"], [id*="chatbase"], [class*="chatbase"]').forEach((el) => {
        if (el instanceof HTMLElement) el.style.display = "none";
      });
    }
  }, LOAD_TIMEOUT_MS);

  script.onload = () => {
    window.clearTimeout(timeout);
  };

  document.body.appendChild(script);
}

export function ChatbaseWidget() {
  useEffect(() => {
    const run = () => loadChatbase();
    if (document.readyState === "complete") {
      const t = setTimeout(run, 0);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", run);
    return () => window.removeEventListener("load", run);
  }, []);

  return null;
}
