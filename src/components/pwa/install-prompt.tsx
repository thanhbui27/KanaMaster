"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "kanamaster.install-prompt.dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIosDevice() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || iosNavigator.standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    const ios = isIosDevice();
    const reveal = window.setTimeout(() => {
      setIsIos(ios);
      if (ios) setVisible(true);
    }, 1200);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, "installed");
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(reveal);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setVisible(false);
  };

  const install = async () => {
    if (isIos) {
      if (showIosSteps) {
        dismiss();
        return;
      }
      setShowIosSteps(true);
      return;
    }

    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallEvent(null);
  };

  if (!visible) return null;

  return (
    <aside className="install-prompt" role="dialog" aria-label="Install KanaMaster">
      <button className="install-close" type="button" onClick={dismiss} aria-label="Dismiss install suggestion">
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="install-icon" aria-hidden="true">
        {isIos ? <Share size={23} /> : <Download size={23} />}
      </div>
      <div className="install-copy">
        <strong>Install KanaMaster</strong>
        <p>Add KanaMaster to your home screen for quick daily practice.</p>
        {showIosSteps && (
          <ol className="ios-steps">
            <li><span>1</span> Tap Share <Share size={15} /></li>
            <li><span>2</span> Choose “Add to Home Screen”</li>
            <li><span>3</span> Tap Add</li>
          </ol>
        )}
      </div>
      <button className="install-button" type="button" onClick={install}>
        {showIosSteps ? "Got it" : "Install"}
      </button>
    </aside>
  );
}
