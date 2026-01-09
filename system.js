let story;
let current;

let mapFloor = 1;
let mapModal = null;
let mapOverlayHint = null;
const mapEl = document.getElementById("map");

let san = 3;

let stillEl = null;

let typingTimer = null;
let scrambleActive = false;
let scrambleInterval = null;
let typingDone = false;
let typingFullText = "";
let scrambleOnceText = null;
const choicesBox = document.getElementById("choices");

const face = document.getElementById("call-face");
function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

let toiletVisited = Number(localStorage.getItem("toiletVisited") || 0);
let loopCount = Number(localStorage.getItem("loopCount") || 0);

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

function resetForLoop() {
    toiletVisited = 0;
    localStorage.setItem("toiletVisited", toiletVisited);

    san = 3;
    updateSan();

    loopCount++;
    localStorage.setItem("loopCount", loopCount);

    console.log("loop:", loopCount);
}

function updateMapView() {
    if (!mapEl) return;
    const base = `img/map_floor${mapFloor}.png`;
    mapEl.style.backgroundImage = `url(${base})`;
    mapEl.style.backgroundSize = "cover";
    mapEl.style.backgroundPosition = "center";
    if (mapModal) {
        const img = mapModal.querySelector("img");
        if (img) {
            img.src = `img/map_floor${mapFloor}.png`;
        }
    }
}

function handleMapClick(e) {
    if (e.target.closest('#map-expand-btn')) {
        return;
    }

    const rect = mapEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellW = rect.width / 3;
    const cellH = rect.height / 3;

    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (row === 1 && col === 1) {
        mapFloor = mapFloor === 1 ? 2 : 1;
        updateMapView();
        return;
    }

    const locationId = `map_${mapFloor}_${row}_${col}`;
    if (mapModal) {
        console.log("clicked in modal:", locationId);
    }
    console.log("clicked location:", locationId);

    locationLoad(locationId);
}

function openMapModal() {
    if (mapModal) return;

    mapModal = document.createElement("div");
    mapModal.className = "map-modal";

    const inner = document.createElement("div");
    inner.className = "map-modal-inner";

    const img = document.createElement("img");
    img.src = `img/map_floor${mapFloor}.png`;
    img.className = "map-modal-image";

    inner.appendChild(img);
    mapModal.appendChild(inner);
    document.body.appendChild(mapModal);

    inner.addEventListener("click", (e) => {
        const rect = inner.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cellW = rect.width / 3;
        const cellH = rect.height / 3;
        const col = Math.floor(x / cellW);
        const row = Math.floor(y / cellH);

        if (row === 1 && col === 1) {
            mapFloor = mapFloor === 1 ? 2 : 1;
            img.src = `img/map_floor${mapFloor}.png`;
            return;
        }

        const locationId = `map_${mapFloor}_${row}_${col}`;
        console.log("clicked (modal):", locationId);

        locationLoad(locationId);

        if (mapModal) {
            mapModal.remove();
            mapModal = null;
        }
    });

    mapModal.addEventListener("click", (e) => {
        if (e.target === mapModal) {
            mapModal.remove();
            mapModal = null;
        }
    });
}

function locationLoad(id) {
    if (id === "map_1_0_2" || id === "map_2_0_2") {
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
    } else if (id === "map_1_1_0" || id === "map_1_2_0" || id === "map_1_2_1") {
        show("foods1");
    } else if (id === "map_1_0_1") {
        show("exit1");
    } else if (id === "map_1_1_2") {
        show("donuts1");
    } else if (id === "map_1_2_2") {
        show("wagashi1");
    } else if (id === "map_1_0_0") {
        show("space1");
    } else if (id === "map_2_0_0" || id === "map_2_1_0") {
        show("items1");
    } else if (id === "map_2_0_1") {
        show("divination1");
    } else if (id === "map_2_1_2") {
        show("wear1");
    } else if (id === "map_2_2_0" || id === "map_2_2_1" || id === "map_2_2_2") {
        show("books1");
    }
}

function updateSan() {
    san = Math.max(0, Math.min(3, san));
    const img = document.getElementById("san-image");
    img.src = `./img/san_${san}.png`;
}

function showStill(src) {
    const textbox = document.getElementById("textbox");
    if (!textbox) return;

    if (!stillEl) {
        stillEl = document.createElement("div");
        stillEl.className = "still-container";

        const img = document.createElement("img");
        img.className = "still-image";
        stillEl.appendChild(img);

        textbox.parentNode.insertBefore(stillEl, textbox);
    }

    const img = stillEl.querySelector("img");
    img.src = "img/" + src;

    stillEl.classList.add("show");
}

function clearStill() {
    if (stillEl) {
        stillEl.classList.remove("show");
    }
}

function startScrambleText() {
    const el = document.getElementById("text");
    if (!el) return;

    // 元の全文を取得（typing前でも使えるように current.text を優先）
    const source = current?.text || el.innerText;
    if (!source) return;

    const chars = source.split("");
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    scrambleOnceText = chars.join("");
}

function stopScrambleText() {
    scrambleActive = false;
    if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
    }
    scrambleOnceText = null;
}

function typeText(text, speed = 50) {
    return new Promise(resolve => {
        const el = document.getElementById("text");
        const textbox = document.getElementById("textbox");

        if (typingTimer) clearInterval(typingTimer);

        el.innerHTML = "";
        el.classList.remove("ready");
        typingDone = false;
        const displayText = scrambleOnceText ?? text;
        typingFullText = displayText;
        let i = 0;

        const safe = (t) => (t === "\n" ? "<br>" : t);

        textbox.onclick = () => {
            if (!typingDone) {
                clearInterval(typingTimer);
                typingTimer = null;
                typingDone = true;
                el.innerHTML = typingFullText.replace(/\n/g, "<br>");
                el.classList.add("ready");
                textbox.onclick = null;
                resolve();
            }
        };

        typingTimer = setInterval(() => {
            el.innerHTML += safe(displayText[i++]);
            if (i >= displayText.length) {
                clearInterval(typingTimer);
                typingTimer = null;
                typingDone = true;
                el.classList.add("ready");
                textbox.onclick = null;
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
            const wrap = document.getElementById("game-wrapper");
            if (!wrap) return;
            wrap.classList.add("glitching");
            setTimeout(() => {
                wrap.classList.remove("glitching");
            }, 400);
        } else if (cmd === "-san") {
            san -= 1;
            updateSan();
        } else if (cmd === "+san") {
            san += 1;
            updateSan();
        } else if (cmd.startsWith("autoNext(")) {
            const ms = Number(cmd.match(/autoNext\((\d+)\)/)?.[1] || 0);
            if (ms > 0) {
                setTimeout(() => {
                    // すでに別のシーンに移動していたら暴発しないよう確認
                    if (current && current.next) {
                        show(current.next);
                    }
                }, ms);
            }
        } else if (cmd === "initMap") {
            if (mapEl) {
                mapEl.style.cursor = "pointer";
                updateMapView();
                mapEl.onclick = handleMapClick;
            }
            if (!document.getElementById("map-expand-btn")) {
                const btn = document.createElement("button");
                btn.id = "map-expand-btn";
                btn.textContent = "マップを拡大";
                btn.className = "map-expand-btn";
                btn.onclick = (e) => {
                    e.stopPropagation();
                    openMapModal();
                };

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
        else if (cmd === "scrambleText") {
            startScrambleText();
        }
        else if (cmd === "stopScrambleText") {
            stopScrambleText();
        } else if (cmd === "loopReset") {
            resetForLoop();
        } else if (cmd.startsWith("still(")) {
            const src = cmd.match(/still\((.+)\)/)?.[1];
            if (src) showStill(src);
        }
        else if (cmd === "clearStill") {
            clearStill();
        }
    });
}

function show(id) {
    current = findScene(id);
    stopScrambleText();
    clearStill();

    if (san === 1 && Math.random() < 0.3) {
        startScrambleText();
    }

    const textbox = document.getElementById("textbox");
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
    updateMapView();

    document.getElementById("bg").src = "img/" + current.bg;

    if (current.face) {
        face.src = "img/" + current.face;
        showEl("face");
    } else {
        face.removeAttribute("src");
    }

    const nameBox = document.getElementById("name");
    if (current.name) {
        nameBox.textContent = current.name;
    } else {
        nameBox.textContent = "";
    }

    const speed = current.speed ?? 50;
    const typingPromise = typeText(current.text, speed);

    choicesBox.innerHTML = "";
    choicesBox.classList.remove("show");
    document.getElementById("text").classList.remove("ready");

    typingPromise.then(() => {

        if (current.choices) {
            const textbox = document.getElementById("textbox");
            textbox.onclick = null;

            choicesBox.innerHTML = "";
            current.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.textContent = choice.label;
                btn.onclick = (e) => {
                    e.stopPropagation();
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

            if (current.id === "loop" && san <= 2) {
                setTimeout(() => {
                    if (current.id === "loop") {
                        show(current.choices[0].next);
                    }
                }, 700);
            }
        }
        else if (current.next) {
            const textbox = document.getElementById("textbox");
            textbox.onclick = null;
            textbox.onclick = () => {
                if (!typingDone) return;
                show(current.next);
            };
        }
    });
}

loadStory();
