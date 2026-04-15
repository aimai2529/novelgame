let story;
let current;

let mapFloor = 1;
let mapModal = null;
let mapOverlayHint = null;
const mapEl = document.getElementById("map");

let mapLocked = false;
let stillEl = null;
let screenEl = null;

let returnSceneId = null;

let charaEl = null;

let typingTimer = null;
let scrambleActive = false;
let scrambleInterval = null;
let typingDone = false;
let typingFullText = "";
let scrambleOnceText = null;
const choicesBox = document.getElementById("choices");

let remainingTargets = Number(localStorage.getItem("remainingTargets") ?? 4);

let executedScenes = JSON.parse(localStorage.getItem("executedScenes") || "[]");

const face = document.getElementById("call-face");
function showEl(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hideEl(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

const itemDB = {
    "note": {
        name: "買い物メモ",
        image: "item_note.png",
        description: "にんじん、豚肉、カレールー……色々と足りない"
    },
    "carrot": {
        name: "にんじん",
        image: "item_carrot.png",
        description: "鮮やかなオレンジ色をした、艶ハリのあるいいにんじんだ"
    },
    "meat": {
        name: "豚肉",
        image: "item_meat.png",
        description: "白と薄桃の境界がはっきりした、新鮮そうな肉だ"
    },
    "meat2": {
        name: "自慢の肉",
        image: "item_meat.png",
        description: "サービスでもらった、なんのものかわからない肉塊"
    },
    "curry1": {
        name: "カレールー",
        image: "item_curry.png",
        description: "りんごと蜂蜜が効いた、甘めのルーだ"
    },
    "curry2": {
        name: "カレールー",
        image: "item_curry.png",
        description: "さわやかな辛さと深いコクの、辛めのルーだ"
    },
    "dounut": {
        name: "ドーナツ",
        image: "item_dounut.png",
        description: "毒毒しいと感じるほど鮮やかに彩られたドーナツ"
    },
    "note2": {
        name: "求人票？",
        image: "item_note.png",
        description: "血塗れでぐしゃぐしゃの求人票。「面接は雑貨屋でやります！いっぱいきてください！」と可愛らしい文字で書いてある。"

    }
};

let items = JSON.parse(localStorage.getItem("items") || "[]");
let toiletVisited = Number(localStorage.getItem("toiletVisited") || 0);
let foodsVisited = Number(localStorage.getItem("foodsVisited") || 0);
let loopCount = Number(localStorage.getItem("loopCount") || 0);
let san = Number(localStorage.getItem("san") ?? 3);

async function loadStory() {
    if (story) return;

    const files = [
        "story/story.json",
        "story/op.json",
        "story/foods1.json",
        "story/foods2.json",
        "story/foods3.json",
        "story/foods4.json",
        "story/exit.json"
    ];

    let all = [];

    for (const file of files) {
        const data = await fetch(file).then(r => r.json());
        all = all.concat(data);
    }

    story = all;

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

    foodsVisited = 0;
    localStorage.setItem("foodsVisited", foodsVisited);

    san = 3;
    updateSan();

    items = [];
    localStorage.setItem("items", JSON.stringify(items));
    renderItems();

    executedScenes = [];
    localStorage.setItem("executedScenes", JSON.stringify(executedScenes));

    loopCount++;
    localStorage.setItem("loopCount", loopCount);

    console.log("loop:", loopCount);

    remainingTargets = 4;
    updateRemainingTargets();
}

//制限時間関連
function updateRemainingTargets() {
    const el = document.getElementById("hud-top-left");
    if (!el) return;

    // 残り時間（分）
    const remainingMinutes = remainingTargets * 30;

    let timeText = "";
    if (remainingMinutes >= 60) {
        const hour = Math.floor(remainingMinutes / 60);
        const min = remainingMinutes % 60;
        timeText = min === 0 ? `${hour}時間` : `${hour}時間${min}分`;
    } else {
        timeText = `${remainingMinutes}分`;
    }

    el.innerHTML = `閉店まで${timeText} <br>- アト${remainingTargets}箇所`;

    localStorage.setItem("remainingTargets", remainingTargets);
    remainingTargets = Number(localStorage.getItem("remainingTargets") ?? remainingTargets);

}

// アイテム関連
function showItemDetail(itemId) {
    const data = itemDB[itemId];
    if (!data) return;

    returnSceneId = current?.id || null;

    stopScrambleText();
    clearStill();
    clearScreen();

    choicesBox.classList.remove("show");
    choicesBox.innerHTML = "";

    const nameBox = document.getElementById("name");
    nameBox.textContent = data.name;

    const textbox = document.getElementById("textbox");
    textbox.onclick = null;

    typeText(data.description, 30).then(() => {
        textbox.onclick = () => {
            if (returnSceneId) {
                const back = returnSceneId;
                returnSceneId = null;
                show(back);
            }
        };
    });
}

function renderItems() {
    const slots = document.querySelectorAll(".slot");

    slots.forEach((slot, index) => {
        slot.innerHTML = "";
        slot.onclick = null;

        const itemId = items[index];
        if (!itemId) return;

        const data = itemDB[itemId];
        if (!data) return;

        const img = document.createElement("img");
        img.src = "img/" + data.image;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";

        slot.appendChild(img);

        slot.onclick = () => {
            showItemDetail(itemId);
        };
    });
}

function addItem(itemId) {
    if (!itemDB[itemId]) return false;

    if (items.length >= 6) {
        console.log("アイテム満杯のため取得スキップ");
        return false;
    }

    items.push(itemId);
    localStorage.setItem("items", JSON.stringify(items));
    renderItems();
    return true;
}

function hasItem(itemId) {
    return items.includes(itemId);
}

function removeItem(itemId) {
    const index = items.indexOf(itemId);
    if (index === -1) return false;

    items.splice(index, 1);
    localStorage.setItem("items", JSON.stringify(items));
    renderItems();
    return true;
}

// マップ関連
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
    if (mapLocked) return;

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

function lockMap() {
    mapLocked = true;
    if (mapEl) {
        mapEl.style.pointerEvents = "none";
        mapEl.style.cursor = "default";
    }
    if (document.getElementById("map-expand-btn")) {
        document.getElementById("map-expand-btn").remove();
    }
}

function unlockMap() {
    mapLocked = false;
    if (mapEl) {
        mapEl.style.pointerEvents = "";
        mapEl.style.cursor = "pointer";
        mapEl.onclick = handleMapClick;
    }
    if (!document.getElementById("map-expand-btn")) {
        const btn = document.createElement("button");
        btn.id = "map-expand-btn";
        btn.textContent = "マップを拡大";
        btn.onclick = (e) => {
            e.stopPropagation();
            openMapModal();
        };

        mapEl.style.position = mapEl.style.position || "relative";
        mapEl.appendChild(btn);
    }

}

function locationLoad(id) {
    if (remainingTargets <= 0) {
        show("closing_event");
        return;
    }

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
        if (foodsVisited === 0) {
            show("foods1");
        } else if (foodsVisited === 1) {
            show("foods2");
        } else if (foodsVisited === 2) {
            show("foods3");
        } else {
            show("foods4");
        }
    } else if (id === "map_1_0_1") {
        show(getExitScene());
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

//出口エンド分岐
function getExitScene() {
    const hasCarrot = hasItem("carrot");
    const hasMeat = hasItem("meat");
    const hasCurry1 = hasItem("curry1");
    const hasCurry2 = hasItem("curry2");

    if (hasCarrot && hasMeat && hasCurry1) return "exit02";
    if (hasCarrot && hasMeat && hasCurry2) return "exit03";
    return "exit01";
}

//正気度関連
function updateSan() {
    san = Math.max(0, Math.min(3, san));
    localStorage.setItem("san", san);
    const img = document.getElementById("san-image");
    img.src = `./img/san_${san}.png`;
}

//スチル関連
function showStill(src) {
    const game = document.getElementById("game");

    if (!stillEl) {
        stillEl = document.createElement("div");
        stillEl.className = "still-container";

        const img = document.createElement("img");
        img.className = "still-image";
        stillEl.appendChild(img);

        game.append(stillEl);
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

function showScreen(src) {
    const game = document.getElementById("game");

    if (!screenEl) {
        screenEl = document.createElement("div");
        screenEl.className = "screen-container";

        const img = document.createElement("img");
        img.className = "screen-image";
        screenEl.appendChild(img);

        game.append(screenEl);
    }

    const img = screenEl.querySelector("img");
    img.src = "img/" + src;

    screenEl.classList.add("show");
}

function clearScreen() {
    if (screenEl) {
        screenEl.classList.remove("show");
    }
}

//キャラクター立ち絵関連

function showChara(src) {
    const video = document.getElementById("video");
    if (!video) return;

    if (!charaEl) {
        charaEl = document.createElement("img");
        charaEl.className = "chara";
        video.appendChild(charaEl);
    }

    charaEl.src = "img/" + src;
    charaEl.style.display = "block";
}

function clearChara() {
    if (charaEl) {
        charaEl.style.display = "none";
    }
}

//テキスト関連

function startScrambleText() {
    const el = document.getElementById("text");
    if (!el) return;

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

function typeText(text, speed = 60) {
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

//スキップボタン
function isOpScene(id) {
    return id.startsWith("op_");
}

function createSkipButtonIfNeeded() {

    // 既存ボタン消す
    const old = document.getElementById("skip-btn");
    if (old && !isOpScene(current.id)) old.remove();

    // 条件：2周目以降＆OPシーン
    if (loopCount < 2 || !isOpScene(current.id) || old) return;

    const btn = document.createElement("div");
    btn.id = "skip-btn";
    btn.textContent = "▶ 行先選択までスキップ";

    btn.style.position = "absolute";
    btn.style.right = "10px";
    btn.style.bottom = "30px";
    btn.style.fontSize = "32px";
    btn.style.opacity = "0";
    btn.style.transition = "opacity 0.5s";
    btn.style.cursor = "pointer";

    const textbox = document.getElementById("textbox");
    textbox.appendChild(btn);

    // フェードイン
    setTimeout(() => {
        btn.style.opacity = "0.6";
    }, 1000);

    // クリックでスキップ
    btn.onclick = (e) => {
        e.stopPropagation();

        show("search");
    };
}

//コマンド
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
                    if (current && current.next) {
                        show(current.next);
                    }
                }, ms);
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
            hint.className = "map-overlay-hint";
            hint.textContent = msg;

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
        } else if (cmd === "mapLock") {
            lockMap();
        }
        else if (cmd === "mapUnlock") {
            unlockMap();
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
        } else if (cmd.startsWith("screen(")) {
            const src = cmd.match(/screen\((.+)\)/)?.[1];
            if (src) showScreen(src);
        }
        else if (cmd === "clearScreen") {
            clearScreen();
        }
        else if (cmd.startsWith("getItem(")) {
            const id = cmd.match(/getItem\((.+)\)/)?.[1];
            if (!id) return;

            if (hasItem(id)) {
                return;
            }

            const success = addItem(id);
            if (!success) {
            }
        } else if (cmd.startsWith("removeItem(")) {
            const id = cmd.match(/removeItem\((.+)\)/)?.[1];
            if (id) {
                removeItem(id);
            }
        }
        else if (cmd.startsWith("target(")) {
            const value = Number(cmd.match(/target\(([-\d]+)\)/)?.[1] || 0);
            remainingTargets += value;
            if (remainingTargets < 0) remainingTargets = 0;
            updateRemainingTargets();
        } else if (cmd === "textBig") {
            const text = document.getElementById("text");
            if (text) text.classList.add("big-text");
        }
        else if (cmd === "textNormal") {
            const text = document.getElementById("text");
            if (text) text.classList.remove("big-text");
        } else if (cmd.startsWith("shake")) {
            const duration = Number(cmd.match(/shake\((\d+)\)/)?.[1] || 500);

            const wrap = document.getElementById("game-wrapper");
            if (!wrap) return;

            wrap.classList.add("shake");

            setTimeout(() => {
                wrap.classList.remove("shake");
            }, duration);
        }
        else if (cmd.startsWith("chara(")) {
            const src = cmd.match(/chara\((.+)\)/)?.[1];
            if (src) showChara(src);
        }
        else if (cmd === "clearChara") {
            clearChara();
        } else if (cmd.startsWith("foods(")) {
            const value = Number(cmd.match(/foods\(([-\d]+)\)/)?.[1] || 0);

            foodsVisited += value;
            if (foodsVisited < 0) foodsVisited = 0;

            localStorage.setItem("foodsVisited", foodsVisited);

            console.log("foodsVisited:", foodsVisited);
        }
    });
}

function show(id) {
    current = findScene(id);
    stopScrambleText();
    clearStill();
    clearScreen();
    returnSceneId = null;

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

    createSkipButtonIfNeeded();

    localStorage.setItem("novel_save_scene", id);

    if (current.commands) {

        if (!executedScenes.includes(current.id)) {
            runCommands(current.commands);

            if (id.includes('_') && !id.includes('_A')) {
                executedScenes.push(current.id);
                localStorage.setItem("executedScenes", JSON.stringify(executedScenes));
            }
        }
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

    renderItems();
    updateRemainingTargets();

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
                    const wrap = document.getElementById("game-wrapper");
                    if (!wrap) return;
                    wrap.classList.add("glitching");
                    setTimeout(() => {
                        wrap.classList.remove("glitching");
                    }, 500);
                    showScreen("screen_touch.png");
                }, 500);

                setTimeout(() => {
                    if (current.id === "loop") {
                        show(current.choices[0].next);
                    }
                }, 1000);
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

function lockMainUI() {
    document.getElementById("choices").style.pointerEvents = "none";
    document.getElementById("textbox").style.pointerEvents = "none";
    document.getElementById("map").style.pointerEvents = "none";
}

function unlockMainUI() {
    document.getElementById("choices").style.pointerEvents = "";
    document.getElementById("textbox").style.pointerEvents = "";
    document.getElementById("map").style.pointerEvents = "";
}
