import React from "react";
import {createRoot} from "react-dom/client";
import * as OpenCC from "opencc-js";
import {App} from "./App";
import "./index.css";

// 全站繁体字转换器
const convToTrad = OpenCC.Converter({ from: "cn", to: "tw" });

function convertDomToTraditional() {
  const root = document.getElementById("root");
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && /[\u4e00-\u9fa5]/.test(node.nodeValue)) {
      const converted = convToTrad(node.nodeValue);
      if (node.nodeValue !== converted) {
        node.nodeValue = converted;
      }
    }
  }

  const inputs = root.querySelectorAll("input, textarea");
  inputs.forEach((el) => {
    const input = el as HTMLInputElement | HTMLTextAreaElement;
    if (input.placeholder && /[\u4e00-\u9fa5]/.test(input.placeholder)) {
      const converted = convToTrad(input.placeholder);
      if (input.placeholder !== converted) {
        input.placeholder = converted;
      }
    }
    if (input.title && /[\u4e00-\u9fa5]/.test(input.title)) {
      const converted = convToTrad(input.title);
      if (input.title !== converted) {
        input.title = converted;
      }
    }
  });
}

if (typeof window !== "undefined") {
  document.documentElement.lang = "zh-Hant";
  document.title = convToTrad(document.title || "體育賽事與財務管理後台");

  let timeoutId: any = null;
  const scheduleConvert = () => {
    if (timeoutId) return;
    timeoutId = setTimeout(() => {
      timeoutId = null;
      convertDomToTraditional();
    }, 40);
  };

  const observer = new MutationObserver((mutations) => {
    // 检查是否有实质内容变化
    let hasRelevantMutation = false;
    for (const m of mutations) {
      if (m.type === "childList") {
        hasRelevantMutation = true;
        break;
      }
    }
    if (hasRelevantMutation) {
      scheduleConvert();
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    convertDomToTraditional();
    const root = document.getElementById("root");
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }
  });

  setTimeout(() => {
    convertDomToTraditional();
    const root = document.getElementById("root");
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }
  }, 100);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
