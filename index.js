document.addEventListener('DOMContentLoaded', () => {
    // Find all the tab containers on the page
    const tabContainers = document.querySelectorAll('.bento-tabs-container');

    // Loop through each tab container to make it work independently
    // Sidebar navbar: auto-detect current page and highlight matching link
    try {
        const links = document.querySelectorAll('.sidebar-nav .nav-link');
        if (links.length) {
            const toFile = (url) => {
                try {
                    // Normalize to just the last segment (file name)
                    const a = document.createElement('a');
                    a.href = url;
                    const path = (a.pathname || '').replace(/\\+/g, '/');
                    const last = path.split('/').filter(Boolean).pop() || '';
                    return last.toLowerCase();
                } catch { return String(url || '').toLowerCase(); }
            };
            const current = toFile(window.location.href);
            links.forEach(link => {
                const hrefFile = toFile(link.getAttribute('href'));
                // Exact filename match; also consider index.html if no filename present
                const isMatch = hrefFile && (hrefFile === current || (current === '' && hrefFile === 'index.html'));
                if (isMatch) {
                    link.classList.add('is-active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('is-active');
                    link.removeAttribute('aria-current');
                }
            });
        }
    } catch (e) {
        // no-op; highlighting is non-critical
    }
    tabContainers.forEach(container => {
        // Find the buttons and panels *inside this container only*
        const tabButtons = container.querySelectorAll('.bento-tab-button');
        const tabPanels = container.querySelectorAll('.bento-tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 1. Deactivate all buttons and panels *within this container*
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('hidden', '');
                });

                // 2. Activate the clicked button
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');

                // 3. Find and activate the corresponding panel
                const targetPanelId = button.getAttribute('data-tab');
                const targetPanel = container.querySelector(`#${targetPanelId}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.removeAttribute('hidden');
                }
            });
        });
    });

    // Modal logic
    const modal = document.getElementById('bento-modal');
    const modalBody = document.getElementById('bento-modal-body');
    const modalTitle = document.getElementById('bento-modal-title');
    let lastFocused = null;
    let restoreNode = null; // node to put content back when closing

    function openModalFrom(sourceSelector, titleText) {
        const source = document.querySelector(sourceSelector);
        if (!modal || !modalBody || !source) return;
        lastFocused = document.activeElement;
        // Clone content and sanitize
        const clone = source.cloneNode(true);
        // Ensure the clone is visible in the modal
        clone.removeAttribute('hidden');
        // Avoid duplicate IDs inside modal
        if (clone.id) clone.removeAttribute('id');
        // Also remove hidden from any nested elements
        clone.querySelectorAll('[hidden]')?.forEach(el => el.removeAttribute('hidden'));

        modalBody.innerHTML = '';
        modalBody.appendChild(clone);
        modal.removeAttribute('hidden');
        if (titleText) modalTitle.textContent = titleText;
        // Focus close button
        const closeBtn = modal.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('hidden', '');
        modalBody.innerHTML = '';
        document.body.style.overflow = '';
        if (lastFocused) {
            lastFocused.focus();
            lastFocused = null;
        }
    }

    // Open handlers
    document.querySelectorAll('[data-modal-source]').forEach(btn => {
        btn.addEventListener('click', () => {
            const selector = btn.getAttribute('data-modal-source');
            const label = btn.getAttribute('data-modal-title') || 'Details';
            openModalFrom(selector, label);
        });
    });

    // Close handlers
    modal?.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal?.hasAttribute('hidden')) {
            closeModal();
        }
    });

    // Theme switching
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const setTheme = (theme) => {
        body.classList.remove('theme-light', 'theme-dark');
        if (theme === 'dark') body.classList.add('theme-dark');
        else body.classList.add('theme-light');
        // Sync slider
        if (themeToggle) themeToggle.checked = (theme === 'dark');
    };
    const setAccent = (accent) => {
        body.classList.remove('accent-black','accent-red','accent-blue','accent-green','accent-purple');
        const cls = `accent-${accent}`;
        body.classList.add(cls);
        // Toggle selected ring
        document.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('selected'));
        const active = document.querySelector(`.accent-swatch[data-accent="${accent}"]`);
        if (active) active.classList.add('selected');
    };

    // Defaults
    if (!body.classList.contains('theme-light') && !body.classList.contains('theme-dark')) {
        setTheme('light');
    } else {
        // sync slider with existing class
        themeToggle && (themeToggle.checked = body.classList.contains('theme-dark'));
    }
    if (![...body.classList].some(c => c.startsWith('accent-'))) {
        setAccent('black');
    } else {
        const currentAccent = [...body.classList].find(c => c.startsWith('accent-'))?.replace('accent-','');
        if (currentAccent) setAccent(currentAccent);
    }

    // Theme slider listener
    themeToggle?.addEventListener('change', () => setTheme(themeToggle.checked ? 'dark' : 'light'));
    document.querySelectorAll('[data-accent]').forEach(btn => {
        btn.addEventListener('click', () => setAccent(btn.getAttribute('data-accent')));
    });

    // Clickable tiles navigation (open in same tab)
    document.querySelectorAll('.clickable[data-href]').forEach(tile => {
        const href = tile.getAttribute('data-href');
        if (!href) return;
        tile.addEventListener('click', (e) => {
            // Avoid inner control clicks from triggering navigation
            const target = e.target;
            if (target.closest('button, a, [role="tab"], [data-modal-source]')) return;
            // Navigate in the current tab
            window.location.href = href;
        });
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Navigate in the current tab on keyboard activation
                window.location.href = href;
            }
        });
    });

    // Live time tile
    const timeEl = document.getElementById('liveTime');
    if (timeEl) {
        const update = () => {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            timeEl.textContent = `${hh}:${mm}:${ss}`;
        };
        update();
        setInterval(update, 1000);
    }

    // Certificates: open modal with full image on click
    document.querySelectorAll('.cert-thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const src = btn.getAttribute('data-modal-image');
            const title = btn.getAttribute('data-modal-title') || 'Certificate';
            if (!src || !modal || !modalBody) return;
            lastFocused = document.activeElement;
            modalBody.innerHTML = '';
            const img = document.createElement('img');
            img.src = src;
            img.alt = title;
            img.className = 'modal-image';
            modalBody.appendChild(img);
            modalTitle.textContent = title;
            modal.removeAttribute('hidden');
            const closeBtn = modal.querySelector('[data-modal-close]');
            if (closeBtn) closeBtn.focus();
            document.body.style.overflow = 'hidden';
        });
    });

    // Certificates: enable interactive wheel/touch/drag scroll without changing sizes
    const certStrip = document.querySelector('.certificates-strip');
    const certTrack = document.querySelector('.certificates-track');
    if (certStrip && certTrack) {
        // Keep the page vertical scroll intact; allow horizontal drag on the strip
        certStrip.style.touchAction = 'pan-y';

        // We'll shift the running marquee by adjusting a CSS variable used in keyframes
        let offsetPx = 0; // manual offset in pixels; will be wrapped to loop
        let loopWidth = 0; // half of track width (since content is duplicated)
        let inertiaRAF = null; // requestAnimationFrame id for inertia

        const recalcLoop = () => {
            // Wait a tick to ensure layout is ready
            const total = certTrack.scrollWidth || 0;
            loopWidth = total > 0 ? total / 2 : 0;
        };
        recalcLoop();
        window.addEventListener('resize', recalcLoop);

        const applyOffset = () => {
            if (loopWidth > 0) {
                // Keep offset bounded so it never grows unbounded
                offsetPx = ((offsetPx % loopWidth) + loopWidth) % loopWidth;
            }
            certTrack.style.setProperty('--cert-offset', `${-offsetPx}px`);
        };

        const stopInertia = () => {
            if (inertiaRAF != null) {
                cancelAnimationFrame(inertiaRAF);
                inertiaRAF = null;
            }
        };

        // Mouse/trackpad wheel -> horizontal nudge
        certStrip.addEventListener('wheel', (e) => {
            // Use vertical wheel movement to drive horizontal scrolling
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            // If there's any delta, treat it as interaction
            if (delta !== 0) {
                e.preventDefault(); // prevent page from scrolling while interacting
                stopInertia();
                offsetPx += delta;  // natural feel: wheel down/right moves content left
                applyOffset();
            }
        }, { passive: false });

        // Pointer drag (mouse or touch)
        let isDragging = false;
        let didDrag = false;
        let suppressClick = false;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0; // px/ms
        const DRAG_THRESHOLD = 5; // px before we consider it a drag
        let downTarget = null;

        const onPointerDown = (e) => {
            stopInertia();
            isDragging = true;
            didDrag = false;
            suppressClick = false;
            lastX = e.clientX;
            lastTime = e.timeStamp;
            velocity = 0;
            downTarget = e.target;
            certStrip.setPointerCapture?.(e.pointerId);
            // Pause the marquee while dragging for precise control
            certTrack.style.animationPlayState = 'paused';
            certStrip.classList.add('dragging');
        };
        const onPointerMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dt = Math.max(1, e.timeStamp - lastTime); // ms
            // Update offset inversely to movement so drag feels natural
            offsetPx -= dx;
            applyOffset();
            // Velocity: change in offset per ms
            velocity = (-dx) / dt; // since offsetPx -= dx, -dx represents dOffset
            if (!didDrag && Math.abs(e.clientX - (downTarget?.clientX ?? lastX)) > DRAG_THRESHOLD) {
                didDrag = true;
            }
            lastX = e.clientX;
            lastTime = e.timeStamp;
        };
        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            certStrip.releasePointerCapture?.(e.pointerId);
            certStrip.classList.remove('dragging');

            // If we dragged, suppress the subsequent click to avoid opening modal accidentally
            if (didDrag) {
                suppressClick = true;
                // Auto-clear suppress flag shortly after
                setTimeout(() => { suppressClick = false; }, 250);
            }

            // Inertia: continue with the last velocity and decay over time
            const MIN_SPEED = 0.02; // px/ms below which we stop
            const DECAY = 6;        // per second exponential decay factor
            if (Math.abs(velocity) > MIN_SPEED) {
                const startTs = performance.now();
                let lastTs = startTs;
                const step = (ts) => {
                    const dt = (ts - lastTs) || 16; // ms
                    lastTs = ts;
                    // Exponential decay of velocity
                    const decayScale = Math.exp(-DECAY * (dt / 1000));
                    velocity *= decayScale;
                    // Apply movement
                    offsetPx += velocity * dt;
                    applyOffset();
                    if (Math.abs(velocity) > MIN_SPEED) {
                        inertiaRAF = requestAnimationFrame(step);
                    } else {
                        inertiaRAF = null;
                        // Resume marquee when inertia ends
                        certTrack.style.animationPlayState = 'running';
                    }
                };
                inertiaRAF = requestAnimationFrame(step);
            } else {
                // Resume marquee immediately
                certTrack.style.animationPlayState = 'running';
            }
        };

        certStrip.addEventListener('pointerdown', onPointerDown);
        certStrip.addEventListener('pointermove', onPointerMove);
        certStrip.addEventListener('pointerup', onPointerUp);
        certStrip.addEventListener('pointercancel', onPointerUp);
        certStrip.addEventListener('lostpointercapture', onPointerUp);

        // Suppress clicks after a drag so we don't accidentally open modals
        certStrip.addEventListener('click', (e) => {
            if (suppressClick) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, true); // capture phase to intercept early
    }
});