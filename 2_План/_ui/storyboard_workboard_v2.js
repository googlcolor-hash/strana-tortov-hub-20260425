(() => {
  const ready = () => {
    if (document.getElementById("wbV2Tools")) return;
    document.body.classList.add("workboard-v2");
    document.body.dataset.density = "normal";

    const toolbar = document.querySelector(".toolbar");
    if (!toolbar) return;

    const bar = document.createElement("section");
    bar.id = "wbV2Tools";
    bar.innerHTML = `
      <button class="chip active" data-status="all">Все шоты</button>
      <button class="chip" data-status="active">Active</button>
      <button class="chip" data-status="todo">Todo</button>
      <button class="chip" data-status="done">Done</button>
      <button class="chip mode" id="wbSimpleMode">Простой режим</button>
      <button class="step active" data-step="select">1. Выбрать шот</button>
      <button class="step" data-step="dialog">2. Диалог</button>
      <button class="step" data-step="media">3. Медиа</button>
      <button class="step" data-step="review">4. Проверка</button>
      <select id="wbDensity">
        <option value="normal">Плотность: normal</option>
        <option value="compact">Плотность: compact</option>
        <option value="comfortable">Плотность: comfortable</option>
      </select>
      <button class="go" id="wbGoHub">Hub v2</button>
      <button class="go" id="wbGoCompare">Сравнение</button>
    `;
    toolbar.insertAdjacentElement("afterend", bar);

    const toast = document.createElement("div");
    toast.id = "wbV2Toast";
    document.body.appendChild(toast);
    const ping = (msg) => {
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1400);
    };

    let shotFilter = "all";
    let simpleMode = true;
    let stepMode = "select";

    const getStatus = (btn) => {
      const dot = btn.querySelector(".dot");
      if (!dot) return "todo";
      if (dot.classList.contains("done")) return "done";
      if (dot.classList.contains("active")) return "active";
      return "todo";
    };

    const applyShotFilter = () => {
      document.querySelectorAll(".shot-list .shot-btn").forEach((btn) => {
        const s = getStatus(btn);
        btn.style.display = shotFilter === "all" || shotFilter === s ? "" : "none";
      });
    };

    bar.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        bar.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
        chip.classList.add("active");
        shotFilter = chip.dataset.status || "all";
        applyShotFilter();
        ping(`Фильтр: ${chip.textContent}`);
      });
    });

    document.getElementById("wbDensity")?.addEventListener("change", (e) => {
      document.body.dataset.density = e.target.value;
      ping(`Плотность: ${e.target.value}`);
    });

    const applySimpleMode = () => {
      document.body.dataset.simple = simpleMode ? "1" : "0";
      const btn = document.getElementById("wbSimpleMode");
      if (btn) btn.classList.toggle("mode", simpleMode);
      const density = document.getElementById("wbDensity");
      if (simpleMode && density) {
        density.value = "comfortable";
        document.body.dataset.density = "comfortable";
      }
      document.querySelectorAll(".detail details").forEach((d) => {
        const title = (d.querySelector("summary")?.textContent || "").toLowerCase();
        if (simpleMode) {
          if (title.includes("диалог") || title.includes("изображения")) d.open = true;
          if (title.includes("prompt") || title.includes("чекпоинты")) d.open = false;
        }
      });
      ping(simpleMode ? "Простой режим: ON" : "Простой режим: OFF");
    };

    document.getElementById("wbSimpleMode")?.addEventListener("click", () => {
      simpleMode = !simpleMode;
      applySimpleMode();
    });

    const applyStepMode = () => {
      document.body.dataset.step = stepMode;
      bar.querySelectorAll(".step").forEach((s) => s.classList.toggle("active", s.dataset.step === stepMode));
      if (stepMode === "dialog") {
        document.querySelector('.detail details:nth-of-type(2)')?.setAttribute("open", "open");
      }
      if (stepMode === "media") {
        document.querySelector('.detail details:nth-of-type(3)')?.setAttribute("open", "open");
      }
      if (stepMode === "review") {
        document.querySelector('.detail details:nth-of-type(1)')?.setAttribute("open", "open");
        document.querySelector('.detail details:nth-of-type(4)')?.setAttribute("open", "open");
      }
      if (stepMode === "select") {
        document.querySelector(".left")?.scrollIntoView({ block: "start", behavior: "smooth" });
      } else {
        document.querySelector(".right")?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
      ping(`Режим: ${stepMode}`);
    };

    bar.querySelectorAll(".step").forEach((stepBtn) => {
      stepBtn.addEventListener("click", () => {
        stepMode = stepBtn.dataset.step || "select";
        applyStepMode();
      });
    });

    document.getElementById("wbGoHub")?.addEventListener("click", () => {
      location.href = "project_hub_v2.html";
    });
    document.getElementById("wbGoCompare")?.addEventListener("click", () => {
      location.href = "compare_old_new_v2.html#workboard";
    });

    const jumpShot = (direction) => {
      const visible = Array.from(document.querySelectorAll('.shot-list .shot-btn')).filter((b) => b.style.display !== "none");
      if (!visible.length) return;
      const current = visible.findIndex((x) => x.classList.contains("active"));
      const next = current < 0 ? 0 : Math.max(0, Math.min(visible.length - 1, current + direction));
      const target = visible[next];
      target?.click();
      visible.forEach((x) => x.classList.remove("focused"));
      target?.classList.add("focused");
      target?.scrollIntoView({ block: "nearest" });
    };

    document.addEventListener("keydown", (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key.toLowerCase() === "j") jumpShot(1);
      if (e.key.toLowerCase() === "k") jumpShot(-1);
      if (e.altKey && e.key === "1") bar.querySelector('.chip[data-status="all"]')?.click();
      if (e.altKey && e.key === "2") bar.querySelector('.chip[data-status="active"]')?.click();
      if (e.altKey && e.key === "3") bar.querySelector('.chip[data-status="todo"]')?.click();
      if (e.altKey && e.key === "4") bar.querySelector('.chip[data-status="done"]')?.click();
      if (e.ctrlKey && e.key === "1") { stepMode = "select"; applyStepMode(); }
      if (e.ctrlKey && e.key === "2") { stepMode = "dialog"; applyStepMode(); }
      if (e.ctrlKey && e.key === "3") { stepMode = "media"; applyStepMode(); }
      if (e.ctrlKey && e.key === "4") { stepMode = "review"; applyStepMode(); }
    });

    const observer = new MutationObserver(() => applyShotFilter());
    observer.observe(document.body, { subtree: true, childList: true });

    applySimpleMode();
    applyStepMode();
    applyShotFilter();
    ping("v2 режим активирован");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
