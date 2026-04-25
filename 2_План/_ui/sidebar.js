(() => {
  if (document.getElementById("tortsSidebarShell")) return;

  const run = () => {
    const path = (location.pathname || "").replace(/\\/g, "/");
    const inNested = path.includes("/storyboard_8x6/") || path.includes("/storyboard_short_ru/");
    const prefix = inNested ? "../" : "";

    const quickMain = [
      { label: "Project Hub", href: `${prefix}project_hub.html` },
      { label: "Материалы", href: `${prefix}materials_source.html` },
      { label: "Новые GEN", href: `${prefix}materials_source.html#tab=gen` },
      { label: "Кластеры сцен", href: `${prefix}scene_classifier.html` },
      { label: "Библиотека ассетов", href: `${prefix}asset_prompt_library.html` },
      { label: "Раскадровка", href: `${prefix}storyboard_workboard.html` },
      { label: "Листы 8x6", href: `${prefix}storyboard_8x6/index.html` },
      { label: "Короткая RU", href: `${prefix}storyboard_short_ru/index.html` },
      { label: "Статистика ассетов", href: `${prefix}assets_coverage_stats.html` },
      { label: "План 7 дней", href: `${prefix}plan_7_days.html` },
    ];

    const sheets8x6 = Array.from({ length: 8 }, (_, i) => ({
      label: `Лист ${String(i + 1).padStart(2, "0")}`,
      href: `${prefix}storyboard_8x6/sheet_${String(i + 1).padStart(2, "0")}.html`,
    }));

    const sheetsRu = Array.from({ length: 8 }, (_, i) => ({
      label: `RU ${String(i + 1).padStart(2, "0")}`,
      href: `${prefix}storyboard_short_ru/sheet_${String(i + 1).padStart(2, "0")}.html`,
    }));

    const groups = [
      { title: "Основное", open: true, items: quickMain },
      { title: "Шоты 8x6", open: false, items: sheets8x6 },
      { title: "Шоты RU", open: false, items: sheetsRu },
    ];

    const style = document.createElement("style");
    style.textContent = `
      .torts-sidebar-toggle{
        position:fixed;left:12px;top:12px;z-index:1200;
        border:1px solid rgba(159,196,255,.45);border-radius:12px;
        padding:8px 11px;background:rgba(35,43,58,.66);color:#ecf3ff;
        backdrop-filter:blur(6px);cursor:pointer;font:600 12px/1.1 "Trebuchet MS","Segoe UI",sans-serif;
      }
      .torts-sidebar-mask{
        position:fixed;inset:0;background:rgba(8,10,16,.35);z-index:1190;display:none;
      }
      .torts-sidebar{
        position:fixed;left:12px;top:58px;bottom:12px;width:min(340px,86vw);z-index:1210;
        transform:translateX(-110%);transition:transform .18s ease;
        background:rgba(33,40,54,.74);border:1px solid rgba(126,148,190,.42);border-radius:16px;
        box-shadow:0 14px 36px rgba(0,0,0,.35);backdrop-filter:blur(10px);
        display:grid;grid-template-rows:auto 1fr;overflow:hidden;
      }
      .torts-sidebar.open{transform:translateX(0)}
      .torts-sidebar-mask.open{display:block}
      .torts-sidebar-head{
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        padding:10px 12px;border-bottom:1px solid rgba(114,135,175,.4);
        background:linear-gradient(180deg,rgba(58,71,96,.45),rgba(38,46,62,.28));
      }
      .torts-sidebar-head-tools{display:flex;gap:6px;align-items:center}
      .torts-sidebar-head b{font:700 14px/1.1 "Trebuchet MS","Segoe UI",sans-serif;color:#edf3ff}
      .torts-sidebar-close{
        border:1px solid rgba(129,149,189,.56);border-radius:10px;background:rgba(43,52,69,.75);
        color:#ecf2fe;padding:6px 10px;cursor:pointer;font-size:12px;
      }
      .torts-sidebar-pin{
        border:1px solid rgba(129,149,189,.56);border-radius:10px;background:rgba(43,52,69,.75);
        color:#ecf2fe;padding:6px 10px;cursor:pointer;font-size:12px;
      }
      .torts-sidebar-pin.on{border-color:rgba(159,196,255,.9);background:rgba(70,95,138,.72)}
      .torts-sidebar-body{overflow:auto;padding:10px;display:grid;gap:8px}
      .torts-nav-group{
        border:1px solid rgba(105,123,158,.45);border-radius:12px;background:rgba(42,50,67,.52);
      }
      .torts-nav-group summary{
        cursor:pointer;list-style:none;padding:8px 10px;border-bottom:1px solid rgba(96,114,146,.3);
        color:#dbe6fb;font:600 12px/1.15 "Trebuchet MS","Segoe UI",sans-serif;
      }
      .torts-nav-list{display:grid;gap:6px;padding:8px}
      .torts-nav-link{
        display:block;text-decoration:none;padding:7px 9px;border-radius:9px;
        border:1px solid rgba(98,114,146,.45);background:rgba(46,56,74,.72);color:#edf2ff;font-size:12px;
      }
      .torts-nav-link:hover{border-color:rgba(147,173,220,.7)}
      .torts-nav-link.active{
        border-color:rgba(159,196,255,.88);background:rgba(75,96,131,.72);color:#ffffff;
      }
    `;
    document.head.appendChild(style);

    const shell = document.createElement("div");
    shell.id = "tortsSidebarShell";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "torts-sidebar-toggle";
    toggle.textContent = "Меню проекта";

    const mask = document.createElement("div");
    mask.className = "torts-sidebar-mask";

    const drawer = document.createElement("aside");
    drawer.className = "torts-sidebar";

    const header = document.createElement("div");
    header.className = "torts-sidebar-head";
    header.innerHTML = `<b>Навигация</b>`;

    const tools = document.createElement("div");
    tools.className = "torts-sidebar-head-tools";

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "torts-sidebar-pin";
    pin.textContent = "Закрепить";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "torts-sidebar-close";
    close.textContent = "Закрыть";
    tools.append(pin, close);
    header.appendChild(tools);

    const body = document.createElement("div");
    body.className = "torts-sidebar-body";

    const currentPath = decodeURIComponent((location.pathname || "").toLowerCase());
    const makeActive = (href) => {
      try {
        const resolved = new URL(href, location.href);
        const target = decodeURIComponent((resolved.pathname || "").toLowerCase());
        return target === currentPath ? " active" : "";
      } catch {
        return "";
      }
    };

    groups.forEach((group) => {
      const block = document.createElement("details");
      block.className = "torts-nav-group";
      if (group.open) block.open = true;

      const summary = document.createElement("summary");
      summary.textContent = group.title;
      block.appendChild(summary);

      const list = document.createElement("div");
      list.className = "torts-nav-list";
      group.items.forEach((item) => {
        const a = document.createElement("a");
        a.className = `torts-nav-link${makeActive(item.href)}`;
        a.href = item.href;
        a.textContent = item.label;
        list.appendChild(a);
      });
      block.appendChild(list);
      body.appendChild(block);
    });

    drawer.append(header, body);
    shell.append(toggle, mask, drawer);
    document.body.appendChild(shell);

    const stateKey = "torts_sidebar_open";
    const pinKey = "torts_sidebar_pinned";

    const open = () => {
      drawer.classList.add("open");
      mask.classList.add("open");
      localStorage.setItem(stateKey, "1");
    };
    const hide = (force = false) => {
      if (!force && localStorage.getItem(pinKey) === "1") return;
      drawer.classList.remove("open");
      mask.classList.remove("open");
      localStorage.setItem(stateKey, "0");
    };

    toggle.addEventListener("click", open);
    close.addEventListener("click", () => hide(true));
    mask.addEventListener("click", () => hide(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hide(false);
    });

    pin.addEventListener("click", () => {
      if (pin.classList.contains("on")) {
        pin.classList.remove("on");
        pin.textContent = "Закрепить";
        localStorage.setItem(pinKey, "0");
      } else {
        pin.classList.add("on");
        pin.textContent = "Закреплено";
        localStorage.setItem(pinKey, "1");
        open();
      }
    });

    if (localStorage.getItem(pinKey) === "1") {
      pin.classList.add("on");
      pin.textContent = "Закреплено";
      open();
      return;
    }
    if (localStorage.getItem(stateKey) === "1") {
      open();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
