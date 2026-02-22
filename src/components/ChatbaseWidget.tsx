"use client";

import { useEffect } from "react";

const CHATBASE_EMBED_URL = "https://www.chatbase.co/embed.min.js";
const DOMAIN = "www.chatbase.co";

// Use env so you can set NEXT_PUBLIC_CHATBOT_ID in Netlify. Get the correct ID from
// Chatbase Dashboard → Deploy → Chat widget → Embed tab.
const CHATBOT_ID =
  typeof process.env.NEXT_PUBLIC_CHATBOT_ID === "string" &&
  process.env.NEXT_PUBLIC_CHATBOT_ID.trim() !== ""
    ? process.env.NEXT_PUBLIC_CHATBOT_ID.trim()
    : "7RFDPJoo-X5H0MuLzhDgY";

export function ChatbaseWidget() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("chatbase-embed")) return;
    if (!CHATBOT_ID) return;

    // Don’t force open so the panel isn’t shown while the widget is still loading
    (window as unknown as { chatbaseConfig?: { defaultOpen?: boolean } }).chatbaseConfig = {
      defaultOpen: false,
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
