// Load audio files
const sounds = {
  number: new Audio("number click.wav"),
  operator: new Audio("operators.wav"),
  equals: new Audio("equals to.wav"),
  error: new Audio("error.wav"),
  history: new Audio("history.wav"),
  toggle: new Audio("toggle scientific.wav"),
  backspace: new Audio("backspace.wav"),
  theme: new Audio("theme.wav"),
  trash: new Audio("trash.wav")
};

function playSound(type) {
  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play();
  }
}

const themeToggle = document.getElementById("theme-toggle");
const sciToggle = document.getElementById("toggle-scientific");
const clearHistory = document.getElementById("clear-history");
const historyButton = document.getElementById("history-button");
const historyPanel = document.getElementById("history-panel");
const display = document.getElementById("display");
const historyList = document.getElementById("history-list");

let expression = "";
let openParentheses = 0;
let errorDisplayed = false;

function updateDisplay() {
  display.value = expression.replace(/\*/g, "×");
  setTimeout(() => (display.scrollLeft = display.scrollWidth), 0);
}

function hasInvalidLog(expr) {
  return /log\(0\)/.test(expr);
}

function hasInvalidSqrt(expr) {
  const matches = [...expr.matchAll(/√\((-?\d+(\.\d+)?)\)/g)];
  return matches.some(match => parseFloat(match[1]) < 0);
}

function showError(msg = "Error") {
  display.value = msg;
  playSound("error");
  errorDisplayed = true;
  expression = "";
  openParentheses = 0;
  display.classList.add("shake");
  setTimeout(() => display.classList.remove("shake"), 400);
  if (navigator.vibrate) navigator.vibrate(200);
}

themeToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  playSound("theme");
});

sciToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const sci = document.getElementById("scientific-section");
  sci.style.display = sci.style.display === "none" || sci.style.display === "" ? "block" : "none";
  playSound("toggle");
});

historyButton.addEventListener("click", (e) => {
  e.stopPropagation();
  historyPanel.classList.toggle("open");
  playSound("history");
});

clearHistory.addEventListener("click", (e) => {
  e.stopPropagation();
  historyList.innerHTML = "";
  playSound("trash");
});

function handleButtonClick(value) {
  if (errorDisplayed && /^[0-9.(\-]/.test(value)) {
    if (expression === "" || /^[0-9.π+\-*/^()]*$/.test(expression)) {
      expression = "";
      display.value = "";
    }
    errorDisplayed = false;
  }

  if (!isNaN(value) || value === ".") {
    if (expression && [")", "π"].includes(expression.slice(-1))) expression += "*";
    expression += value;
    updateDisplay();
    playSound("number");

  } else if (["+", "-", "*", "/", "^"].includes(value)) {
    if (expression === "" && value !== "-") return;
    if (["+", "-", "*", "/", "^"].includes(expression.slice(-1)) && !(value === "-" && expression.slice(-1) !== "-")) return;
    expression += value;
    updateDisplay();
    playSound("operator");

  } else if (value === "=") {
    if (expression.trim() === "") return showError();

    if (hasInvalidLog(expression)) return showError("Undefined");
    if (hasInvalidSqrt(expression)) return showError("Error");

    try {
      let open = (expression.match(/\(/g) || []).length;
      let close = (expression.match(/\)/g) || []).length;
      let balance = open - close;
      let evalExpression = expression + ")".repeat(Math.max(0, balance));

      evalExpression = evalExpression
        .replace(/sin\(/g, 'Math.sin(Math.PI/180*')
        .replace(/cos\(/g, 'Math.cos(Math.PI/180*')
        .replace(/tan\(/g, 'Math.tan(Math.PI/180*')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/π/g, Math.PI)
        .replace(/\^/g, '**');

      const tanArgs = [...expression.matchAll(/tan\(([^()]*)/g)];
      for (const match of tanArgs) {
        const angleExpr = match[1];
        try {
          const angleValue = Function('"use strict";return (' + angleExpr + ')')();
          if (Math.abs((angleValue % 180) - 90) < 1e-8) {
            return showError("Undefined");
          }
        } catch {
          return showError("Error");
        }
      }

      const result = eval(evalExpression);

      if (result === Infinity || isNaN(result)) {
        return showError(result === Infinity ? "∞" : "Error");
      }

      let rounded;
if (Math.abs(result % 1) < 1e-10) {
  rounded = parseInt(result.toFixed(0));
} else {
  rounded = parseFloat(result.toFixed(12));
}

      historyList.innerHTML += `<div>${expression.replace(/\*/g, "×")} = ${rounded}</div>`;
      expression = rounded.toString();
      openParentheses = 0;
      updateDisplay();
      playSound("equals");

    } catch {
      showError();
    }

  } else if (value === "C") {
    expression = "";
    display.value = "";
    openParentheses = 0;
    playSound("trash");

  } else if (value === "←") {
    if (expression.length > 0) {
      const lastChar = expression.slice(-1);
      if (lastChar === "(") openParentheses--;
      else if (lastChar === ")") openParentheses++;
      expression = expression.slice(0, -1);
      updateDisplay();
      playSound("backspace");
    }

  } else if (value === "H") {
    historyPanel.classList.toggle("open");
    playSound("history");

  } else if (value === "T") {
    sciToggle.click();

  } else if (value === "()") {
    if (expression === "" || ["+", "-", "*", "/", "^", "("].includes(expression.slice(-1))) {
      expression += "(";
      openParentheses++;
    } else if (openParentheses > 0) {
      expression += ")";
      openParentheses--;
    } else {
      expression += "*(";
      openParentheses++;
    }
    updateDisplay();
    playSound("operator");

  } else {
    if (["π", "√", "log", "ln", "sin", "cos", "tan"].includes(value)) {
      if (expression && (!isNaN(expression.slice(-1)) || expression.slice(-1) === ")")) {
        expression += "*";
      }
      if (value === "π") {
        expression += "π";
      } else {
        expression += `${value}(`;
        openParentheses++;
      }
      updateDisplay();
      playSound("operator");
    }
  }
}

document.querySelectorAll("button").forEach(btn => {
  if (["toggle-scientific", "clear-history", "history-button", "theme-toggle"].includes(btn.id)) return;
  btn.addEventListener("click", () => {
    const value = btn.value || btn.textContent;
    handleButtonClick(value);
  });
});

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === "Enter" || key === "=") {
    handleButtonClick("=");
  } else if (key === "Backspace") {
    handleButtonClick("←");
  } else if (key === "c" || key === "C") {
    handleButtonClick("C");
  } else if (key === "h" || key === "H") {
    handleButtonClick("H");
  } else if (key === "t" || key === "T") {
    handleButtonClick("T");
  } else if (key === "(") {
    handleButtonClick("()");
  } else if (!isNaN(key) || ["+", "-", "*", "/", ".", ")"].includes(key)) {
    handleButtonClick(key);
  }
});

updateDisplay();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => {
        console.log("Service Worker registered!", reg);

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log("New update found — reloading...");
              window.location.reload();
            }
          };
        };

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch(err => console.error("Service Worker registration failed:", err));
  });
}
