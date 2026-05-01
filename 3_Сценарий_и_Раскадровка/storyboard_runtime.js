(() => {
  const KEYFRAME_STORE_KEY = 'torts_keyframe_inline_v1';
  const DIRECTOR_STORE_KEY = 'torts_director_inline_v1';
  const READY_STORE_KEY = 'torts_ready_state_v1';
  const PUBLISHED_DIRECTOR_MAP = {
    S06A: 'director_refs_20260430/S06A_director.jpg',
    S06B: 'director_refs_20260430/S06B_director.jpg',
    S06C: 'director_refs_20260430/S06C_director.jpg',
    S07A: 'director_refs_20260430/S07A_director.jpg',
    S07B: 'director_refs_20260430/S07B_director.jpg',
    S08: 'director_refs_20260430/S08_director.jpg',
    S12: 'director_refs_20260430/S12_director.jpg'
  };

  const state = {
    keyframes: loadJson(KEYFRAME_STORE_KEY),
    directors: loadJson(DIRECTOR_STORE_KEY),
    ready: loadJson(READY_STORE_KEY),
    frameFilter: 'all'
  };

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
    const store = isDirector ? state.directors : state.keyframes;
    const published = isDirector ? PUBLISHED_DIRECTOR_MAP : getPublishedKeyframes();
    const dataAttr = isDirector ? 'data-director-state' : 'data-frame-state';
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
        if (!isDirector) {
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
    if (!isDirector) {
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
      const target = kind === 'director' ? state.directors : state.keyframes;
      target[shot] = String(reader.result || '');
      saveJson(kind === 'director' ? DIRECTOR_STORE_KEY : KEYFRAME_STORE_KEY, target);
      refreshShot(shot);
      updateSummary();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function handleClear(kind, shot) {
    const target = kind === 'director' ? state.directors : state.keyframes;
    delete target[shot];
    saveJson(kind === 'director' ? DIRECTOR_STORE_KEY : KEYFRAME_STORE_KEY, target);
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
    bindMediaControls();
    initReadyColumn();
    initFilters();
    updateSummary();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();