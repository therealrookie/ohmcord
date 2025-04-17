// Get all questions from database
async function getQuestions() {
  try {
    const response = await fetch(`/quiz/get-questions/${quizId}`);
    questions = await response.json();
  } catch (error) {
    console.error(error);
  }
}

// Updates quiz settings in database
async function updateQuizSettings(quizId, name, value) {
  try {
    await fetch("/quiz/update-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quizId: quizId, column: name, value: value }),
    });
  } catch (error) {
    console.error("Error updating settings in Database:", error);
  }
}

// Saves a new question in the database
async function createQuestion(questionString) {
  try {
    const response = await fetch("/quiz/create-question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quizId: quizId, question: questionString }),
    });

    const result = await response.json();
    return result.quizQuestionId;
  } catch (error) {
    console.error("Error saving question to Database:", error);
  }
}

// Saves new question text / String in the database
async function updateQuestionText(questionString, questionId) {
  try {
    const response = await fetch("/quiz/update-question", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId, question: questionString }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error in updateQuestionText:", error);
    return false;
  }
}

// Adds an empty answer in the database
async function createAnswer(questionId) {
  try {
    const response = await fetch("/quiz/create-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in createAnswer:", error);
    return false;
  }
}

// Updates the isCorrect flag of an answer in the database
async function updateCorrectAnswer(answerId, isChecked) {
  try {
    const response = await fetch("/quiz/update-correct-answer", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId, isChecked }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in updateCorrectAnswer:", error);
    return false;
  }
}

// Updates the text of an answer in the database
async function updateAnswerText(answerId, text) {
  try {
    const response = await fetch("/quiz/update-answer-text", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId, text }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in updateAnswerText:", error);
    return false;
  }
}

// Deletes an answer
async function deleteAnswer(answerId) {
  try {
    const response = await fetch("/quiz/answer", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answerId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in deleteAnswer:", error);
    return false;
  }
}

// Deletes a question
async function deleteQuestion(questionId) {
  try {
    const response = await fetch("/quiz/question", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId }),
    });

    return response.json();
  } catch (error) {
    console.error("Error in deleteQuestion:", error);
    return false;
  }
}
