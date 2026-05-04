const endingsList = document.getElementById("endings-list");
const visitedCount = document.getElementById("visited-count");
const loopCountEl = document.getElementById("loop-count");

function getLoopCount() {
    try {
        const count = parseInt(localStorage.getItem("loopCount") || "0", 10);
        return count;
    } catch {
        return 0;
    }
}

function loadEndings() {
    fetch("endings.json")
        .then(response => response.json())
        .then(data => renderEndings(data))
        .catch(() => {
            endingsList.innerHTML = "<p>エンドデータを読み込めませんでした。</p>";
        });
}

function getVisitedEndings() {
    try {
        const raw = localStorage.getItem("visitedEndings");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function renderEndings(endings) {
    const visited = getVisitedEndings();
    const unlockedCount = endings.filter(end => visited.includes(end.id)).length;
    const loopCount = getLoopCount();

    loopCountEl.textContent = `あなたはここまで、${loopCount}回のおつかいをしました！`;
    visitedCount.textContent = `あなたが見届けた結末　 ${unlockedCount} / ${endings.length} 個`;

    endingsList.innerHTML = endings.map(end => {
        const unlocked = visited.includes(end.id);
        const conditionText = unlocked ? end.condition : "？？？";
        const stillHtml = end.still ?
            (unlocked ? `<img src="../game/img/${end.still}" alt="${end.title}">` : "") : "";

        return `
            <article class="card">
                <h2>${end.id} / ${unlocked ? end.title : "？？？"}</h2>
                <div class="condition">
                    <span>条件</span>
                    <span>${conditionText}</span>
                </div>
                ${stillHtml}
            </article>
        `;
    }).join("");
}

loadEndings();
