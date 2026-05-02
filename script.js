const messages = [
    { text: "今からカップ麵食うんだけどさ、通話してもいいか？", side: "left", icon: "icon.png" },
    { text: "既読無視するな！泣くぞ！", side: "left", icon: "icon.png" },
    { text: "不在着信", side: "left", icon: "icon.png" },
    { text: "おい！！", side: "left", icon: "icon.png" },
    { text: "もしもーし？", side: "left", icon: "icon.png" },
    { text: "暇なんだよ～頼む！", side: "left", icon: "icon.png" },
    { text: "もうかけるからな！！！", side: "left", icon: "icon.png" },
    { text: "どうせ見てんだから出ろよ！！？", side: "left", icon: "icon.png" },
    { text: "不在着信", side: "left", icon: "icon.png" },
    { text: "わかった、今度寿司おごる", side: "left", icon: "icon.png" },
    { text: "今から夕飯の材料買いに行くんだけど……", side: "right" },
    { text: "それでもいい！！だから電話出てくれ！！", side: "left", icon: "icon.png" },
];

const chat = document.getElementById("chat");

const screen = document.querySelector(".screen");

let index = 0;
let finished = false;
let autoScrolled = false;


function addMessage() {
    if (index >= messages.length) {
        finished = true;
        return;
    }

    const row = document.createElement("div");
    row.classList.add("message-row", messages[index].side);

    if (messages[index].side === "left" && messages[index].icon) {
        const icon = document.createElement("img");
        icon.src = `img/${messages[index].icon}`;
        icon.classList.add("icon");
        row.appendChild(icon);
    }

    const msg = document.createElement("div");
    msg.classList.add("message", messages[index].side);
    msg.textContent = messages[index].text;

    row.appendChild(msg);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    index++;
    setTimeout(addMessage, 1000);
}

// 🔥 スクロール検知
let lastScroll = 0;

screen.addEventListener("scroll", () => {
    const current = screen.scrollTop;

    // 下方向スクロールのみ反応
    if (current > lastScroll && current > 50 && !autoScrolled) {
        autoScrolled = true;

        screen.scrollTo({
            top: screen.clientHeight,
            behavior: "smooth"
        });
    }

    lastScroll = current;
});

// 🔥 メッセージ終了時に自動でcontentへ
function checkAutoScroll() {
    if (finished && !autoScrolled) {
        autoScrolled = true;

        setTimeout(() => {
            screen.scrollTo({
                top: screen.clientHeight,
                behavior: "smooth"
            });
        }, 500);
    }
}


// 監視ループ
setInterval(checkAutoScroll, 300);

// 初期ロードで開始
window.addEventListener("load", () => {
    setTimeout(addMessage, 500);
});