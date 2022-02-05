const row_container = document.getElementById("row-container");
const label = document.getElementById("label-warning");

let rows = [];
let current_row = 0;
let typed_word = "";
let selected_word = "model";

let won = false;

// Cod pentru determinarea cuvantului de azi
// Este luat de aici: https://reichel.dev/blog/reverse-engineering-wordle.html
function getDateDifference(e, a) {
	var s = new Date(e),
		t = new Date(a).setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
	return Math.floor(t / 864e5);
}

var baseDate = new Date(2022, 1, 5, 0, 0, 0, 0);

function callGetDateDifference(todaysDate) {
	return getDateDifference(baseDate, todaysDate);
}

function getWordOfTheDay(today) {
	var a,
		s = callGetDateDifference(today);
	return (a = s % cuvinte.length), cuvinte[a];
}

// Cuvantul de azi (fara diacritice)
selected_word = removeDiacritics(getWordOfTheDay(new Date()));
//console.log(selected_word);

// Adauga randurile
for (let index = 0; index < 6; index++) {
	const row = getRow();
	rows.push(row);
	row_container.appendChild(row);
}

// Eventuri tastatura virtuala
Array.from(document.getElementsByClassName("keyboard-button")).forEach(
	(button) => {
		const key = button.innerText;
		button.addEventListener("click", () => {
			keyPressed(key);
		});
	},
);

// Event tastatura fizica
window.addEventListener("keydown", function (event) {
	const key = event.key; // "a", "1", "Shift", etc.
	keyPressed(key);
});

function keyPressed(key) {
	if (won) return;

	key = key.toLowerCase();

	if (key == "backspace" || key == "⌫") {
		typed_word = typed_word.slice(0, -1);
	} else if (key == "enter") {
		document.activeElement.blur();
		if (typed_word.length == 5) {
			// Vedem daca incercarea este un cuvant valid
			if (!cuvinte.find((element) => typed_word == removeDiacritics(element))) {
				warning("Cuvantul nu este in lista", false);
				return;
			}

			const validation = validateGuess(typed_word);
			setCellColors(current_row, validation.match);
			setKeyColors(validation.match_by_letters);

			if (validation.match == "ccccc") {
				won = true;
				warning("Corect!", true);
			}

			if (current_row < 5) {
				current_row += 1;
				typed_word = "";
			} else {
				warning("Ai pierdut! Incerca si maine", true);
			}
		}
	} else if (isLetter(key)) {
		if (typed_word.length < 5) {
			typed_word += key.toLowerCase();
		}
	}
	for (let index = 0; index < 5; index++) {
		const letter = typed_word[index] ? typed_word[index] : "";
		const cell = rows[current_row].children[index];
		cell.textContent = letter.toUpperCase();
	}
}

function validateGuess(guessed_word) {
	let match = "";
	let match_by_letters = {};
	let letters_indexed = {};

	// Here I say how many times a letter is present in selected_word
	// E.g {a: 0, b:3, e: 2}
	for (let index = 0; index < selected_word.length; index++) {
		// For every letter in selected_word
		if (letters_indexed[selected_word[index]]) {
			letters_indexed[selected_word[index]]++;
		} else {
			letters_indexed[selected_word[index]] = 1;
		}
		// Add a ? to match
		match += "?"; // I initialize match here because I might change word lenght
	}

	// Here I check for correct letters
	for (let index = 0; index < guessed_word.length; index++) {
		const letter = guessed_word[index];
		if (selected_word.indexOf(guessed_word[index]) !== -1) {
			if (letter == selected_word[index]) {
				match = setCharAt(match, index, "c");
				match_by_letters[guessed_word[index]] = "correct";
				letters_indexed[letter]--;
			}
		} else {
			match_by_letters[guessed_word[index]] = "nowhere";
		}
	}

	// Here I check for "elsewhere" letters
	for (let index = 0; index < guessed_word.length; index++) {
		const letter = guessed_word[index];
		if (selected_word.indexOf(guessed_word[index]) !== -1) {
			if (letters_indexed[letter] > 0) {
				if (match[index] != "c") {
					match = setCharAt(match, index, "e");
					match_by_letters[guessed_word[index]] = "elsewhere";
					letters_indexed[letter]--;
				}
			}
		}
	}
	// Replace all remaining "?"s with nowhere
	match = match.replaceAll("?", "n");

	return { match: match, match_by_letters: match_by_letters };
}

function setCellColors(row_index, match) {
	const cells = rows[row_index].children;

	for (let index = 0; index < cells.length; index++) {
		const cell = cells[index];
		switch (match[index]) {
			case "n": // Nowhere
				cell.classList.add("cell-nowhere");
				break;

			case "e": // Elsewhere
				cell.classList.add("cell-elsewhere");
				break;
			case "c": // Correct
				cell.classList.add("cell-correct");
				break;
		}
	}
}

function setKeyColors(key_colors) {
	const keys = document.getElementsByClassName("keyboard-button");

	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];

		if (
			!(key.innerText.toLowerCase() in key_colors) ||
			key.classList.contains("cell-correct") ||
			key.classList.contains("cell-nowhere")
		) {
			continue;
		}

		switch (key_colors[key.innerText.toLowerCase()]) {
			case "nowhere":
				key.classList.add("cell-nowhere");
				break;
			case "elsewhere":
				key.classList.add("cell-elsewhere");
				break;
			case "correct":
				key.classList.remove("cell-elsewhere");
				key.classList.add("cell-correct");
				break;
		}
	}
}

function getCell() {
	const cell = document.createElement("div");
	cell.className = "cell";
	return cell;
}

function getRow() {
	const row = document.createElement("div");
	row.className = "row";

	for (let index = 0; index < 5; index++) {
		const cell = getCell();
		row.appendChild(cell);
	}

	return row;
}

function warning(text, permanent) {
	label.textContent = text;
	label.style.opacity = 1.0;

	if (!permanent) {
		setTimeout(() => {
			label.style.opacity = 0.0;
		}, 2000);
	}
}

// Misc
function clamp(number, min, max) {
	return Math.max(min, Math.min(number, max));
}

function isLetter(c) {
	return c.length == 1 && !!c.match(/^[a-z]*$/i);
}

function setCharAt(str, index, chr) {
	if (index > str.length - 1) return str;
	return str.substring(0, index) + chr + str.substring(index + 1);
}

function removeDiacritics(word) {
	return word
		.replaceAll(new RegExp("ă", "ig"), "a")
		.replaceAll(new RegExp("â", "ig"), "a")
		.replaceAll(new RegExp("î", "ig"), "i")
		.replaceAll(new RegExp("ș", "ig"), "s")
		.replaceAll(new RegExp("ț", "ig"), "t");
}
