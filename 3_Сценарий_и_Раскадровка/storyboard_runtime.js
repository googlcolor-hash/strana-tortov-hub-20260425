(() => {
  const COL_VIS_KEY = 'torts_col_visibility_v2';
  const KEYFRAME_STORE_KEY = 'torts_keyframe_inline_v1';
  const DIRECTOR_STORE_KEY = 'torts_director_inline_v1';
  const USER_STORE_KEY = 'torts_user_inline_v1';
  const READY_STORE_KEY = 'torts_ready_state_v1';
  const VIDEO_REL_DIR = 'video_refs_good_my/';
  const VIDEO_BY_SHOT = {
    S01B: VIDEO_REL_DIR + 'Bird_flocks_pass_202604281841.mp4',
    S03A: VIDEO_REL_DIR + 'Donut_Cookie_perform_202604281910.mp4',
    S04B: VIDEO_REL_DIR + '[08_S04B]_Shot_S04B._202604281914.mp4',
    S05A: VIDEO_REL_DIR + '[09_S05A]_Shot_S05A._202604281924.mp4',
    S05B: VIDEO_REL_DIR + 'Blin_counts_scrolls_202604281928.mp4'
  };
  const UNMAPPED_VIDEOS = [
    VIDEO_REL_DIR + 'Empty_prompt_handling_202604281937.mp4',
    VIDEO_REL_DIR + 'grok-video-5219139a-9424-4d1e-a752-e96bd16a1c03.mp4',
    VIDEO_REL_DIR + 'grok-video-761b53e1-9ca4-426e-9671-5b73671b02ee (2).mp4',
    VIDEO_REL_DIR + 'grok-video-e11d7809-1fd8-42d2-a347-8360225da0cf.mp4'
  ];
  const PUBLISHED_DIRECTOR_MAP = {
    S03A: 'director_refs_20260501/S03A_director.jpg',
    S04A: 'director_refs_20260501/S04_director.jpg',
    S04B: 'director_refs_20260501/S04_director.jpg',
    S05A: 'director_refs_20260501/S05A_director.jpg',
    S06A: 'director_refs_20260501/S06A_director.jpg',
    S07A: 'director_refs_20260501/S07A_director.jpg',
    S08: 'director_refs_20260501/S08_director.jpg',
    S09A: 'director_refs_20260501/S09_director.jpg',
    S09B: 'director_refs_20260501/S09_director.jpg',
    S10A: 'director_refs_20260501/S10A_director.jpg',
    S11A: 'director_refs_20260501/S11A_director.jpg',
    S12: 'director_refs_20260501/S12_director.jpg'
  };

  const state = {
    keyframes: loadJson(KEYFRAME_STORE_KEY),
    directors: loadJson(DIRECTOR_STORE_KEY),
    users: loadJson(USER_STORE_KEY),
    ready: loadJson(READY_STORE_KEY),
    frameFilter: 'all'
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function loadJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getPublishedKeyframes() {
    const map = {};
    document.querySelectorAll('tr[data-shot]').forEach((row) => {
      const shot = row.dataset.shot;
      map[shot] = '../4_Ключевые_кадры/control_20260426/' + shot + '_control.png';
    });
    return map;
  }

  function setWrapState(wrap, attr, value) {
    if (wrap) wrap.setAttribute(attr, value);
  }

  function renderImageBlock(kind, shot, wrap, img, empty, clearBtn) {
    const isDirector = kind === 'director';
    const isUser = kind === 'user';
    const store = isDirector ? state.directors : (isUser ? state.users : state.keyframes);
    const published = isDirector ? PUBLISHED_DIRECTOR_MAP : (isUser ? {} : getPublishedKeyframes());
    const dataAttr = isDirector ? 'data-director-state' : (isUser ? 'data-user-state' : 'data-frame-state');
    const manualSrc = store[shot];
    const publishedSrc = published[shot];
    const src = manualSrc || publishedSrc || '';
    const currentState = manualSrc ? 'manual' : (publishedSrc ? (isDirector ? 'published' : 'auto') : 'empty');

    if (src) {
      img.onerror = () => {
        img.onerror = null;
        img.removeAttribute('src');
        img.style.display = 'none';
        empty.style.display = '';
        clearBtn.style.visibility = manualSrc ? 'visible' : 'hidden';
        clearBtn.disabled = !manualSrc;
        setWrapState(wrap, dataAttr, manualSrc ? 'manual' : 'empty');
        if (!isDirector && !isUser) {
          const cell = wrap.closest('td');
          if (cell) cell.dataset.frameState = manualSrc ? 'manual' : 'empty';
          const row = wrap.closest('tr[data-shot]');
          if (row) row.dataset.frameState = manualSrc ? 'manual' : 'empty';
        }
      };
      img.src = src;
      img.style.display = '';
      empty.style.display = 'none';
      clearBtn.style.visibility = 'visible';
      clearBtn.disabled = false;
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      empty.style.display = '';
      clearBtn.style.visibility = 'hidden';
      clearBtn.disabled = true;
    }

    setWrapState(wrap, dataAttr, currentState);
    if (!isDirector && !isUser) {
      const cell = wrap.closest('td');
      if (cell) cell.dataset.frameState = currentState;
      const row = wrap.closest('tr[data-shot]');
      if (row) row.dataset.frameState = currentState;
    }
  }

  function handleUpload(kind, shot, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const target = kind === 'director' ? state.directors : (kind === 'user' ? state.users : state.keyframes);
      target[shot] = String(reader.result || '');
      saveJson(kind === 'director' ? DIRECTOR_STORE_KEY : (kind === 'user' ? USER_STORE_KEY : KEYFRAME_STORE_KEY), target);
      refreshShot(shot);
      updateSummary();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function handleClear(kind, shot) {
    const target = kind === 'director' ? state.directors : (kind === 'user' ? state.users : state.keyframes);
    delete target[shot];
    saveJson(kind === 'director' ? DIRECTOR_STORE_KEY : (kind === 'user' ? USER_STORE_KEY : KEYFRAME_STORE_KEY), target);
    refreshShot(shot);
    updateSummary();
  }

  function refreshShot(shot) {
    const kfWrap = document.querySelector('.kf-wrap[data-shot="' + shot + '"]');
    if (kfWrap) {
      renderImageBlock('keyframe', shot, kfWrap, kfWrap.querySelector('.kf-img'), kfWrap.querySelector('.kf-empty'), kfWrap.querySelector('.kf-btn-clear'));
    }
    const dirWrap = document.querySelector('.dir-wrap[data-shot="' + shot + '"]');
    if (dirWrap) {
      renderImageBlock('director', shot, dirWrap, dirWrap.querySelector('.dir-img'), dirWrap.querySelector('.dir-empty'), dirWrap.querySelector('.dir-btn-clear'));
    }
    const userWrap = document.querySelector('.user-wrap[data-shot="' + shot + '"]');
    if (userWrap) {
      renderImageBlock('user', shot, userWrap, userWrap.querySelector('.user-img'), userWrap.querySelector('.user-empty'), userWrap.querySelector('.user-btn-clear'));
    }

    const row = document.querySelector('tr[data-shot="' + shot + '"]');
    if (row) {
      const ready = !!state.ready[shot];
      row.classList.toggle('shot-ready', ready);
      row.dataset.ready = ready ? '1' : '0';
      const readyCell = row.querySelector('td.col-ready');
      if (readyCell) {
        const check = readyCell.querySelector('.ready-check');
        const print = readyCell.querySelector('.ready-print');
        if (check) check.checked = ready;
        if (print) print.textContent = ready ? '✓' : '☐';
      }
    }
  }

  function ensureUserSlotsAndStyles() {
    if (!document.getElementById('storyboard-user-slot-style')) {
      const style = document.createElement('style');
      style.id = 'storyboard-user-slot-style';
      style.textContent = `
        :root {
          --shot-thumb-w: 192px;
          --shot-thumb-h: 108px;
          --shot-wrap-w: 216px;
          --shot-wrap-h: 128px;
        }
        .kf-img, .kf-empty, .dir-img, .dir-empty, .user-img, .user-empty {
          width:var(--shot-thumb-w) !important;
          height:var(--shot-thumb-h) !important;
        }
        .kf-wrap, .dir-wrap, .user-wrap {
          width:var(--shot-wrap-w) !important;
          min-height:var(--shot-wrap-h) !important;
        }
        .user-head { margin-top:6px; margin-bottom:4px; color:#a6bddf; font-size:11px; text-transform:uppercase; letter-spacing:.08em; text-align:center; font-weight:700; }
        .user-wrap {
          position:relative; display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(120,146,182,.34);
          border-radius:12px; background:rgba(12,18,30,.6); overflow:visible;
          margin-top:8px; margin-left:auto; margin-right:auto;
        }
        .user-img { object-fit:cover; border:1px dashed rgba(120,146,182,.5); border-radius:10px; display:block; transition:transform .14s ease, box-shadow .14s ease, border-color .14s ease; background:#0f1626; cursor:zoom-in; }
        .user-img:hover, .user-img:focus-visible { transform:scale(3); z-index:30; border-color:var(--accent); box-shadow:0 10px 24px rgba(0,0,0,.5); }
        .user-empty { color:#95a7c5; font-size:12px; display:flex; align-items:center; justify-content:center; border:1px dashed rgba(120,146,182,.42); border-radius:10px; }
        .user-actions { position:absolute; left:6px; bottom:6px; display:flex; gap:6px; z-index:2; }
        .user-btn-upload, .user-btn-clear { width:20px; height:20px; border-radius:999px; border:1px solid rgba(128,153,191,.46); background:#1f314d; color:#dce8ff; font-size:12px; line-height:1; cursor:pointer; }
        .user-btn-clear { background:#362035; color:#ffd1e1; }
        .user-wrap[data-user-state='manual'] { border-color:rgba(121,217,146,.46); box-shadow:inset 0 0 0 1px rgba(121,217,146,.1); }
        .col-video { width:14%; min-width:170px; }
        .video-wrap { display:grid; gap:6px; }
        .video-el {
          width:100%; aspect-ratio:16 / 9; border:1px solid rgba(98,115,145,.64);
          border-radius:8px; background:#0f1725;
        }
        .video-empty {
          width:100%; aspect-ratio:16 / 9; border:1px dashed rgba(98,115,145,.64);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          color:#93a6c8; font-size:11px; text-align:center; padding:6px;
        }
        .video-meta { font-size:10px; color:#a9b7d3; line-height:1.3; }
        .video-link-btn { width:100%; height:24px; font-size:11px; padding:0 8px; border-radius:6px; }
        .video-list { display:grid; gap:6px; margin-top:8px; }
        .video-list a { color:#d2e4ff; font-size:11px; }
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll('.dir-wrap[data-shot]').forEach((dirWrap) => {
      const shot = dirWrap.dataset.shot;
      const block = dirWrap.closest('.dir-block');
      if (!block || block.querySelector('.user-wrap[data-shot="' + shot + '"]')) return;

      const head = document.createElement('div');
      head.className = 'user-head';
      head.textContent = 'Мой кадр';

      const wrap = document.createElement('div');
      wrap.className = 'user-wrap';
      wrap.setAttribute('data-shot', shot);
      wrap.innerHTML = `
        <img class="user-img" alt="user ${shot}" style="display:none">
        <div class="user-empty">мой кадр</div>
        <div class="user-actions no-print">
          <button type="button" class="user-btn-upload" data-shot="${shot}">+</button>
          <button type="button" class="user-btn-clear" data-shot="${shot}" title="Очистить">×</button>
          <input type="file" accept="image/*" class="user-input" data-shot="${shot}" style="display:none">
        </div>
      `;
      block.appendChild(head);
      block.appendChild(wrap);
    });
  }

  function ensureVideoColumnControl() {
    const controls = document.getElementById('colControls');
    if (!controls) return;
    if (!controls.querySelector('input[data-col="9"]')) {
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" data-col="9" checked> <span>Видео</span>';
      controls.appendChild(label);
    }
  }

  function ensureVideoColumn() {
    const headRow = document.querySelector('#scenarioTable thead tr');
    if (headRow && !headRow.querySelector('th.col-video')) {
      const th = document.createElement('th');
      th.className = 'col-video';
      th.setAttribute('data-col', '9');
      th.textContent = 'Видео';
      const readyHead = headRow.querySelector('th.col-ready');
      if (readyHead) headRow.insertBefore(th, readyHead);
      else headRow.appendChild(th);
    }

    shots().forEach((row) => {
      if (row.querySelector('td.col-video')) return;
      const shot = row.dataset.shot || '';
      const src = VIDEO_BY_SHOT[shot] || '';
      const td = document.createElement('td');
      td.className = 'col-video';
      td.setAttribute('data-col', '9');
      if (src) {
        td.innerHTML = `
          <div class="video-wrap">
            <video class="video-el" controls preload="metadata">
              <source src="${src}" type="video/mp4">
            </video>
            <button type="button" class="video-link-btn no-print" data-open-video="${src}">Открыть отдельно</button>
            <div class="video-meta">${src.split('/').pop()}</div>
          </div>
        `;
      } else {
        td.innerHTML = '<div class="video-empty">Видео пока не добавлено</div>';
      }
      const readyCell = row.querySelector('td.col-ready');
      if (readyCell) row.insertBefore(td, readyCell);
      else row.appendChild(td);
    });

    document.querySelectorAll('[data-open-video]').forEach((btn) => {
      if (btn.dataset.boundOpenVideo === '1') return;
      btn.dataset.boundOpenVideo = '1';
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-open-video');
        if (src) window.open(src, '_self');
      });
    });
  }

  function ensureUnmappedVideoList() {
    const anchor = document.querySelector('.table-wrap');
    if (!anchor) return;
    if (document.getElementById('unmappedVideoList')) return;
    const block = document.createElement('div');
    block.id = 'unmappedVideoList';
    block.className = 'legend';
    block.innerHTML = `
      <h2>Видео без привязки к шоту</h2>
      <div class="video-list">
        ${UNMAPPED_VIDEOS.map((v) => `<a href="${v}" target="_self">${v.split('/').pop()}</a>`).join('')}
      </div>
    `;
    anchor.parentNode.insertBefore(block, anchor.nextSibling);
  }

  function getColChecks() {
    return Array.from(document.querySelectorAll('#colControls input[data-col]'));
  }

  function applyColVisibility() {
    const checks = getColChecks();
    const vis = {};
    checks.forEach((input) => {
      vis[input.dataset.col] = !!input.checked;
    });

    document.querySelectorAll('th[data-col], td[data-col]').forEach((cell) => {
      const col = cell.getAttribute('data-col');
      const isShown = vis[col] !== false;
      cell.classList.toggle('hidden-col', !isShown);
    });
    localStorage.setItem(COL_VIS_KEY, JSON.stringify(vis));
    updateFrameSizingByLayout();
  }

  function restoreColVisibility() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(COL_VIS_KEY) || 'null');
    } catch {
      saved = null;
    }
    if (!saved || typeof saved !== 'object') return;
    getColChecks().forEach((input) => {
      const key = input.dataset.col;
      if (Object.prototype.hasOwnProperty.call(saved, key)) {
        input.checked = !!saved[key];
      }
    });
  }

  function visibleColumnCount() {
    const checks = getColChecks();
    if (!checks.length) return 8;
    return checks.filter((c) => c.checked).length;
  }

  function getEffectiveKeyframeCellWidth() {
    const sampleCell = document.querySelector('tbody tr[data-shot] td.col-keyframe:not(.hidden-col)');
    if (sampleCell && sampleCell.clientWidth > 40) return sampleCell.clientWidth;
    const sampleHead = document.querySelector('th.col-keyframe:not(.hidden-col)');
    if (sampleHead && sampleHead.clientWidth > 40) return sampleHead.clientWidth;
    const wrap = document.querySelector('.table-wrap');
    const width = wrap ? wrap.clientWidth : window.innerWidth;
    const visibleCols = Math.max(2, visibleColumnCount());
    return width / visibleCols;
  }

  function updateFrameSizingByLayout() {
    const root = document.documentElement;
    const baseCell = getEffectiveKeyframeCellWidth();
    const thumbW = clamp(Math.round(baseCell * 0.9), 128, 420);
    const thumbH = Math.round(thumbW * 9 / 16);
    const wrapW = clamp(thumbW + 24, 150, 444);
    const wrapH = thumbH + 28;

    root.style.setProperty('--shot-thumb-w', thumbW + 'px');
    root.style.setProperty('--shot-thumb-h', thumbH + 'px');
    root.style.setProperty('--shot-wrap-w', wrapW + 'px');
    root.style.setProperty('--shot-wrap-h', wrapH + 'px');
  }

  function initShotJump() {
    const input = document.getElementById('shotJumpInput');
    const btn = document.getElementById('jumpShotBtn');
    const datalist = document.getElementById('shotJumpList');
    if (!input || !btn) return;

    const ids = shots().map((r) => (r.dataset.shot || '').trim()).filter(Boolean);
    if (datalist) {
      datalist.innerHTML = ids.map((id) => '<option value="' + id + '"></option>').join('');
    }

    const go = () => {
      const raw = String(input.value || '').trim().toUpperCase();
      if (!raw) return;
      const row = document.querySelector('tr[data-shot="' + raw + '"]');
      if (!row) return;
      if (row.style.display === 'none') applyFrameFilter('all');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('shot-focus-flash');
      setTimeout(() => row.classList.remove('shot-focus-flash'), 1200);
    };

    btn.addEventListener('click', go);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        go();
      }
    });
  }

  function installHorizontalCollapseTools() {
    const panel = document.getElementById('colPanel');
    const controls = document.getElementById('colControls');
    if (!panel || !controls) return;

    if (!panel.querySelector('.col-collapse-tools')) {
      const bar = document.createElement('div');
      bar.className = 'col-collapse-tools';
      bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px;';
      bar.innerHTML = `
        <button type="button" data-cact="compact">Свернуть текстовые</button>
        <button type="button" data-cact="focus-frames">Фокус на кадрах</button>
        <button type="button" data-cact="show-all">Показать все</button>
      `;
      panel.insertBefore(bar, controls);
      bar.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-cact]');
        if (!btn) return;
        const mode = btn.getAttribute('data-cact');
        const setOn = (arr, on) => {
          getColChecks().forEach((c) => {
            if (arr.includes(c.dataset.col)) c.checked = on;
          });
        };
        if (mode === 'compact') {
          setOn(['4', '5', '6', '8'], false);
          setOn(['1', '2', '3', '7'], true);
        } else if (mode === 'focus-frames') {
          setOn(['2', '7'], true);
          setOn(['1', '3', '4', '5', '6', '8'], false);
        } else if (mode === 'show-all') {
          getColChecks().forEach((c) => {
            c.checked = true;
          });
        }
        applyColVisibility();
      });
    }

    getColChecks().forEach((input) => {
      if (input.dataset.boundColVis === '1') return;
      input.dataset.boundColVis = '1';
      input.addEventListener('change', applyColVisibility);
    });
    restoreColVisibility();
    applyColVisibility();

    window.addEventListener('resize', updateFrameSizingByLayout, { passive: true });
  }

  function initReadyColumn() {
    document.querySelectorAll('tr[data-shot]').forEach((row) => {
      const shot = row.dataset.shot;
      const cell = row.querySelector('td.col-ready');
      if (!cell) return;
      cell.classList.add('ready-cell');
      cell.innerHTML = '<label class="ready-wrap"><input type="checkbox" class="ready-check"><span>готово</span></label><span class="ready-print">☐</span>';
      const check = cell.querySelector('.ready-check');
      check.addEventListener('change', () => {
        state.ready[shot] = !!check.checked;
        saveJson(READY_STORE_KEY, state.ready);
        refreshShot(shot);
        updateSummary();
      });
      refreshShot(shot);
    });
  }

  function bindMediaControls() {
    document.querySelectorAll('.kf-wrap[data-shot]').forEach((wrap) => {
      const shot = wrap.dataset.shot;
      const input = wrap.querySelector('.kf-input');
      wrap.querySelector('.kf-btn-upload')?.addEventListener('click', () => input?.click());
      wrap.querySelector('.kf-btn-clear')?.addEventListener('click', () => handleClear('keyframe', shot));
      input?.addEventListener('change', () => handleUpload('keyframe', shot, input));
      renderImageBlock('keyframe', shot, wrap, wrap.querySelector('.kf-img'), wrap.querySelector('.kf-empty'), wrap.querySelector('.kf-btn-clear'));
    });

    document.querySelectorAll('.dir-wrap[data-shot]').forEach((wrap) => {
      const shot = wrap.dataset.shot;
      const input = wrap.querySelector('.dir-input');
      wrap.querySelector('.dir-btn-upload')?.addEventListener('click', () => input?.click());
      wrap.querySelector('.dir-btn-clear')?.addEventListener('click', () => handleClear('director', shot));
      input?.addEventListener('change', () => handleUpload('director', shot, input));
      renderImageBlock('director', shot, wrap, wrap.querySelector('.dir-img'), wrap.querySelector('.dir-empty'), wrap.querySelector('.dir-btn-clear'));
    });

    document.querySelectorAll('.user-wrap[data-shot]').forEach((wrap) => {
      const shot = wrap.dataset.shot;
      const input = wrap.querySelector('.user-input');
      wrap.querySelector('.user-btn-upload')?.addEventListener('click', () => input?.click());
      wrap.querySelector('.user-btn-clear')?.addEventListener('click', () => handleClear('user', shot));
      input?.addEventListener('change', () => handleUpload('user', shot, input));
      renderImageBlock('user', shot, wrap, wrap.querySelector('.user-img'), wrap.querySelector('.user-empty'), wrap.querySelector('.user-btn-clear'));
    });
  }

  function shots() {
    return Array.from(document.querySelectorAll('tr[data-shot]'));
  }

  function applyFrameFilter(filter) {
    state.frameFilter = filter;
    shots().forEach((row) => {
      const frameState = row.dataset.frameState || 'empty';
      const ready = row.dataset.ready === '1';
      let show = true;
      if (filter === 'auto') show = frameState === 'auto';
      if (filter === 'manual') show = frameState === 'manual';
      if (filter === 'empty') show = frameState === 'empty';
      if (filter === 'ready') show = ready;
      row.style.display = show ? '' : 'none';
    });
    document.querySelectorAll('.filter-chip[data-frame-filter]').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.frameFilter === filter);
    });
  }

  function updateSummary() {
    const rows = shots();
    let auto = 0, manual = 0, empty = 0, ready = 0;
    rows.forEach((row) => {
      const frameState = row.dataset.frameState || 'empty';
      if (frameState === 'auto') auto += 1;
      else if (frameState === 'manual') manual += 1;
      else empty += 1;
      if (row.dataset.ready === '1') ready += 1;
    });

    setText('autoFrameCount', auto);
    setText('manualFrameCount', manual);
    setText('emptyFrameCount', empty);
    setText('missingFrameCount', empty);
    setText('readyFrameCount', ready);
    setText('countAuto', auto);
    setText('countManual', manual);
    setText('countMissing', empty);
    setText('countReady', ready);

    applyFrameFilter(state.frameFilter || 'all');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function initFilters() {
    document.querySelectorAll('.filter-chip[data-frame-filter]').forEach((chip) => {
      chip.addEventListener('click', () => applyFrameFilter(chip.dataset.frameFilter || 'all'));
    });
    const toggle = document.getElementById('toggleControlOnly');
    if (toggle) {
      let active = false;
      toggle.addEventListener('click', () => {
        active = !active;
        applyFrameFilter(active ? 'auto' : 'all');
        toggle.classList.toggle('active', active);
      });
    }
    const nextAutoBtn = document.getElementById('nextAutoBtn');
    if (nextAutoBtn) {
      nextAutoBtn.addEventListener('click', () => {
        const visibleRows = shots().filter((row) => row.style.display !== 'none' && (row.dataset.frameState === 'auto'));
        const current = document.activeElement?.closest?.('tr[data-shot]');
        let idx = visibleRows.findIndex((row) => row === current);
        idx = idx >= 0 ? idx + 1 : 0;
        const next = visibleRows[idx] || visibleRows[0];
        if (next) {
          next.scrollIntoView({ behavior: 'smooth', block: 'center' });
          next.querySelector('.shot-code')?.focus?.();
        }
      });
    }
  }

  function init() {
    if (window.__tortsRuntimeInitialized) return;
    window.__tortsRuntimeInitialized = true;
    ensureVideoColumnControl();
    ensureVideoColumn();
    ensureUserSlotsAndStyles();
    ensureUnmappedVideoList();
    installHorizontalCollapseTools();
    bindMediaControls();
    initReadyColumn();
    initFilters();
    initShotJump();
    updateSummary();
    updateFrameSizingByLayout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

