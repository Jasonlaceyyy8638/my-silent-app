"use client";

import { useEffect } from "react";

const CHATBOT_ID = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID;
const EMBED_URL = "https://www.chatbase.co/embed.min.js";

export function ChatbaseWidget() {
  useEffect(() => {
    if (!CHATBOT_ID || typeof document === "undefined") return;
    if (document.getElementById("chatbase-embed")) return;

    const script = document.createElement("script");
    script.id = "chatbase-embed";
    script.src = EMBED_URL;
    script.async = true;
    script.setAttribute("agent-id", CHATBOT_ID);
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("chatbase-embed");
      if (el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  return null;
}
