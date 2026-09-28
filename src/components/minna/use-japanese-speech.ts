"use client";
import { useEffect, useState } from "react";

export function useJapaneseSpeech() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);
  const stop = () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setMessage(""); };
  const speak = (reading: string) => {
    if (!("speechSynthesis" in window)) { setMessage("Trình duyệt chưa hỗ trợ đọc từ. Bạn có thể xem cách đọc kana trên thẻ."); return; }
    const synth = window.speechSynthesis;
    const voice = synth.getVoices().find(v => /^ja(?:-|_|$)/i.test(v.lang));
    if (!voice) { setMessage("Chưa tìm thấy giọng tiếng Nhật trên thiết bị. Hãy bật/cài giọng tiếng Nhật trong cài đặt giọng nói rồi thử lại."); return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(reading);
    utterance.lang = "ja-JP"; utterance.voice = voice; utterance.rate = 0.85;
    utterance.onerror = event => { if (!["canceled", "interrupted"].includes(event.error)) setMessage("Không phát được âm thanh. Hãy thử lại hoặc kiểm tra giọng tiếng Nhật trên thiết bị."); };
    setMessage("Phát âm bằng giọng tổng hợp tiếng Nhật trên thiết bị.");
    synth.speak(utterance);
  };
  return { message, speak, stop };
}
