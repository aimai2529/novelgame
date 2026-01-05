let story;
let current;
const choicesBox = document.getElementById("choices");

async function loadStory() {
    story = await fetch("story.json").then(r => r.json());
    show("start");
}

function findScene(id) {
    return story.find(s => s.id === id);
}

//テキスト送りアニメーション
function typeText(text) {
    const el = document.getElementById("text");
    el.textContent = "";
    let i = 0;

    const timer = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) clearInterval(timer);
    }, 25);
}

function show(id) {
    current = findScene(id);

    document.getElementById("bg").src = "img/" + current.bg;

    // テキスト
    typeText(current.text);

    choicesBox.innerHTML = "";
    choicesBox.classList.remove("show");

    // ✨ 選択肢がある場合
    if (current.choices) {
        current.choices.forEach(choice => {
            const btn = document.createElement("button");
            btn.textContent = choice.label;

            btn.onclick = () => {
                show(choice.next);
            };

            choicesBox.appendChild(btn);
        });

        // ボックスを出す
        choicesBox.classList.add("show");
    }

    // ✨ choices がないけど next がある場合
    else if (current.next) {
        document.getElementById("textbox").onclick = () => {
            show(current.next);
        };
    }
}

loadStory();