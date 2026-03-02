import { Quiz } from './store';

export const sampleQuiz: Quiz = {
  id: 'sample',
  title: "General Knowledge Trivia",
  questions: [
    {
      id: 1,
      text: "What is the capital of France?",
      type: "single",
      timeLimit: 20,
      options: [
        { id: 0, text: "London", color: "bg-red-500", shape: "triangle" },
        { id: 1, text: "Berlin", color: "bg-blue-500", shape: "diamond" },
        { id: 2, text: "Paris", color: "bg-yellow-500", shape: "circle" },
        { id: 3, text: "Madrid", color: "bg-green-500", shape: "square" },
      ],
      correctAnswerIndexes: [2],
    },
    {
      id: 2,
      text: "The Earth is flat.",
      type: "true_false",
      timeLimit: 10,
      options: [
        { id: 0, text: "True", color: "bg-blue-500", shape: "diamond" },
        { id: 1, text: "False", color: "bg-red-500", shape: "triangle" },
      ],
      correctAnswerIndexes: [1],
    },
    {
      id: 3,
      text: "Which of these are primary colors?",
      type: "multiple",
      timeLimit: 30,
      options: [
        { id: 0, text: "Red", color: "bg-red-500", shape: "triangle" },
        { id: 1, text: "Green", color: "bg-blue-500", shape: "diamond" },
        { id: 2, text: "Blue", color: "bg-yellow-500", shape: "circle" },
        { id: 3, text: "Yellow", color: "bg-green-500", shape: "square" },
      ],
      correctAnswerIndexes: [0, 2, 3],
    },
  ]
};
