(() => {
  const assistant = document.getElementById("orbitAssistant");
  if (!assistant || assistant.dataset.ready === "true") return;
  assistant.dataset.ready = "true";

  const launcher = document.getElementById("orbitLauncher");
  const panel = document.getElementById("orbitPanel");
  const backdrop = document.getElementById("orbitBackdrop");
  const minimize = document.getElementById("orbitMinimize");
  const closeButton = document.getElementById("orbitClose");
  const messages = document.getElementById("orbitMessages");
  const quickQuestions = Array.from(document.querySelectorAll("[data-orbit-question]"));
  const form = document.getElementById("orbitForm");
  const input = document.getElementById("orbitInput");
  const sendButton = document.getElementById("orbitSend");
  const robot = launcher.querySelector(".orbit-robot");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 760px)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  const questionLabels = {
    about: "了解鹏飞",
    projects: "代表项目",
    ai: "AI 产品经验",
    philosophy: "设计理念",
    skills: "核心能力",
    contact: "联系鹏飞"
  };

  const responses = {
    about: "鹏飞是一名拥有近 10 年经验的 UI/UX 产品设计师，专注于 B 端 SaaS、AI 产品与企业级系统。\n\n他擅长梳理复杂业务流程、构建清晰的信息架构，并通过系统化设计提升产品效率与体验一致性。",
    projects: "代表项目包括：\n\n• AI Agent 舆情分析流程升级\n• B 端 SaaS 舆情监测平台\n• 海草云平台体验升级\n• 备婚方案工具型产品\n\n你可以在 Featured Work 与 More Projects 中查看完整设计过程。",
    ai: "近年的工作重点包括 B 端中台、AI 创作工具、Agent 与智能工作流设计。\n\n鹏飞关注的不只是 AI 对话体验，而是 AI 如何理解任务、调用能力并协助用户真正完成工作。",
    philosophy: "好的体验，是把复杂留给系统。\n\n设计需要站在用户视角理解任务，同时兼顾业务目标、系统逻辑与后续扩展能力。",
    skills: "核心能力包括：\n\n• 复杂业务抽象\n• 信息架构与工作流\n• B 端 SaaS 产品设计\n• AI 与 Agent 体验设计\n• 设计系统建设\n• 跨团队协同与设计落地",
    contact: "希望交流 AI 产品、企业级系统或设计合作，可以通过页面中的 Contact 入口联系鹏飞。",
    fallback: "我的任务是帮助你了解鹏飞的作品、经历和设计方法。\n\n你可以继续询问代表项目、AI 产品经验、设计理念或合作方式。"
  };

  let busy = false;
  let lastFocus = null;

  function setOpen(open, restoreFocus = true) {
    const currentlyOpen = assistant.classList.contains("is-open");
    if (open === currentlyOpen) return;

    assistant.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    panel.setAttribute("aria-modal", String(mobile.matches));

    if (open) {
      lastFocus = document.activeElement;
      document.querySelectorAll(".wechat-contact.open").forEach((contact) => {
        contact.classList.remove("open");
        contact.querySelector(".wechat-cta")?.setAttribute("aria-expanded", "false");
      });
      window.requestAnimationFrame(() => {
        if (mobile.matches) closeButton.focus();
        else input.focus();
      });
    } else if (restoreFocus) {
      const target = lastFocus instanceof HTMLElement ? lastFocus : launcher;
      window.requestAnimationFrame(() => target.focus());
    }
  }

  function scrollToEnd() {
    window.requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function addMessage(role, text, meta = "") {
    const message = document.createElement("div");
    message.className = `orbit-message orbit-message--${role}`;

    if (meta) {
      const label = document.createElement("span");
      label.className = "orbit-message-meta";
      label.textContent = meta;
      message.appendChild(label);
    }

    const copy = document.createElement("span");
    copy.className = "orbit-message-copy";
    copy.textContent = text;
    message.appendChild(copy);
    messages.appendChild(message);
    scrollToEnd();
    return message;
  }

  function setBusy(value) {
    busy = value;
    assistant.classList.toggle("is-thinking", value);
    messages.setAttribute("aria-busy", String(value));
    input.disabled = value;
    sendButton.disabled = value;
    quickQuestions.forEach((button) => { button.disabled = value; });
  }

  function resolveResponse(question, requestedKey = "") {
    if (requestedKey && responses[requestedKey]) {
      return { key: requestedKey, text: responses[requestedKey] };
    }

    const normalized = question.toLowerCase().replace(/\s+/g, "");
    const includesAny = (terms) => terms.some((term) => normalized.includes(term));

    if (includesAny(["联系", "合作", "微信", "邮箱", "contact"])) {
      return { key: "contact", text: responses.contact };
    }
    if (includesAny(["理念", "方法", "设计观", "原则", "philosophy", "method"])) {
      return { key: "philosophy", text: responses.philosophy };
    }
    if (includesAny(["能力", "擅长", "技能", "核心", "skill", "saas", "b端", "复杂系统"])) {
      return { key: "skills", text: responses.skills };
    }
    if (includesAny(["代表项目", "项目", "案例", "作品", "featured", "project", "case"])) {
      return { key: "projects", text: responses.projects };
    }
    if (includesAny(["ai", "agent", "智能", "工作流", "aigc", "人工智能"])) {
      return { key: "ai", text: responses.ai };
    }
    if (includesAny(["鹏飞", "介绍", "自己", "经历", "背景", "about", "experience"])) {
      return { key: "about", text: responses.about };
    }
    return { key: "fallback", text: responses.fallback };
  }

  function goToContact() {
    const contact = document.getElementById("contact");
    if (!contact) return;
    setOpen(false, false);
    contact.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "center"
    });
    window.setTimeout(() => contact.querySelector(".wechat-cta")?.focus(), reduceMotion.matches ? 0 : 620);
  }

  function ask(question, requestedKey = "") {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || busy) return;

    addMessage("user", cleanQuestion);
    input.value = "";
    input.style.height = "auto";
    setBusy(true);

    const status = addMessage("status", "正在检索作品集…", "SEARCHING ARCHIVE");
    const statusMeta = status.querySelector(".orbit-message-meta");
    const statusCopy = status.querySelector(".orbit-message-copy");
    const result = resolveResponse(cleanQuestion, requestedKey);
    const organizeDelay = reduceMotion.matches ? 20 : 1500;
    const answerDelay = reduceMotion.matches ? 60 : 1900;

    window.setTimeout(() => {
      if (!status.isConnected) return;
      statusMeta.textContent = "ANALYZING";
      statusCopy.textContent = "正在整理相关内容…";
    }, organizeDelay);

    window.setTimeout(() => {
      status.remove();
      addMessage("assistant", result.text, "RESULT FOUND");
      setBusy(false);

      if (result.key === "contact") {
        window.setTimeout(goToContact, reduceMotion.matches ? 0 : 560);
      } else if (!mobile.matches && assistant.classList.contains("is-open")) {
        input.focus();
      }
    }, answerDelay);
  }

  launcher.addEventListener("click", () => {
    setOpen(!assistant.classList.contains("is-open"));
  });
  minimize.addEventListener("click", () => setOpen(false));
  closeButton.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));

  quickQuestions.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.orbitQuestion;
      ask(questionLabels[key] || button.textContent, key);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 92)}px`;
  });

  document.addEventListener("pointerdown", (event) => {
    if (!assistant.classList.contains("is-open")) return;
    if (!assistant.contains(event.target)) setOpen(false, false);
  });

  document.addEventListener("keydown", (event) => {
    if (!assistant.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.querySelectorAll("button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"))
      .filter((item) => !item.hidden && item.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function resetTracking() {
    assistant.classList.remove("is-near");
    launcher.style.setProperty("--orbit-rx", "0deg");
    launcher.style.setProperty("--orbit-ry", "0deg");
  }

  window.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reduceMotion.matches) return;
    const rect = robot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= 180) {
      assistant.classList.add("is-near");
      const rotateY = Math.max(-6, Math.min(6, deltaX / 30));
      const rotateX = Math.max(-4, Math.min(4, -deltaY / 42));
      launcher.style.setProperty("--orbit-rx", `${rotateX}deg`);
      launcher.style.setProperty("--orbit-ry", `${rotateY}deg`);
    } else {
      resetTracking();
    }
  }, { passive: true });

  document.addEventListener("pointerleave", resetTracking);
  finePointer.addEventListener?.("change", resetTracking);
  mobile.addEventListener?.("change", () => {
    panel.setAttribute("aria-modal", String(mobile.matches));
  });
  panel.setAttribute("aria-modal", String(mobile.matches));
})();
