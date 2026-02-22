"use client";

import { useEffect } from "react";

const CHATBASE_EMBED_URL = "https://www.chatbase.co/embed.min.js";
const CHATBOT_ID = "7RFDPJoo-X5H0MuLzhDgY";
const DOMAIN = "www.chatbase.co";

export function ChatbaseWidget() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("chatbase-embed")) return;

    // Force the bubble to stay open
    (window as unknown as { chatbaseConfig?: { defaultOpen?: boolean } }).chatbaseConfig = {
      defaultOpen: true,
    };

    const script = document.createElement("script");
    script.id = "chatbase-embed";
    script.src = CHATBASE_EMBED_URL;
    script.setAttribute("chatbotId", CHATBOT_ID);
    script.setAttribute("domain", DOMAIN);
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
