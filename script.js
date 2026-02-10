var box = document.getElementById("box");
var boxText = document.getElementById("boxText");
var startBtn = document.getElementById("startBtn");
var retryBtn = document.getElementById("retryBtn");
var timeNum = document.getElementById("timeNum");
var comment = document.getElementById("comment");
var results = document.getElementById("results");
var bestEl = document.getElementById("best");
var avgEl = document.getElementById("avg");
var triesEl = document.getElementById("tries");

var state = "idle"; // idle, waiting, go, done
var t0 = 0;
var timer = null;
var best = null;
var attempts = [];

// load saved best
try {
    var saved = localStorage.getItem("best");
    if (saved) {
        best = parseInt(saved);
        bestEl.textContent = best + " ms";
    }
} catch (e) {}

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);
box.addEventListener("click", boxClicked);

// spacebar support
document.addEventListener("keydown", function (e) {
    if (e.code !== "Space") return;
    e.preventDefault();

    if (state === "idle" || state === "done") startGame();
    else if (state === "waiting" || state === "go") boxClicked();
});

function startGame() {
    state = "waiting";
    startBtn.classList.add("hidden");
    retryBtn.classList.add("hidden");
    results.classList.add("hidden");

    box.className = "box waiting";
    boxText.textContent = "wait for it...";

    // random delay 1.5 - 4.5s
    var delay = 1500 + Math.random() * 3000;

    timer = setTimeout(function () {
        if (state !== "waiting") return;
        state = "go";
        box.className = "box go";
        boxText.textContent = "CLICK!";
        t0 = Date.now();
    }, delay);
}

function boxClicked() {
    if (state === "go") {
        // good click
        state = "done";
        var ms = Date.now() - t0;

        box.className = "box done";
        boxText.textContent = ms + " ms";

        // show results
        results.classList.remove("hidden");
        timeNum.textContent = ms;
        comment.textContent = getComment(ms);

        // track
        attempts.push(ms);
        triesEl.textContent = attempts.length;

        // average
        var sum = 0;
        for (var i = 0; i < attempts.length; i++) sum += attempts[i];
        avgEl.textContent = Math.round(sum / attempts.length) + " ms";

        // best
        if (best === null || ms < best) {
            best = ms;
            try { localStorage.setItem("best", best); } catch(e) {}
            bestEl.textContent = best + " ms";
            bestEl.classList.add("new-best");
            setTimeout(function () { bestEl.classList.remove("new-best"); }, 1500);
        }

        retryBtn.classList.remove("hidden");

    } else if (state === "waiting") {
        // too early
        clearTimeout(timer);
        state = "idle";
        box.className = "box idle";
        boxText.textContent = "too early! try again";
        startBtn.classList.remove("hidden");
    }
}

function getComment(ms) {
    if (ms < 180) return "insane reflexes";
    if (ms < 230) return "really fast, nice";
    if (ms < 300) return "pretty good!";
    if (ms < 400) return "not bad";
    return "you can do better";
}

