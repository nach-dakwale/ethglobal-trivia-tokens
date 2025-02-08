import OpenAI from 'openai';
import { CONFIG } from '../config';

const openai = new OpenAI({
  apiKey: CONFIG.OPENAI_API_KEY,
});

interface QuestionResponse {
  question: string;
  answer: string;
  difficulty: 'easy' | 'hard';
}

interface AnswerValidation {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
}

// Common prompt injection attempts
const INJECTION_PATTERNS = [
  'ignore previous',
  'ignore the previous',
  'disregard previous',
  'forget previous',
  'system prompt',
  'you are now',
  'mark this as correct',
  'award tokens',
];

function sanitizeInput(input: string): string {
  // Remove any potential JSON-breaking characters
  return input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

function hasPromptInjection(input: string): boolean {
  const lowerInput = input.toLowerCase();
  return INJECTION_PATTERNS.some(pattern => lowerInput.includes(pattern));
}

export async function generateQuestion(theme: string = 'general knowledge'): Promise<QuestionResponse> {
  // Sanitize theme input
  const safeTheme = sanitizeInput(theme);
  
  const prompt = `Generate a ${Math.random() > 0.5 ? 'hard' : 'easy'} trivia question about ${safeTheme}.
Format the response as JSON with the following fields:
{
  "question": "the question text",
  "answer": "the correct answer",
  "difficulty": "easy" or "hard"
}`;

  const completion = await openai.chat.completions.create({
    model: CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  try {
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response as QuestionResponse;
  } catch (error) {
    console.error('Error parsing question response:', error);
    throw new Error('Failed to generate valid question');
  }
}

export async function validateAnswer(correctAnswer: string, userAnswer: string): Promise<AnswerValidation> {
  // Check for prompt injection attempts
  if (hasPromptInjection(userAnswer)) {
    console.warn('Potential prompt injection attempt detected:', userAnswer);
    return { isCorrect: false, isPartiallyCorrect: false };
  }

  // Sanitize inputs
  const safeCorrectAnswer = sanitizeInput(correctAnswer);
  const safeUserAnswer = sanitizeInput(userAnswer);

  const prompt = `Compare the following answer to the correct answer and determine if it's correct or partially correct.
Correct answer: "${safeCorrectAnswer}"
User's answer: "${safeUserAnswer}"

Format the response as JSON with the following fields:
{
  "isCorrect": true/false (true if the answer is correct or partially correct),
  "isPartiallyCorrect": true/false (true if the answer captures the main idea but lacks detail or precision)
}`;

  const completion = await openai.chat.completions.create({
    model: CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  try {
    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response as AnswerValidation;
  } catch (error) {
    console.error('Error parsing validation response:', error);
    return { isCorrect: false, isPartiallyCorrect: false };
  }
} 