function randomString() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let result = "";
  const length = Math.floor(Math.random() * 30);

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

function maybeNull() {
  const choices = [null, undefined, "", randomString(), 12345, {}, []];
  return choices[Math.floor(Math.random() * choices.length)];
}

// REGISTRATION FUZZ
function generateRegisterData(context, events, done) {
  context.vars.registerPayload = {
    email: Math.random() > 0.3 ? randomString() + "@test.com" : maybeNull(),
    password: maybeNull(),
    name: maybeNull(),
  };

  return done();
}

// LOGIN FUZZ
function generateLoginData(context, events, done) {
  context.vars.loginPayload = {
    email: maybeNull(),
    password: maybeNull(),
  };

  return done();
}

// QUIZ FUZZ
function generateQuizData(context, events, done) {
  context.vars.quizPayload = {
    title: maybeNull(),
    description: maybeNull(),
    questions: [
      {
        text: maybeNull(),
        answers: [
          maybeNull(),
          maybeNull(),
          maybeNull(),
        ],
        correctIndex: Math.floor(Math.random() * 10), // intentionally invalid sometimes
      },
    ],
  };

  return done();
}

module.exports = {
  generateRegisterData,
  generateLoginData,
  generateQuizData,
};