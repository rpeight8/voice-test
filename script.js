const items = ["берёза", "ясень", "сосна"];
const counts = {
	берёза: 0,
	ясень: 0,
	сосна: 0,
};

const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const historyLog = document.getElementById("historyLog");
let recognition = null;
let isListening = false;

let history = [];
let historyIndex = -1;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;
	recognition = new SpeechRecognition();
	recognition.lang = "ru-RU";
	recognition.continuous = false;
	recognition.interimResults = false;

	recognition.onstart = () => {
		isListening = true;
		startBtn.textContent = "Выговорилась";
		startBtn.classList.add("recording");
	};

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript.toLowerCase().trim();
		processCommand(transcript);
	};

	recognition.onerror = (event) => {
		isListening = false;
		startBtn.textContent = "Говорить";
		startBtn.classList.remove("recording");
	};

	recognition.onend = () => {
		isListening = false;
		startBtn.textContent = "Говорить";
		startBtn.classList.remove("recording");
	};

	startBtn.addEventListener("click", () => {
		if (isListening) {
			recognition.stop();
		} else {
			recognition.start();
		}
	});
} else {
	startBtn.disabled = true;
}

function processCommand(text) {
	text = text.replace(/\s+/g, " ").trim();

	let matched = false;

	for (const item of items) {
		const addPattern = new RegExp(`^${item}\\s+(\\d+)$`, "i");
		const addMatch = text.match(addPattern);

		if (addMatch) {
			const value = parseInt(addMatch[1], 10);
			addToHistory(item, value, "add");
			counts[item] += value;
			updateDisplay();
			matched = true;
			break;
		}

		const minusSignPattern = new RegExp(`^${item}\\s+-\\s*(\\d+)$`, "i");
		const minusSignMatch = text.match(minusSignPattern);

		if (minusSignMatch) {
			const value = parseInt(minusSignMatch[1], 10);
			addToHistory(item, value, "subtract");
			counts[item] -= value;
			updateDisplay();
			matched = true;
			break;
		}

		const subPattern = new RegExp(`^${item}\\s+минус\\s+(\\d+)$`, "i");
		const subMatch = text.match(subPattern);

		if (subMatch) {
			const value = parseInt(subMatch[1], 10);
			addToHistory(item, value, "subtract");
			counts[item] -= value;
			updateDisplay();
			matched = true;
			break;
		}
	}

	if (!matched) {
	}
}

function updateDisplay() {
	items.forEach((item) => {
		const countElement = document.getElementById(`count-${item}`);
		countElement.textContent = counts[item];
	});
}

function addToHistory(item, value, operation) {
	history = history.slice(0, historyIndex + 1);

	const action = {
		item: item,
		value: value,
		operation: operation,
		timestamp: new Date(),
	};

	history.push(action);
	historyIndex = history.length - 1;

	updateHistoryDisplay();
	updateUndoRedoButtons();
}

function updateHistoryDisplay() {
	if (history.length === 0) {
		historyLog.innerHTML =
			'<div class="history-empty">Пока ничего не посчитали</div>';
		return;
	}

	historyLog.innerHTML = "";

	for (let i = history.length - 1; i >= 0; i--) {
		const action = history[i];
		const entry = document.createElement("div");
		entry.className = "history-entry";

		const time = action.timestamp.toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

		const operationText =
			action.operation === "add" ? `+${action.value}` : `-${action.value}`;

		entry.textContent = `${time} - ${action.item} ${operationText}`;
		historyLog.appendChild(entry);
	}
}

function updateUndoRedoButtons() {
	undoBtn.disabled = historyIndex < 0;
	redoBtn.disabled = historyIndex >= history.length - 1;
}

function undo() {
	if (historyIndex < 0) return;

	const action = history[historyIndex];

	if (action.operation === "add") {
		counts[action.item] -= action.value;
	} else {
		counts[action.item] += action.value;
	}

	historyIndex--;
	updateDisplay();
	updateHistoryDisplay();
	updateUndoRedoButtons();
}

function redo() {
	if (historyIndex >= history.length - 1) return;

	historyIndex++;
	const action = history[historyIndex];

	if (action.operation === "add") {
		counts[action.item] += action.value;
	} else {
		counts[action.item] -= action.value;
	}

	updateDisplay();
	updateHistoryDisplay();
	updateUndoRedoButtons();
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
updateUndoRedoButtons();
