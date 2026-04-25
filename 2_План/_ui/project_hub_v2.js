(() => {
  const onReady = () => {
    if (document.getElementById("hubV2Tools")) return;
    document.body.classList.add("hub-v2");

    const tabs = document.getElementById("tabs");
    if (!tabs) return;

    const panel = document.createElement("section");
    panel.id = "hubV2Tools";
    panel.innerHTML = `
      <button class="chip active" data-status="all">Все этапы</button>
      <button class="chip" data-status="in_progress">В работе</button>
      <button class="chip" data-status="todo">Ожидает</button>
      <input id="hubV2Search" type="search" placeholder="Фильтр задач/файлов по тексту..." />
      <button class="go" id="hubV2GoWorkboard">Workboard v2</button>
      <button class="ghost" id="hubV2GoCompare">Сравнение</button>
    `;
    tabs.insertAdjacentElement("afterend", panel);

    const toast = document.createElement("div");
    toast.id = "hubV2Toast";
    document.body.appendChild(toast);

    const showToast = (text) => {
      toast.textContent = text;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1400);
    };

    let status = "all";

    const applyTabFilter = () => {
      document.querySelectorAll("#tabs .tab").forEach((btn) => {
        const dot = btn.querySelector(".dot");
        const st = dot?.classList.contains("in_progress")
          ? "in_progress"
          : dot?.classList.contains("done")
            ? "done"
            : "todo";
        btn.style.display = status === "all" || status === st ? "" : "none";
      });
    };

    const applySearchFilter = () => {
      const q = (document.getElementById("hubV2Search")?.value || "").trim().toLowerCase();
      ["tasks", "results", "openQuestions"].forEach((id) => {
        const host = document.getElementById(id);
        if (!host) return;
        host.querySelectorAll("li").forEach((li) => {
          li.style.display = !q || li.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
      const files = document.getElementById("files");
      if (files) {
        files.querySelectorAll(".fbtn").forEach((b) => {
          b.style.display = !q || b.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      }
    };

    panel.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        panel.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        status = chip.dataset.status || "all";
        applyTabFilter();
        showToast(`Фильтр этапов: ${chip.textContent}`);
      });
    });

    document.getElementById("hubV2Search")?.addEventListener("input", applySearchFilter);

    document.getElementById("hubV2GoWorkboard")?.addEventListener("click", () => {
      location.href = "storyboard_workboard_v2.html";
    });
    document.getElementById("hubV2GoCompare")?.addEventListener("click", () => {
      location.href = "compare_old_new_v2.html";
    });

    document.addEventListener("keydown", (e) => {
      if (!e.altKey) return;
      if (e.key === "1") panel.querySelector('.chip[data-status="all"]')?.click();
      if (e.key === "2") panel.querySelector('.chip[data-status="in_progress"]')?.click();
      if (e.key === "3") panel.querySelector('.chip[data-status="todo"]')?.click();
    });

    const observer = new MutationObserver(() => {
      applyTabFilter();
      applySearchFilter();
    });
    observer.observe(document.body, { subtree: true, childList: true });

    applyTabFilter();
    applySearchFilter();
    showToast("v2 режим активирован");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
})();
