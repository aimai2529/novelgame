(function () {
    const BASE_W = 1600;
    const BASE_H = 900;
    const game = document.getElementById("game");

    function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const scale = Math.min(w / BASE_W, h / BASE_H);

        game.style.width = BASE_W + "px";
        game.style.height = BASE_H + "px";

        // 中央寄せ + 16:9 を保ったまま丸ごと縮小
        game.style.transform = "scale(" + scale + ")";
    }

    window.addEventListener("resize", resize);
    resize();
})();
