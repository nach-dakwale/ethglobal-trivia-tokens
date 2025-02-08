"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestion = generateQuestion;
exports.validateAnswer = validateAnswer;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const openai = new openai_1.default({
    apiKey: config_1.CONFIG.OPENAI_API_KEY,
});
async function generateQuestion(theme = 'general knowledge') {
    const prompt = `Generate a ${Math.random() > 0.5 ? 'hard' : 'easy'} trivia question about ${theme}.
Format the response as JSON with the following fields:
{
  "question": "the question text",
  "answer": "the correct answer",
  "difficulty": "easy" or "hard"
}`;
    const completion = await openai.chat.completions.create({
        model: config_1.CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response;
}
async function validateAnswer(correctAnswer, userAnswer) {
    const prompt = `Compare the following answer to the correct answer and determine if it's correct or partially correct.
Correct answer: "${correctAnswer}"
User's answer: "${userAnswer}"

Format the response as JSON with the following fields:
{
  "isCorrect": true/false (true if the answer is correct or partially correct),
  "isPartiallyCorrect": true/false (true if the answer captures the main idea but lacks detail or precision)
}`;
    const completion = await openai.chat.completions.create({
        model: config_1.CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response;
}
