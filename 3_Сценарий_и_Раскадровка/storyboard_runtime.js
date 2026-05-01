(() => {
  const COL_VIS_KEY = 'torts_col_visibility_v2';
  const COL_WIDTH_KEY = 'torts_col_widths_v2';
  const KEYFRAME_STORE_KEY = 'torts_keyframe_inline_v1';
  const DIRECTOR_STORE_KEY = 'torts_director_inline_v1';
  const USER_STORE_KEY = 'torts_user_inline_v1';
  const READY_STORE_KEY = 'torts_ready_state_v1';
  const TEXT_STORE_KEY = 'torts_text_inline_v1';
  const DIRECTOR_TEXT_STORE_KEY = 'torts_director_text_v1';
  const DIRECTOR_TAB_NOTE_STORE_KEY = 'torts_director_tab_notes_v1';
  const VIDEO_STORE_KEY = 'torts_video_slots_v1';
  const MASTER_AUDIO_SRC = 'audio/strana_tortov_reading_v2.mp3';
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
    videos: loadJson(VIDEO_STORE_KEY),
    text: loadJson(TEXT_STORE_KEY),
    directorText: loadJson(DIRECTOR_TEXT_STORE_KEY),
    directorTabNotes: loadJson(DIRECTOR_TAB_NOTE_STORE_KEY),
    widths: loadJson(COL_WIDTH_KEY),
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

  function getShotVideos(shot) {
    if (!state.videos || typeof state.videos !== 'object') state.videos = {};
    const current = state.videos[shot] && typeof state.videos[shot] === 'object' ? state.videos[shot] : {};
    return {
      draft: typeof current.draft === 'string' ? current.draft : (VIDEO_BY_SHOT[shot] || ''),
      director: typeof current.director === 'string' ? current.director : '',
      mine: typeof current.mine === 'string' ? current.mine : ''
    };
  }

  function saveShotVideos(shot, payload) {
    state.videos[shot] = {
      draft: String(payload.draft || ''),
      director: String(payload.director || ''),
      mine: String(payload.mine || '')
    };
    saveJson(VIDEO_STORE_KEY, state.videos);
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('saveJson failed for key:', key, err);
    }
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
      wrap.classList.toggle('storyboard-symbolic', shot === 'S01A' && !!src);
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
        .col-video { width:220px; min-width:160px; }
        .video-stack { display:grid; gap:8px; }
        .video-slot { border:1px solid rgba(98,115,145,.52); border-radius:8px; background:rgba(15,23,37,.62); padding:6px; }
        .video-slot-head { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px; }
        .video-slot-title { font-size:10px; color:#a9b7d3; text-transform:uppercase; letter-spacing:.08em; }
        .video-slot-actions { display:flex; gap:4px; }
        .video-slot-btn { min-width:20px; height:20px; padding:0 6px; border-radius:6px; font-size:11px; line-height:1; }
        .video-wrap { display:grid; gap:4px; }
        .video-el {
          width:var(--video-thumb-w, 100%); max-width:100%; aspect-ratio:16 / 9; border:1px solid rgba(98,115,145,.64);
          border-radius:8px; background:#0f1725;
        }
        .video-empty {
          width:var(--video-thumb-w, 100%); max-width:100%; aspect-ratio:16 / 9; border:1px dashed rgba(98,115,145,.64);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          color:#93a6c8; font-size:11px; text-align:center; padding:6px;
        }
        .video-meta { font-size:10px; color:#a9b7d3; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .video-link-btn { width:100%; height:24px; font-size:11px; padding:0 8px; border-radius:6px; }
        .video-list { display:grid; gap:6px; margin-top:8px; }
        .video-list a { color:#d2e4ff; font-size:11px; }
        .col-collapse-strip {
          position:absolute; left:0; top:0; width:12px; height:100%;
          border-right:1px solid rgba(142,184,255,.32);
          background:linear-gradient(180deg, rgba(142,184,255,.18), rgba(142,184,255,.08));
          cursor:pointer; opacity:.9;
        }
        .col-collapse-strip:hover { opacity:1; background:linear-gradient(180deg, rgba(142,184,255,.34), rgba(142,184,255,.14)); }
        th[data-col] { position:sticky; padding-left:14px; }
        .collapsed-cols-rail {
          position:fixed; left:4px; top:120px; z-index:55;
          display:grid; gap:4px; max-height:70vh; overflow:auto;
          padding:6px; border:1px solid rgba(142,184,255,.24);
          border-radius:10px; background:rgba(15,22,34,.7); backdrop-filter:blur(8px);
        }
        .collapsed-col-pill {
          width:18px; min-height:58px; border-radius:8px; border:1px solid rgba(142,184,255,.35);
          background:rgba(38,52,76,.88); color:#dce9ff; font-size:10px; padding:4px 2px;
          writing-mode:vertical-rl; transform:rotate(180deg); cursor:pointer; line-height:1.1;
          text-align:center;
        }
        .collapsed-col-pill.inactive {
          opacity:.26;
          filter:saturate(.65);
        }
        .collapsed-col-pill.active {
          opacity:1;
        }
        .collapsed-col-pill:hover { border-color:#8eb8ff; background:#37527d; }
        .kf-wrap.storyboard-symbolic .kf-img {
          filter: grayscale(1) contrast(1.26) brightness(1.08) sepia(.16);
        }
        .kf-wrap.storyboard-symbolic::after {
          content:'';
          position:absolute;
          inset:8px;
          pointer-events:none;
          border-radius:10px;
          background:repeating-linear-gradient(135deg, rgba(18,22,30,0) 0 8px, rgba(18,22,30,.08) 8px 9px);
          mix-blend-mode:multiply;
        }
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
      const keyHead = headRow.querySelector('th.col-keyframe');
      if (keyHead && keyHead.nextSibling) headRow.insertBefore(th, keyHead.nextSibling);
      else headRow.appendChild(th);
    }

    shots().forEach((row) => {
      if (row.querySelector('td.col-video')) return;
      const shot = row.dataset.shot || '';
      const td = document.createElement('td');
      td.className = 'col-video';
      td.setAttribute('data-col', '9');
      td.innerHTML = `
        <div class="video-stack" data-shot="${shot}">
          ${renderVideoSlotMarkup(shot, 'draft', 'Черновая')}
          ${renderVideoSlotMarkup(shot, 'director', 'Режиссёрская')}
          ${renderVideoSlotMarkup(shot, 'mine', 'Моя')}
        </div>
      `;
      const kfCell = row.querySelector('td.col-keyframe');
      if (kfCell && kfCell.nextSibling) row.insertBefore(td, kfCell.nextSibling);
      else row.appendChild(td);
    });
    bindVideoControls();
  }

  function renderVideoSlotMarkup(shot, slot, title) {
    const videos = getShotVideos(shot);
    const src = String(videos[slot] || '');
    const media = src
      ? `<div class="video-wrap">
          <video class="video-el" controls preload="metadata">
            <source src="${src}" type="video/mp4">
          </video>
          <button type="button" class="video-link-btn no-print" data-open-video="${shot}|${slot}">Открыть отдельно</button>
          <div class="video-meta">${src.split('/').pop()}</div>
        </div>`
      : '<div class="video-empty">Видео не добавлено</div>';
    return `
      <div class="video-slot" data-shot="${shot}" data-slot="${slot}">
        <div class="video-slot-head">
          <div class="video-slot-title">${title}</div>
          <div class="video-slot-actions no-print">
            <button type="button" class="video-slot-btn" data-video-add="${shot}|${slot}" title="Добавить ссылку на видео">+</button>
            <button type="button" class="video-slot-btn" data-video-clear="${shot}|${slot}" title="Удалить видео">×</button>
          </div>
        </div>
        ${media}
      </div>
    `;
  }

  function refreshVideoSlot(shot, slot) {
    const node = document.querySelector('.video-slot[data-shot="' + shot + '"][data-slot="' + slot + '"]');
    if (!node) return;
    const titleMap = { draft: 'Черновая', director: 'Режиссёрская', mine: 'Моя' };
    node.outerHTML = renderVideoSlotMarkup(shot, slot, titleMap[slot] || slot);
    bindVideoControls();
    updateFrameSizingByLayout();
  }

  function bindVideoControls() {
    document.querySelectorAll('[data-open-video]').forEach((btn) => {
      if (btn.dataset.boundOpenVideo === '1') return;
      btn.dataset.boundOpenVideo = '1';
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-open-video') || '';
        const [shot, slot] = key.split('|');
        const videos = getShotVideos(String(shot || ''));
        const src = String(videos[String(slot || '')] || '');
        if (src) window.open(src, '_self');
      });
    });
    document.querySelectorAll('[data-video-add]').forEach((btn) => {
      if (btn.dataset.boundVideoAdd === '1') return;
      btn.dataset.boundVideoAdd = '1';
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-video-add') || '';
        const [shot, slot] = key.split('|');
        if (!shot || !slot) return;
        const videos = getShotVideos(shot);
        const prev = String(videos[slot] || '');
        const next = prompt('Вставьте ссылку/путь к видео (.mp4):', prev);
        if (next === null) return;
        videos[slot] = String(next || '').trim();
        saveShotVideos(shot, videos);
        refreshVideoSlot(shot, slot);
      });
    });
    document.querySelectorAll('[data-video-clear]').forEach((btn) => {
      if (btn.dataset.boundVideoClear === '1') return;
      btn.dataset.boundVideoClear = '1';
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-video-clear') || '';
        const [shot, slot] = key.split('|');
        if (!shot || !slot) return;
        const videos = getShotVideos(shot);
        videos[slot] = '';
        saveShotVideos(shot, videos);
        refreshVideoSlot(shot, slot);
      });
    });
  }

  function ensurePromptColumnConsistency() {
    shots().forEach((row) => {
      let td = row.querySelector('td[data-col="8"]');
      if (!td) {
        td = document.createElement('td');
        td.className = 'col-prompt';
        td.setAttribute('data-col', '8');
        td.innerHTML = `
          <div class="prompt-actions no-print">
            <button type="button" class="prompt-copy-btn">Copy</button>
          </div>
          <textarea class="g-text" placeholder="Промпт для этого шота"></textarea>
        `;
        const readyCell = row.querySelector('td.col-ready');
        if (readyCell) row.insertBefore(td, readyCell);
        else row.appendChild(td);
      }
      const shot = row.dataset.shot || '';
      const ta = td.querySelector('textarea.g-text');
      if (ta && !String(ta.value || '').trim()) {
        const promptMap = window.TORTS_PROMPT_MAP || {};
        const p = promptMap[shot] || '';
        if (p) ta.value = p;
      }
    });

    document.querySelectorAll('.prompt-copy-btn').forEach((btn) => {
      if (btn.dataset.boundCopyPrompt === '1') return;
      btn.dataset.boundCopyPrompt = '1';
      btn.addEventListener('click', async () => {
        const td = btn.closest('td.col-prompt');
        const ta = td ? td.querySelector('textarea.g-text') : null;
        const text = ta ? String(ta.value || '').trim() : '';
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add('done');
          setTimeout(() => btn.classList.remove('done'), 900);
        } catch {
          btn.classList.add('fail');
          setTimeout(() => btn.classList.remove('fail'), 900);
        }
      });
    });
  }

  function ensureDirectorTextByShot() {
    shots().forEach((row) => {
      const shot = row.dataset.shot || '';
      const keyCell = row.querySelector('td.col-keyframe');
      if (!keyCell) return;
      if (!keyCell.querySelector('.director-text-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'director-text-wrap';
        wrap.style.cssText = 'margin-top:6px;display:grid;gap:4px;';
        wrap.innerHTML = `
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9fc0f5;font-weight:700;">Текст режиссёра</div>
          <textarea class="director-text-input" data-shot="${shot}" placeholder="Комментарий/задача режиссёра для этого шота" style="width:100%;min-height:56px;border:1px solid #4c5d79;border-radius:8px;background:#182131;color:#eaf0ff;padding:6px;font:inherit;"></textarea>
        `;
        keyCell.appendChild(wrap);
      }
      const ta = keyCell.querySelector('.director-text-input');
      if (!ta) return;
      if (typeof state.directorText[shot] === 'string') ta.value = state.directorText[shot];
      if (ta.dataset.boundDirectorText === '1') return;
      ta.dataset.boundDirectorText = '1';
      const save = () => {
        state.directorText[shot] = String(ta.value || '');
        saveJson(DIRECTOR_TEXT_STORE_KEY, state.directorText);
      };
      ta.addEventListener('input', save);
      ta.addEventListener('change', save);
      ta.addEventListener('blur', save);
    });
  }

  function ensureDirectorTextInTabs() {
    document.querySelectorAll('.glossary-block').forEach((block, idx) => {
      const inner = block.querySelector('.glossary-inner');
      if (!inner) return;
      const key = 'tab_' + idx;
      if (!inner.querySelector('.director-tab-note')) {
        const w = document.createElement('div');
        w.className = 'director-tab-note';
        w.style.cssText = 'margin:0 0 8px;display:grid;gap:4px;';
        w.innerHTML = `
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9fc0f5;font-weight:700;">Текст режиссёра (вкладка)</div>
          <textarea class="director-tab-note-input" data-tabkey="${key}" placeholder="Комментарий режиссёра для этой вкладки" style="width:100%;min-height:52px;border:1px solid #4c5d79;border-radius:8px;background:#182131;color:#eaf0ff;padding:6px;font:inherit;"></textarea>
        `;
        inner.insertBefore(w, inner.firstChild);
      }
      const ta = inner.querySelector('.director-tab-note-input[data-tabkey="' + key + '"]');
      if (!ta) return;
      if (typeof state.directorTabNotes[key] === 'string') ta.value = state.directorTabNotes[key];
      if (ta.dataset.boundDirectorTab === '1') return;
      ta.dataset.boundDirectorTab = '1';
      const save = () => {
        state.directorTabNotes[key] = String(ta.value || '');
        saveJson(DIRECTOR_TAB_NOTE_STORE_KEY, state.directorTabNotes);
      };
      ta.addEventListener('input', save);
      ta.addEventListener('change', save);
      ta.addEventListener('blur', save);
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

  function getColCheckById(col) {
    return document.querySelector('#colControls input[data-col="' + String(col) + '"]');
  }

  function getColHeaderLabel(col) {
    const th = document.querySelector('th[data-col="' + String(col) + '"]');
    if (th) return (th.textContent || '').trim();
    const lbl = document.querySelector('#colControls input[data-col="' + String(col) + '"]')?.closest('label');
    return lbl ? (lbl.textContent || '').trim() : String(col);
  }

  function ensureCollapsedRail() {
    let rail = document.getElementById('collapsedColsRail');
    if (!rail) {
      rail = document.createElement('div');
      rail.id = 'collapsedColsRail';
      rail.className = 'collapsed-cols-rail no-print';
      rail.style.display = 'none';
      document.body.appendChild(rail);
    }
    return rail;
  }

  function renderCollapsedRail() {
    const rail = ensureCollapsedRail();
    rail.innerHTML = '';
    const all = getColChecks();
    all.forEach((chk) => {
      const col = chk.dataset.col;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'collapsed-col-pill';
      btn.textContent = getColHeaderLabel(col);
      const isHidden = !chk.checked;
      btn.classList.add(isHidden ? 'active' : 'inactive');
      btn.title = (isHidden ? 'Показать: ' : 'Скрыть: ') + getColHeaderLabel(col);
      btn.addEventListener('click', () => {
        chk.checked = !chk.checked;
        applyColVisibility();
      });
      rail.appendChild(btn);
    });
    rail.style.display = all.length ? 'grid' : 'none';
  }

  function getColWidthMap() {
    if (!state.widths || typeof state.widths !== 'object') state.widths = {};
    return state.widths;
  }

  function applyColumnWidth(col, px) {
    const width = clamp(Math.round(Number(px) || 0), 70, 1400);
    document.querySelectorAll('[data-col="' + col + '"]').forEach((cell) => {
      cell.style.setProperty('width', width + 'px', 'important');
      cell.style.setProperty('min-width', width + 'px', 'important');
      cell.style.setProperty('max-width', width + 'px', 'important');
    });
  }

  function persistColumnWidth(col, px) {
    const map = getColWidthMap();
    map[String(col)] = clamp(Math.round(Number(px) || 0), 70, 1400);
    saveJson(COL_WIDTH_KEY, map);
  }

  function clearColumnWidths() {
    state.widths = {};
    saveJson(COL_WIDTH_KEY, state.widths);
    document.querySelectorAll('th[data-col], td[data-col]').forEach((cell) => {
      cell.style.removeProperty('width');
      cell.style.removeProperty('min-width');
      cell.style.removeProperty('max-width');
    });
  }

  function restoreColumnWidths() {
    const map = getColWidthMap();
    Object.keys(map).forEach((col) => applyColumnWidth(col, map[col]));
  }

  function ensureWidthTools() {
    const select = document.getElementById('widthCol');
    if (!select) return;
    if (!select.querySelector('option[value="9"]')) {
      const opt = document.createElement('option');
      opt.value = '9';
      opt.textContent = 'Видео';
      select.appendChild(opt);
    }
  }

  function bindWidthTools() {
    const select = document.getElementById('widthCol');
    const input = document.getElementById('widthPx');
    const applyBtn = document.getElementById('applyWidth');
    const resetBtn = document.getElementById('resetWidths');
    if (!select || !input || !applyBtn || !resetBtn) return;

    const applyCurrent = () => {
      const col = String(select.value || '').trim();
      const px = Number(input.value || 0);
      if (!col || !Number.isFinite(px)) return;
      applyColumnWidth(col, px);
      persistColumnWidth(col, px);
      updateFrameSizingByLayout();
    };

    applyBtn.addEventListener('click', applyCurrent);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        applyCurrent();
      }
    });

    select.addEventListener('change', () => {
      const col = String(select.value || '').trim();
      const sample = document.querySelector('th[data-col="' + col + '"]');
      if (!sample) return;
      const w = Math.round(sample.getBoundingClientRect().width);
      if (w > 0) input.value = String(w);
    });

    resetBtn.addEventListener('click', () => {
      clearColumnWidths();
      updateFrameSizingByLayout();
      select.dispatchEvent(new Event('change'));
    });
  }

  function installHeaderResizers() {
    document.querySelectorAll('th[data-col]').forEach((th) => {
      if (th.querySelector('.col-resizer')) return;
      const col = th.getAttribute('data-col');
      if (!col) return;
      const grip = document.createElement('span');
      grip.className = 'col-resizer no-print';
      grip.setAttribute('aria-hidden', 'true');
      th.style.position = th.style.position || 'sticky';
      th.appendChild(grip);

      grip.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        const startX = ev.clientX;
        const startW = Math.round(th.getBoundingClientRect().width);
        document.body.classList.add('is-resizing');

        const onMove = (mv) => {
          const delta = mv.clientX - startX;
          const nextW = clamp(startW + delta, 70, 1400);
          applyColumnWidth(col, nextW);
          persistColumnWidth(col, nextW);
          const widthPx = document.getElementById('widthPx');
          const widthCol = document.getElementById('widthCol');
          if (widthPx && widthCol && String(widthCol.value) === String(col)) widthPx.value = String(nextW);
          updateFrameSizingByLayout();
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.classList.remove('is-resizing');
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function installHeaderCollapseStrips() {
    document.querySelectorAll('th[data-col]').forEach((th) => {
      const col = String(th.getAttribute('data-col') || '');
      if (!col || col === '7') return;
      if (th.querySelector('.col-collapse-strip')) return;
      const strip = document.createElement('span');
      strip.className = 'col-collapse-strip no-print';
      strip.title = 'Свернуть столбец';
      strip.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const chk = getColCheckById(col);
        if (!chk) return;
        chk.checked = false;
        applyColVisibility();
      });
      th.appendChild(strip);
    });
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
    renderCollapsedRail();
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

    const widthMap = getColWidthMap();
    const vManual = Number(widthMap['9'] || 0);
    const vCell = document.querySelector('tbody tr[data-shot] td.col-video:not(.hidden-col)');
    const vW = Number.isFinite(vManual) && vManual > 0
      ? clamp(Math.round(vManual - 16), 120, 1200)
      : (vCell ? Math.max(120, Math.round(vCell.getBoundingClientRect().width - 12)) : 180);
    root.style.setProperty('--video-thumb-w', vW + 'px');
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

  function parseShotClipRange(row) {
    const meta = row.querySelector('.author-quote-meta');
    const text = meta ? String(meta.textContent || '') : '';
    const m = text.match(/Клип:\s*([\d.,]+)\s*[–-]\s*([\d.,]+)\s*сек/i);
    if (!m) return null;
    const toSec = (v) => Number(String(v).replace(',', '.'));
    const start = toSec(m[1]);
    const end = toSec(m[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    return { start, end };
  }

  function initShotAudioFromMeta() {
    const sharedAudio = new Audio(MASTER_AUDIO_SRC);
    let stopTimer = null;
    let activeBtn = null;

    const stopCurrent = () => {
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
      sharedAudio.pause();
      if (activeBtn) activeBtn.classList.remove('playing');
      activeBtn = null;
    };

    shots().forEach((row) => {
      const range = parseShotClipRange(row);
      if (!range) return;
      const shotCell = row.querySelector('td.col-shot');
      if (!shotCell || shotCell.querySelector('.shot-audio')) return;
      const box = document.createElement('div');
      box.className = 'shot-audio no-print';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shot-audio-btn';
      btn.textContent = '▶ звук';
      box.appendChild(btn);
      shotCell.appendChild(box);

      btn.addEventListener('click', async () => {
        try {
          stopCurrent();
          sharedAudio.currentTime = range.start;
          await sharedAudio.play();
          btn.classList.add('playing');
          activeBtn = btn;
          const ms = Math.max(120, Math.round((range.end - range.start) * 1000));
          stopTimer = setTimeout(() => {
            stopCurrent();
          }, ms);
        } catch (err) {
          console.warn('Shot audio play failed', err);
        }
      });
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
          setOn(['4', '5', '6', '8', '9'], false);
          setOn(['1', '2', '3', '7'], true);
        } else if (mode === 'focus-frames') {
          setOn(['2', '7', '9'], true);
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

  function makeTextPersistKey(el) {
    const row = el.closest('tr[data-shot]');
    const cell = el.closest('td[data-col],th[data-col]');
    const table = el.closest('table');
    const tableIdx = table ? Array.from(document.querySelectorAll('table')).indexOf(table) : -1;
    const rowIdx = row ? (row.dataset.shot || '') : (el.closest('tr') ? Array.from(el.closest('tr').parentNode.children).indexOf(el.closest('tr')) : -1);
    const cls = (el.className || '').toString().replace(/\s+/g, '.');
    const tag = el.tagName.toLowerCase();
    const col = cell ? (cell.getAttribute('data-col') || '') : '';
    const id = el.id || '';
    return [tag, id, cls, 't' + tableIdx, 'r' + rowIdx, 'c' + col].join('|');
  }

  function initTextPersistence() {
    const editable = Array.from(document.querySelectorAll('textarea, input:not([type]), input[type="text"], [contenteditable="true"]'));
    editable.forEach((el) => {
      if (el.dataset.noPersist === '1') return;
      if (el.id === 'shotJumpInput') return;
      const key = makeTextPersistKey(el);
      const saved = state.text[key];
      if (typeof saved === 'string') {
        if (el.matches('[contenteditable="true"]')) el.textContent = saved;
        else el.value = saved;
      }
      if (el.dataset.boundTextPersist === '1') return;
      el.dataset.boundTextPersist = '1';
      const onSave = () => {
        const value = el.matches('[contenteditable="true"]') ? (el.textContent || '') : (el.value || '');
        state.text[key] = value;
        saveJson(TEXT_STORE_KEY, state.text);
      };
      el.addEventListener('input', onSave);
      el.addEventListener('change', onSave);
      el.addEventListener('blur', onSave);
    });
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
    setText('countAll', rows.length);
    setText('countAuto', auto);
    setText('countManual', manual);
    setText('countEmpty', empty);
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

  function bindTopMenuControls() {
    const toggleCols = document.getElementById('toggleCols');
    const panel = document.getElementById('colPanel');
    const showAll = document.getElementById('showAll');
    const hideTextCols = document.getElementById('hideTextCols');
    const presentationBtn = document.getElementById('presentationModeBtn');
    const compactBtn = document.getElementById('compactModeBtn');
    if (!toggleCols || !panel) return;

    const closePanel = () => panel.classList.remove('open');
    toggleCols.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', (ev) => {
      if (!panel.classList.contains('open')) return;
      const inPanel = panel.contains(ev.target);
      const onBtn = toggleCols.contains(ev.target);
      if (!inPanel && !onBtn) closePanel();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closePanel();
    });

    if (showAll) {
      showAll.addEventListener('click', () => {
        getColChecks().forEach((c) => { c.checked = true; });
        applyColVisibility();
      });
    }
    if (hideTextCols) {
      hideTextCols.addEventListener('click', () => {
        getColChecks().forEach((c) => {
          const col = String(c.dataset.col || '');
          c.checked = !['4', '5', '6', '8', '9'].includes(col);
        });
        applyColVisibility();
      });
    }
    if (presentationBtn) {
      presentationBtn.addEventListener('click', () => {
        const wrap = document.querySelector('.table-wrap');
        if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (compactBtn) {
      compactBtn.addEventListener('click', () => {
        getColChecks().forEach((c) => {
          const col = String(c.dataset.col || '');
          c.checked = ['1', '2', '7', '9'].includes(col);
        });
        applyColVisibility();
      });
    }
  }

  function init() {
    if (window.__tortsRuntimeInitialized) return;
    window.__tortsRuntimeInitialized = true;
    ensureVideoColumnControl();
    ensurePromptColumnConsistency();
    ensureVideoColumn();
    ensureUserSlotsAndStyles();
    ensureUnmappedVideoList();
    ensureDirectorTextByShot();
    ensureDirectorTextInTabs();
    ensureWidthTools();
    installHorizontalCollapseTools();
    restoreColumnWidths();
    installHeaderResizers();
    installHeaderCollapseStrips();
    bindWidthTools();
    bindMediaControls();
    initReadyColumn();
    initFilters();
    initShotJump();
    initShotAudioFromMeta();
    initTextPersistence();
    bindTopMenuControls();
    updateSummary();
    updateFrameSizingByLayout();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

