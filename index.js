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
    const primaryToggle = document.getElementById('themeToggle');
    // Support multiple theme toggles across the page (e.g., header + in-article)
    const themeToggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
    if (primaryToggle && !themeToggles.includes(primaryToggle)) themeToggles.push(primaryToggle);
    const setTheme = (theme) => {
        body.classList.remove('theme-light', 'theme-dark');
        if (theme === 'dark') body.classList.add('theme-dark');
        else body.classList.add('theme-light');
        // Sync all toggles
        themeToggles.forEach(t => { try { t.checked = (theme === 'dark'); } catch {} });
        try { localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light'); } catch {}
    };
    const setAccent = (accent) => {
        body.classList.remove('accent-black','accent-red','accent-blue','accent-green','accent-purple');
        const cls = `accent-${accent}`;
        body.classList.add(cls);
        // Toggle selected ring
        document.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('selected'));
        const active = document.querySelector(`.accent-swatch[data-accent="${accent}"]`);
        if (active) active.classList.add('selected');
        try { localStorage.setItem('accent', accent); } catch {}
    };

    // Defaults
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            setTheme(savedTheme);
        } else if (!body.classList.contains('theme-light') && !body.classList.contains('theme-dark')) {
            setTheme('light');
        }
    } catch {
        if (!body.classList.contains('theme-light') && !body.classList.contains('theme-dark')) setTheme('light');
    }
    {
        // sync sliders with existing class
        const isDark = body.classList.contains('theme-dark');
        themeToggles.forEach(t => { try { t.checked = isDark; } catch {} });
    }
    try {
        const savedAccent = localStorage.getItem('accent');
        if (savedAccent) {
            setAccent(savedAccent);
        } else if (![...body.classList].some(c => c.startsWith('accent-'))) {
            setAccent('black');
        } else {
            const currentAccent = [...body.classList].find(c => c.startsWith('accent-'))?.replace('accent-','');
            if (currentAccent) setAccent(currentAccent);
        }
    } catch {
        if (![...body.classList].some(c => c.startsWith('accent-'))) setAccent('black');
    }

    // Theme slider listeners (all toggles)
    themeToggles.forEach(t => {
        t.addEventListener('change', () => setTheme(t.checked ? 'dark' : 'light'));
    });
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
        // Use Intl API to format time in Philippine Time (Asia/Manila)
        const manilaFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        let lastText = '';
        const update = () => {
            const now = new Date();
            const formatted = manilaFormatter.format(now); // e.g. "07:45 PM"
            if (formatted !== lastText) {
                lastText = formatted;
                timeEl.textContent = formatted;
            }
        };
        update();
        // still update every second to catch minute rollovers promptly
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

    // Masonry items: open modal with image and title when clicked
    document.querySelectorAll('.masonry-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // prevent clicks on controls inside the card from opening modal
            const target = e.target;
            if (target.closest('button, a, [role="tab"], [data-modal-source]')) return;
            if (!modal || !modalBody || !modalTitle) return;
            lastFocused = document.activeElement;
            modalBody.innerHTML = '';
            // prefer to clone an <img> inside the item
            const img = item.querySelector('img');
            if (img) {
                const clone = img.cloneNode(true);
                clone.className = 'modal-image';
                clone.style.maxWidth = '100%';
                clone.alt = img.alt || '';
                modalBody.appendChild(clone);
            }
            const titleEl = item.querySelector('h3');
            modalTitle.textContent = titleEl ? titleEl.textContent : 'Details';
            modal.removeAttribute('hidden');
            const closeBtn = modal.querySelector('[data-modal-close]');
            if (closeBtn) closeBtn.focus();
            document.body.style.overflow = 'hidden';
        });
    });

    // Mobile navbar: use existing hamburger button and toggle header controls dropdown
    (function setupMobileNav() {
        const header = document.querySelector('header');
        if (!header) return;
        const nav = header.querySelector('.sidebar-nav');
        const btn = header.querySelector('.mobile-nav-toggle');
        const controls = header.querySelector('.header-controls');
        if (!nav || !btn) return;

        const closeControls = () => {
            btn.setAttribute('aria-expanded', 'false');
            nav.classList.remove('open');
            if (controls) {
                controls.classList.remove('controls-open');
                // remove inline positioning
                controls.style.left = '';
                controls.style.top = '';
                controls.classList.remove('flipped');
                controls.style.removeProperty('--caret-x');
                // remove resize listener if present
                if (repositionOnResize) {
                    window.removeEventListener('resize', repositionOnResize);
                    repositionOnResize = null;
                }
            }
        };

        btn.addEventListener('click', (e) => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            const willOpen = !expanded;
            btn.setAttribute('aria-expanded', String(willOpen));
            nav.classList.toggle('open', willOpen);
            if (controls) {
                // toggle visible state first so CSS rules apply
                controls.classList.toggle('controls-open', willOpen);

                if (willOpen) {
                    // Measure and position after layout has updated
                    // Temporarily ensure the element is renderable for measurement
                    controls.style.visibility = 'hidden';
                    controls.style.pointerEvents = 'none';
                    // Use requestAnimationFrame to wait for layout
                    requestAnimationFrame(() => {
                        const headerRect = header.getBoundingClientRect();
                        const btnRect = btn.getBoundingClientRect();
                        const controlsRect = controls.getBoundingClientRect();

                        // center the dropdown on the button
                        let left = Math.round(btnRect.left - headerRect.left + (btnRect.width / 2) - (controlsRect.width / 2));
                        // clamp horizontally within header with an 8px inset
                        const minLeft = 8;
                        const maxLeft = Math.round(headerRect.width - controlsRect.width - 8);
                        if (left < minLeft) left = minLeft;
                        if (left > maxLeft) left = maxLeft;

                        // prefer placing below the button, but flip above if not enough space
                        const spaceBelow = window.innerHeight - btnRect.bottom;
                        let top = Math.round(btnRect.bottom - headerRect.top + 8);
                        if (spaceBelow < controlsRect.height + 16) {
                            // not enough room below; place above the button
                            top = Math.round(btnRect.top - headerRect.top - controlsRect.height - 8);
                        }

                        controls.style.left = `${left}px`;
                        controls.style.top = `${top}px`;
                        // compute caret position relative to the controls element
                        const caretX = Math.round(btnRect.left - headerRect.left + (btnRect.width / 2) - left);
                        controls.style.setProperty('--caret-x', `${caretX}px`);
                        // toggle flipped class when placed above
                        if (spaceBelow < controlsRect.height + 16) {
                            controls.classList.add('flipped');
                        } else {
                            controls.classList.remove('flipped');
                        }

                        // restore interactivity/visibility
                        controls.style.visibility = '';
                        controls.style.pointerEvents = '';

                        // install a debounced resize handler so the caret/panel repositions smoothly
                        if (repositionOnResize) window.removeEventListener('resize', repositionOnResize);
                        repositionOnResize = debounce(() => {
                            // re-run positioning logic while open
                            if (!controls.classList.contains('controls-open')) return;
                            const headerRect2 = header.getBoundingClientRect();
                            const btnRect2 = btn.getBoundingClientRect();
                            const controlsRect2 = controls.getBoundingClientRect();
                            let left2 = Math.round(btnRect2.left - headerRect2.left + (btnRect2.width / 2) - (controlsRect2.width / 2));
                            const minLeft2 = 8;
                            const maxLeft2 = Math.round(headerRect2.width - controlsRect2.width - 8);
                            if (left2 < minLeft2) left2 = minLeft2;
                            if (left2 > maxLeft2) left2 = maxLeft2;
                            const spaceBelow2 = window.innerHeight - btnRect2.bottom;
                            let top2 = Math.round(btnRect2.bottom - headerRect2.top + 8);
                            if (spaceBelow2 < controlsRect2.height + 16) {
                                top2 = Math.round(btnRect2.top - headerRect2.top - controlsRect2.height - 8);
                            }
                            controls.style.left = `${left2}px`;
                            controls.style.top = `${top2}px`;
                            const caretX2 = Math.round(btnRect2.left - headerRect2.left + (btnRect2.width / 2) - left2);
                            controls.style.setProperty('--caret-x', `${caretX2}px`);
                            if (spaceBelow2 < controlsRect2.height + 16) controls.classList.add('flipped'); else controls.classList.remove('flipped');
                        }, 120);
                        window.addEventListener('resize', repositionOnResize);
                    });
                } else {
                    controls.style.left = '';
                    controls.style.top = '';
                }
            }
            // prevent event from bubbling to document click handler
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!controls) return;
            const target = e.target;
            if (controls.classList.contains('controls-open')) {
                if (!controls.contains(target) && !btn.contains(target)) {
                    closeControls();
                }
            }
        });
    })();
    // small utility: simple debounce
    function debounce(fn, wait) {
        let t = null;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }
    
    // Minimal horizontal carousel (1 card on mobile, 3 on desktop)
    (function setupCarousels(){
        const carousels = document.querySelectorAll('[data-carousel]');
        if (!carousels.length) return;

        carousels.forEach(carousel => {
            const viewport = carousel.querySelector('[data-carousel-viewport]');
            const track = carousel.querySelector('[data-carousel-track]');
            const prev = carousel.querySelector('[data-carousel-prev]');
            const next = carousel.querySelector('[data-carousel-next]');
            if (!viewport || !track) return;

            // Ensure snapping feels nice
            viewport.style.scrollBehavior = 'smooth';
            viewport.style.webkitOverflowScrolling = 'touch';

            const gapPx = () => {
                try {
                    const gap = getComputedStyle(track).gap || '0px';
                    return parseFloat(gap) || 0;
                } catch { return 0; }
            };
            const itemWidth = () => {
                const first = track.children[0];
                if (!first) return viewport.clientWidth;
                const rect = first.getBoundingClientRect();
                return rect.width + gapPx();
            };
            const scrollItems = (n) => {
                const amount = itemWidth() * n;
                viewport.scrollBy({ left: amount, behavior: 'smooth' });
            };
            const updateDisabled = () => {
                const max = Math.max(0, track.scrollWidth - viewport.clientWidth);
                const sl = Math.round(viewport.scrollLeft);
                if (prev) prev.disabled = sl <= 2;
                if (next) next.disabled = sl >= max - 2;
            };

            prev?.addEventListener('click', () => scrollItems(-1));
            next?.addEventListener('click', () => scrollItems(1));
            viewport.addEventListener('scroll', debounce(updateDisabled, 60));
            window.addEventListener('resize', debounce(updateDisabled, 100));
            updateDisabled();

            // Keyboard support when buttons focused
            [prev, next].forEach(btn => btn?.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); scrollItems(-1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); scrollItems(1); }
            }));
        });
    })();
});