document.getElementById("create-quiz-btn").addEventListener("click", async () => {
  const title = document.getElementById("quiz-title").value;
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value;

  if (!title) {
    alert("Bitte gib einen Quiz Titel ein.");
    return;
  }

  if (!visibility) {
    alert("'Sichtbarkeit der Ergebnisse' darf nicht leer sein.");
    return;
  }

  const quizData = {
    title: title.trim(),
    visibility: visibility,
  };

  const quizHashUrl = await createQuiz(quizData);

  window.location.href = `/quiz/${quizHashUrl}`;
});

const createQuiz = async (quizData) => {
  try {
    const response = await fetch("/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quizData),
    });

    if (!response.ok) {
      throw new Error("Failed to create quiz");
    }

    const result = await response.json();
    return result.hashUrl; // Extract hashUrl from the server response
  } catch (error) {
    console.error("Error creating quiz:", error);
  }
};
