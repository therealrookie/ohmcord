const keywords = [
  { text: "Ja", emoji: "✅" },
  { text: "Nein", emoji: "❌" },
  { text: "Vielleicht", emoji: "🤔" },
  { text: "Heute", emoji: "📅" },
  { text: "Morgen", emoji: "🌅" },
  { text: "Später", emoji: "⏳" },
  { text: "Vormittags", emoji: "🌄" },
  { text: "Nachmittags", emoji: "🌞" },
  { text: "Abends", emoji: "🌇" },
  { text: "Vorlesung", emoji: "🎓" },
  { text: "Seminar", emoji: "📚" },
  { text: "Übung", emoji: "✍️" },
  { text: "Abgabe", emoji: "📤" },
  { text: "Pause", emoji: "⏸️" },
  { text: "Prüfung", emoji: "📝" },
  { text: "Referat", emoji: "🗣️" },
  { text: "Klausur", emoji: "📜" },
  { text: "Gruppe", emoji: "👥" },
  { text: "Einzelarbeit", emoji: "👤" },
  { text: "Diskussion", emoji: "💬" },
  { text: "Zustimmung", emoji: "👍" },
  { text: "Ablehnung", emoji: "👎" },
  { text: "Neutral", emoji: "🤷" },
];
const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const calendarDates = document.querySelector(".calendar-dates");
const monthYear = document.getElementById("month-year");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const calendarWeekdays = document.getElementById("calendar-weekdays");
const timePicker = document.getElementById("time-picker-container");
const timeSelection = document.getElementById("time-selection");

let currentInput = undefined;
let currentDate = new Date();
let currentTime = { hours: currentDate.getHours(), minutes: currentDate.getMinutes() - (currentDate.getMinutes() % 5) };
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Render all the different selection-types (keywords, time, weekdays, date)
function renderMarkup() {
  addKeywords();
  addTimePicker();
  addWeekdays();
  addCalendarWeekdays();
  renderCalendar(currentMonth, currentYear);
}

// Add a selection to the last focused input or add a new answer and set the value
function setAnswerInput(text, emoji) {
  if (currentInput !== undefined) {
    currentInput.value = `${currentInput.value}${currentInput.value && ", "}${text}`;
    currentInput.previousSibling.innerHTML = emoji;
    currentInput.classList.remove("focus");
    currentInput = undefined;
  } else {
    addAnswer(text, emoji);
  }
}

// Adds a zero in front of a single digit and returns the String
function addZeroToSingleDigit(digit) {
  if (digit >= 0 && digit < 10) {
    return `0${digit}`;
  } else return digit;
}

// When an inputField is clicked/focused it is saved as the currentInput
function setSelectedInput() {
  const inputField = document.activeElement;
  if (inputField.type === "text") {
    currentInput != undefined ? currentInput.classList.remove("focus") : null;
    currentInput = inputField;
    inputField.classList.add("focus");
  }
}

document.addEventListener("click", setSelectedInput);

/*
    Keyword Selection - Render keywords
*/

// Create and return single keyword
function createKeyword(keyword) {
  const keywordDiv = document.createElement("div");
  keywordDiv.classList.add("keyword");
  keywordDiv.innerHTML = `${keyword.emoji} ${keyword.text}`;
  keywordDiv.addEventListener("click", () => setAnswerInput(keyword.text, keyword.emoji));

  return keywordDiv;
}

// Add keywords to their container
function addKeywords() {
  const keywordPicker = document.getElementById("keyword-picker");
  keywords.forEach((keyword) => {
    const keywordDiv = createKeyword(keyword);
    keywordPicker.appendChild(keywordDiv);
  });
}

/*
    Time Selection - Render time-selection
*/

// Set the hours (before, current, after)
function setHours(hours) {
  const hourPicker = document.getElementById("hour-picker").children;
  const hourSelection = document.getElementById("time-selection").children[0];

  hourPicker[0].innerHTML = addZeroToSingleDigit(parseHours(hours - 1));
  hourSelection.innerHTML = addZeroToSingleDigit(hours);
  hourPicker[2].innerHTML = addZeroToSingleDigit(parseHours(hours + 1));
}

// Set the minutes (before, current, after)
function setMinutes(minutes) {
  const minutesPicker = document.getElementById("minute-picker").children;
  const minutesSelection = document.getElementById("time-selection").children[2];

  minutesPicker[0].innerHTML = addZeroToSingleDigit(parseMinutes(minutes - 5));
  minutesSelection.innerHTML = addZeroToSingleDigit(minutes);
  minutesPicker[2].innerHTML = addZeroToSingleDigit(parseMinutes(minutes + 5));
}

// Set / update hours and minutes
function addTimePicker() {
  setHours(currentTime.hours);
  setMinutes(currentTime.minutes);
}

// Parse hours 24h
function parseHours(hours) {
  if (hours > 23) return 0;
  else if (hours < 0) return 23;
  else return hours;
}

// Parse minutes 60min (5min intervals)
function parseMinutes(minutes) {
  if (minutes > 55) {
    return 0;
  } else if (minutes < 0) {
    return 55;
  } else return minutes;
}

// Parse minutes + add/subtract one hour when minutes pass a full hour
function parseMinutesAddFullHour(minutes) {
  if (minutes > 55) {
    currentTime.hours = parseHours(currentTime.hours + 1);
    return 0;
  } else if (minutes < 0) {
    currentTime.hours = parseHours(currentTime.hours - 1);
    return 55;
  } else return minutes;
}

// Get the position of the mouse
function mouseWheelLeft(xPos) {
  const left = timePicker.getBoundingClientRect().left;
  const width = timePicker.getBoundingClientRect().width;

  return xPos - left < width / 2;
}

function determineNewTimeValues(event) {
  if (mouseWheelLeft(event.x)) {
    const newHours = currentTime.hours + event.deltaY / 100;
    currentTime.hours = parseHours(newHours);
  } else {
    const newMinutes = currentTime.minutes + (event.deltaY / 100) * 5;
    currentTime.minutes = parseMinutesAddFullHour(newMinutes);
  }
}

// Listen to mouse-wheel-events inside the time-picker-container, display new time
timePicker.addEventListener("wheel", (event) => {
  event.preventDefault();

  determineNewTimeValues(event);

  addTimePicker();
});

// Add time-selection to an answer-input
timeSelection.addEventListener("click", function () {
  let time = "";
  Array.from(timeSelection.children).forEach((child) => {
    time = time + child.innerHTML;
  });

  setAnswerInput(time, "🕚");
});

/*
    Weekday Selection - Render all 7 weekdays
*/

// Create and return single weekday
function createWeekdayDiv(weekday) {
  const weekdayDiv = document.createElement("div");
  weekdayDiv.classList.add("keyword");
  weekdayDiv.innerHTML = weekday;

  weekdayDiv.addEventListener("click", () => setAnswerInput(weekday, "📆"));
  return weekdayDiv;
}

// Add weekdays to weekday-picker
function addWeekdays() {
  const weekdayPicker = document.getElementById("weekday-picker");
  weekdays.forEach((weekday) => {
    const weekdayDiv = createWeekdayDiv(weekday);
    weekdayPicker.appendChild(weekdayDiv);
  });
}

/*
    Date Selection - Render a calendar for a custom date-selection
*/

// Add Mo, Di, Mi... to the calendar
function addCalendarWeekdays() {
  weekdays.forEach((day) => {
    const weekday = document.createElement("div");
    weekday.innerHTML = day.slice(0, 2);
    calendarWeekdays.appendChild(weekday);
  });
}

// Render calender days
function renderCalendar(month, year) {
  calendarDates.innerHTML = "";
  monthYear.textContent = `${months[month]} ${year}`;

  // Create blanks for days of the week before the first day
  const firstDay = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    calendarDates.appendChild(blank);
  }

  // Add all the days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement("div");
    day.textContent = i;
    day.classList.add("calendar-date");
    calendarDates.appendChild(day);
  }
}

// Eventlistener and logic for displaying previous month
prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});

// Eventlistener and logic for displaying next month
nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

// Eventlistener and logic for selecting a date
calendarDates.addEventListener("click", (e) => {
  if (e.target.textContent !== "" && e.target.classList.contains("calendar-date")) {
    setAnswerInput(`${e.target.textContent}. ${months[currentMonth]} ${currentYear}`, "📅");
  }
});

renderMarkup();
