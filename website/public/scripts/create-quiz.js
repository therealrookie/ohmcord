document.getElementById("create-quiz-btn").addEventListener("click", async () => {
  const title = document.getElementById("quiz-title").value;
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value;

  if (!title) {
    alert("Please enter a quiz title.");
    return;
  }

  if (!visibility) {
    alert("Please select a visibility option.");
    return;
  }

  const quizData = {
    title: title.trim(),
    visibility: visibility,
  };

  const quizHashUrl = await createQuiz(quizData);

  //window.location.href = `/quiz/${quizHashUrl}`;
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

    console.log("Create quiz: ", quizData, response);

    if (!response.ok) {
      throw new Error("Failed to create quiz");
    }

    const result = await response.json();
    return result.hashUrl; // Extract hashUrl from the server response
  } catch (error) {
    console.error("Error creating quiz:", error);
  }
};
