(function () {
    var BASE = "https://abacus.jasoncameron.dev";
    var NS = "couple-score";
    var KEY = "visits";
    var STORAGE_KEY = "couple_score_visit_day";

    function todayKey() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
    }

    function hide() {
        var el = document.getElementById("visit-count");
        if (!el) return;
        el.classList.remove("is-visible");
        el.setAttribute("aria-hidden", "true");
    }

    function show(value) {
        var el = document.getElementById("visit-count");
        var num = document.getElementById("visit-count-num");
        if (!el || !num) return;
        var n = parseInt(value, 10);
        if (!isFinite(n) || n < 0) {
            hide();
            return;
        }
        num.textContent = n.toLocaleString("ko-KR");
        el.classList.add("is-visible");
        el.removeAttribute("aria-hidden");
    }

    function fetchJson(url) {
        return fetch(url, { cache: "no-store" }).then(function (res) {
            return res.ok ? res.json() : null;
        });
    }

    function init() {
        var already = false;
        try {
            already = localStorage.getItem(STORAGE_KEY) === todayKey();
        } catch (_) { /* no-op */ }

        var value;
        var chain = Promise.resolve();

        if (!already) {
            chain = fetchJson(BASE + "/hit/" + NS + "/" + KEY).then(function (data) {
                if (data && typeof data.value !== "undefined") {
                    value = data.value;
                    try { localStorage.setItem(STORAGE_KEY, todayKey()); } catch (_) { /* no-op */ }
                }
            });
        }

        chain
            .then(function () {
                return fetchJson(BASE + "/get/" + NS + "/" + KEY);
            })
            .then(function (data) {
                if (data && typeof data.value !== "undefined") value = data.value;
                if (typeof value === "undefined") hide();
                else show(value);
            })
            .catch(function () { hide(); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
