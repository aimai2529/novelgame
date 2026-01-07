let story;
let current;

// --- MAP STATE ---
let mapFloor = 1;          // 1 or 2
let mapZoom = false;       // zoom on/off
let mapModal = null;
let mapOverlayHint = null;
const mapEl = document.getElementById("map");

let typingTimer = null;
let typingDone = false;
let typingFullText = "";
const choicesBox = document.getElementById("choices");

const face = document.getElementById("call-face");
function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

let toiletVisited = Number(localStorage.getItem("toiletVisited") || 0);      // toilet event counter (persistent)

async function loadStory() {
    story = await fetch("story.json").then(r => r.json());
    const saved = localStorage.getItem("novel_save_scene");
    if (saved && findScene(saved)) {
        show(saved);
    } else {
        show("start");
    }
}

function findScene(id) {
    return story.find(s => s.id === id);
}

function updateMapView() {
    if (!mapEl) return;
    const base = mapZoom
        ? `img/map_floor${mapFloor}_zoom.png`
        : `img/map_floor${mapFloor}.png`;
    mapEl.style.backgroundImage = `url(${base})`;
    mapEl.style.backgroundSize = "cover";
    mapEl.style.backgroundPosition = "center";
    if (mapModal) {
        const img = mapModal.querySelector("img");
        if (img) {
            img.src = mapZoom
                ? `img/map_floor${mapFloor}_zoom.png`
                : `img/map_floor${mapFloor}.png`;
        }
    }
}

function handleMapClick(e) {
    // --- ignore clicks on the expand button ---
    if (e.target.closest('#map-expand-btn')) {
        return;
    }

    const rect = mapEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellW = rect.width / 3;
    const cellH = rect.height / 3;

    const col = Math.floor(x / cellW); // 0–2
    const row = Math.floor(y / cellH); // 0–2

    // --- center cell toggles floor ---
    if (row === 1 && col === 1) {
        mapFloor = mapFloor === 1 ? 2 : 1;
        updateMapView();
        return;
    }

    // --- other cells represent locations ---
    const locationId = `map_${mapFloor}_${row}_${col}`;
    if (mapModal) {
        console.log("clicked in modal:", locationId);
    }
    // later: hook into story navigation with show()
    console.log("clicked location:", locationId);

    if (locationId === "map_1_0_2" || locationId === "map_2_0_2") {
        if (toiletVisited === 0) {
            toiletVisited = 1;
            localStorage.setItem("toiletVisited", toiletVisited);
            show("toilet_1");
        } else if (toiletVisited > 0 && toiletVisited < 10) {
            toiletVisited++;
            localStorage.setItem("toiletVisited", toiletVisited);
            show("toilet_2");
        } else {
            show("toilet_3");
        }
    }
}

function openMapModal() {
    if (mapModal) return;

    mapModal = document.createElement("div");
    mapModal.className = "map-modal";

    const inner = document.createElement("div");
    inner.className = "map-modal-inner";

    const img = document.createElement("img");
    img.src = mapZoom
        ? `img/map_floor${mapFloor}_zoom.png`
        : `img/map_floor${mapFloor}.png`;
    img.className = "map-modal-image";

    inner.appendChild(img);
    mapModal.appendChild(inner);
    document.body.appendChild(mapModal);

    // click detection in modal
    inner.addEventListener("click", (e) => {
        const rect = inner.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellW = rect.width / 3;
        const cellH = rect.height / 3;
        const col = Math.floor(x / cellW);
        const row = Math.floor(y / cellH);

        // center cell toggles floor (modal stays open)
        if (row === 1 && col === 1) {
            mapFloor = mapFloor === 1 ? 2 : 1;
            img.src = `img/map_floor${mapFloor}.png`;
            return;
        }

        // other cells: pick location AND close modal
        const locationId = `map_${mapFloor}_${row}_${col}`;
        console.log("clicked (modal):", locationId);

        if (locationId === "map_1_0_2" || locationId === "map_2_0_2") {
            if (toiletVisited === 0) {
                toiletVisited = 1;
                localStorage.setItem("toiletVisited", toiletVisited);
                show("toilet_1");
            } else if (toiletVisited > 0 && toiletVisited < 10) {
                toiletVisited++;
                localStorage.setItem("toiletVisited", toiletVisited);
                show("toilet_2");
            } else {
                show("toilet_3");
            }
        }

        if (mapModal) {
            mapModal.remove();
            mapModal = null;
        }
    });

    // close modal when outside clicking
    mapModal.addEventListener("click", (e) => {
        if (e.target === mapModal) {
            mapModal.remove();
            mapModal = null;
        }
    });
}

//テキスト送りアニメーション
function typeText(text, speed = 50) {
    return new Promise(resolve => {
        const el = document.getElementById("text");
        const textbox = document.getElementById("textbox");

        if (typingTimer) clearInterval(typingTimer);

        el.innerHTML = "";
        el.classList.remove("ready");
        typingDone = false;
        typingFullText = text;
        let i = 0;

        const safe = (t) => (t === "\n" ? "<br>" : t);

        // --- skip only THIS line ---
        textbox.onclick = () => {
            if (!typingDone) {
                clearInterval(typingTimer);
                typingTimer = null;
                typingDone = true;
                el.innerHTML = typingFullText.replace(/\n/g, "<br>");
                el.classList.add("ready");
                textbox.onclick = null;   // remove skip handler
                resolve();
            }
        };

        typingTimer = setInterval(() => {
            el.innerHTML += safe(text[i++]);
            if (i >= text.length) {
                clearInterval(typingTimer);
                typingTimer = null;
                typingDone = true;
                el.classList.add("ready");
                textbox.onclick = null;   // remove skip handler
                resolve();
            }
        }, speed);
    });
}

function runCommands(cmds = []) {
    cmds.forEach(cmd => {
        if (cmd.startsWith("show(")) {
            const id = cmd.match(/show\((.+)\)/)[1];
            showEl(id);
        } else if (cmd.startsWith("hide(")) {
            const id = cmd.match(/hide\((.+)\)/)[1];
            hideEl(id);
        } else if (cmd === "glitch") {
            const el = document.getElementById("text");
            el.classList.add("glitch");
            setTimeout(() => el.classList.remove("glitch"), 300);
        } else if (cmd === "initMap") {
            if (mapEl) {
                mapEl.style.cursor = "pointer";
                updateMapView();
                // avoid double-binding
                mapEl.onclick = handleMapClick;
            }
            if (!document.getElementById("map-expand-btn")) {
                const btn = document.createElement("button");
                btn.id = "map-expand-btn";
                btn.textContent = "マップを拡大";
                btn.className = "map-expand-btn";
                btn.onclick = (e) => {
                    e.stopPropagation();   // ← prevent click from reaching map
                    openMapModal();
                };

                // place directly inside #map so it lives in the same grid area
                mapEl.style.position = mapEl.style.position || "relative";
                mapEl.appendChild(btn);
            }
        }
        else if (cmd.startsWith("overlay(")) {
            const [, id, msg] = cmd.match(/overlay\(([^,]+),\s*['"](.*)['"]\)/) || [];
            if (!id || !msg) return;
            const target = document.getElementById(id);
            if (!target) return;

            if (mapOverlayHint) {
                mapOverlayHint.remove();
                mapOverlayHint = null;
            }

            const hint = document.createElement("div");
            hint.textContent = msg;
            hint.style.position = "absolute";
            hint.style.inset = "0";
            hint.style.display = "flex";
            hint.style.alignItems = "center";
            hint.style.justifyContent = "center";
            hint.style.background = "rgba(0,0,0,0.35)";
            hint.style.color = "#fff";
            hint.style.fontSize = "1.2em";
            hint.style.opacity = "1";
            hint.style.transition = "opacity .5s";

            target.style.position = target.style.position || "relative";
            target.appendChild(hint);
            mapOverlayHint = hint;

            setTimeout(() => {
                hint.style.opacity = "0";
                setTimeout(() => {
                    hint.remove();
                    if (mapOverlayHint === hint) mapOverlayHint = null;
                }, 600);
            }, 1000);
        }
    });
}

function show(id) {
    current = findScene(id);

    const textbox = document.getElementById("textbox");
    // --- reset typing + skip state per scene ---
    if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
    }
    typingDone = false;
    textbox.onclick = null;

    localStorage.setItem("novel_save_scene", id);

    if (current.commands) {
        runCommands(current.commands);
    }
    // keep map visual in sync when returning after reload
    updateMapView();

    document.getElementById("bg").src = "img/" + current.bg;

    if (current.face) {
        face.src = "img/" + current.face;
        showEl("face");
    } else {
        face.removeAttribute("src");
    }

    // 名前（無ければ空）
    const nameBox = document.getElementById("name");
    if (current.name) {
        nameBox.textContent = current.name;
    } else {
        nameBox.textContent = "";
    }

    // テキスト + 速度（sceneごとに調整できる: current.speed）
    const speed = current.speed ?? 50;
    const typingPromise = typeText(current.text, speed);

    choicesBox.innerHTML = "";
    choicesBox.classList.remove("show");
    document.getElementById("text").classList.remove("ready");

    typingPromise.then(() => {
        // 選択肢がある場合：テキストが出終わってから表示
        if (current.choices) {
            const textbox = document.getElementById("textbox");
            // make sure old skip handler never leaks into scenes after a choice
            textbox.onclick = null;

            choicesBox.innerHTML = "";
            current.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice.label;
                btn.onclick = (e) => {
                    // prevent the click from also hitting the textbox (which enables skip)
                    e.stopPropagation();
                    // safety reset, then move to next scene
                    if (typingTimer) {
                        clearInterval(typingTimer);
                        typingTimer = null;
                    }
                    typingDone = false;
                    show(choice.next);
                };
                choicesBox.appendChild(btn);
            });
            choicesBox.classList.add("show");
        }
        // 選択肢がない場合：▼が出てクリックで進む
        else if (current.next) {
            const textbox = document.getElementById("textbox");
            textbox.onclick = null;
            textbox.onclick = () => {
                // if still typing, the skip handler defined in typeText will handle it
                if (!typingDone) return;
                show(current.next);
            };
        }
    });
}

loadStory();