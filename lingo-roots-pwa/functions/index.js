// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.submitQuiz = functions.region("europe-west1") // europe-west1 region
    .https.onCall(async (data, context) => {
    // 1. Authentication Check
      if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated.",
        );
      }
      const userId = context.auth.uid;

      // 2. Input Validation
      const {languageId, lessonId, quizStepIndex, userAnswers} = data;
      if (
        !languageId ||
      !lessonId ||
      quizStepIndex === undefined || // Check for undefined as 0 is a valid index
      !userAnswers ||
      typeof userAnswers !== "object"
      ) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Missing or invalid parameters. " +
            "Required: languageId, lessonId, quizStepIndex, " +
            "userAnswers (object).",
      );
      }

      try {
      // 3. Fetch the Lesson and Correct Answers
      // (Path A: Embedded in lesson steps)
        const lessonPath = `languages/${languageId}/lessons/${lessonId}`;
        const lessonDocSnap = await db.doc(lessonPath).get();

        if (!lessonDocSnap.exists) {
          throw new functions.https.HttpsError("not-found", "Lesson not found.");
        }

        const lessonData = lessonDocSnap.data();
        if (!lessonData.steps || !lessonData.steps[quizStepIndex]) {
          throw new functions.https.HttpsError(
              "not-found",
              "Quiz step not found in lesson data.",
          );
        }

        const quizStep = lessonData.steps[quizStepIndex];
        if (quizStep.type !== "quiz" || !quizStep.questions) {
          throw new functions.https.HttpsError(
              "failed-precondition",
              "The specified step is not a quiz " +
              "or has no questions.",
          );
        }
        const correctQuestions = quizStep.questions;

        // 4. Score the Quiz
        let score = 0;
        const totalQuestionsInStep = correctQuestions.length;

        correctQuestions.forEach((correctQuestion) => {
          const userAnswerForQuestion = userAnswers[correctQuestion.id];
          // e.g., userAnswers["q1_hello"]
          if (
            userAnswerForQuestion &&
          userAnswerForQuestion === correctQuestion.correctAnswer
          ) {
            score++;
          }
        });

        // 5. Update User Progress
        const userProgressRef = db.doc(`userProgress/${userId}`);
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        // Key for the specific lesson's score within the lessonScores map
        // Or just lessonId if only one quiz per lesson
        const lessonScoreKey = `${lessonId}_step${quizStepIndex}`;

        const userProgressData = (await userProgressRef.get()).data() || {};
        const currentLessonScores = userProgressData.lessonScores || {};
        const currentQuizAttemptData = currentLessonScores[lessonScoreKey] || {};

        const newHighScore = Math.max(
            currentQuizAttemptData.highScore || 0, score,
        );
        const newAttempts = (currentQuizAttemptData.attempts || 0) + 1;

        const progressUpdate = {
          [`lessonScores.${lessonScoreKey}`]: {
            score: score,
            totalQuestions: totalQuestionsInStep,
            lastAttempted: timestamp,
            attempts: newAttempts,
            highScore: newHighScore,
          // Optionally store userAnswers
          },
          lastActivity: timestamp,
        // Potentially update overall language progress or points here too
        };

        await userProgressRef.set(progressUpdate, {merge: true});

        // 6. Return the Result
        return {
          success: true,
          score: score,
          totalQuestions: totalQuestionsInStep,
          message: "Quiz submitted successfully.",
        };
      } catch (error) {
        console.error(
            "Error submitting quiz for user:",
            userId,
            "Data:",
            data,
            "Error:",
            error,
        );
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError(
            "internal",
            "An unexpected error occurred.",
            error.message,
        );
      }
    });
