/* Shared interactive components for Hermes teaching lessons.
   Load from a lesson with: <script src="../assets/quiz.js" defer></script>

   Components (declarative — author markup, this file wires behavior):

   1. Multiple choice question:
      <div class="qz" data-correct="2" data-why="Explanation shown after answering.">
        <p class="qz-prompt">Question text?</p>
        <button class="qz-opt" type="button">Option A</button>
        <button class="qz-opt" type="button">Option B</button>
        <button class="qz-opt" type="button">Option C</button>
        <p class="qz-feedback" hidden></p>
      </div>

   2. Classification task:
      <div class="cl" data-cats="Category one|Category two">
        <div class="cl-item" data-cat="0" data-why="Explanation.">
          <p>Statement to classify.</p>
        </div>
        ...
      </div>

   Wrap either in <section class="exercise" data-scored> containing a
   <p class="score" data-score>Score: 0 / 0</p> to get a running score. */

(function () {
  "use strict";

  function initQuiz() {
    document.querySelectorAll(".qz").forEach(function (q) {
      var correct = parseInt(q.dataset.correct, 10);
      var opts = Array.prototype.slice.call(q.querySelectorAll(".qz-opt"));
      var feedback = q.querySelector(".qz-feedback");
      opts.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          if (q.dataset.done) return;
          q.dataset.done = "1";
          opts.forEach(function (b) { b.disabled = true; });
          opts[correct].classList.add("is-correct");
          if (i !== correct) btn.classList.add("is-wrong");
          if (feedback) {
            feedback.textContent =
              (i === correct ? "Correct. " : "Not quite. ") + (q.dataset.why || "");
            feedback.classList.add(i === correct ? "ok" : "no");
            feedback.hidden = false;
          }
          bumpScore(q.closest("[data-scored]"), i === correct);
        });
      });
    });
  }

  function initClassify() {
    document.querySelectorAll(".cl").forEach(function (cl) {
      var cats = (cl.dataset.cats || "").split("|");
      cl.querySelectorAll(".cl-item").forEach(function (item) {
        var correct = parseInt(item.dataset.cat, 10);
        var bar = document.createElement("div");
        bar.className = "cl-btns";
        cats.forEach(function (label, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "cl-btn";
          b.textContent = label;
          b.addEventListener("click", function () {
            if (item.dataset.done) return;
            item.dataset.done = "1";
            bar.querySelectorAll(".cl-btn").forEach(function (x, j) {
              x.disabled = true;
              if (j === correct) x.classList.add("is-correct");
            });
            if (i !== correct) b.classList.add("is-wrong");
            var why = document.createElement("p");
            why.className = "cl-why " + (i === correct ? "ok" : "no");
            why.textContent =
              (i === correct
                ? "Right — "
                : "It belongs to “" + cats[correct] + "” — ") +
              (item.dataset.why || "");
            item.appendChild(why);
            bumpScore(item.closest("[data-scored]"), i === correct);
          });
          bar.appendChild(b);
        });
        item.appendChild(bar);
      });
    });
  }

  function bumpScore(scope, ok) {
    if (!scope) return;
    var out = scope.querySelector("[data-score]");
    if (!out) return;
    var right = parseInt(out.dataset.right || "0", 10) + (ok ? 1 : 0);
    var total = parseInt(out.dataset.total || "0", 10) + 1;
    out.dataset.right = String(right);
    out.dataset.total = String(total);
    out.textContent = "Score: " + right + " / " + total;
  }

  function boot() {
    initQuiz();
    initClassify();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
