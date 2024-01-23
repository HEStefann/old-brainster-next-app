"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { FaClone, FaTrash } from "react-icons/fa";
import { IoReorderThreeSharp } from "react-icons/io5";
import {
  ReactSortable,
  Sortable,
  SortableEvent,
  Store,
} from "react-sortablejs";
import Switch from "../Switch/Switch";
// import { questions as mockQuestions } from "@/_mocks/questions";
import { QuestionsDTO } from "@/types/QuestionDTO";
import { debounce, isNumber, noop } from "lodash";

interface SurveyQuestionListProps {
  surveyId: string;
}

export default function SurveyQuestionList({
  surveyId,
}: SurveyQuestionListProps) {
  const [questions, setQuestions] = useState<QuestionsDTO["data"]>([]);

  const getQuestions = useCallback(async () => {
    const response = await fetch(`/api/surveys/${surveyId}/questions`);
    const { data } = await response.json();
    setQuestions(data);
  }, [surveyId]);

  const handleAddQuestion = async () => {
    const text = prompt("Whats the question?");
    await fetch(`/api/surveys/${surveyId}/questions`, {
      method: "POST",
      body: JSON.stringify({
        text,
      }),
    });

    getQuestions();
  };

  const handleQuestionTextChange = debounce(
    async ({ target }: FormEvent<HTMLDivElement>, questionId: string) => {
      const response = await fetch(
        `/api/surveys/${surveyId}/questions/${questionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            text: (target as any).innerText,
          }),
        }
      );
    },
    500
  );

  const handlePositionChange = async (event: SortableEvent) => {
    // Check if oldIndex is a number
    if (!isNumber(event.oldIndex) || !isNumber(event.newIndex)) return;

    // Create a copy of the questions array
    let newQuestions = [...questions];

    // Remove the question from its old position
    let [movedQuestion] = newQuestions.splice(event.oldIndex, 1);

    // Insert the question at its new position
    newQuestions.splice(event.newIndex, 0, movedQuestion);

    // Update the positions of all questions
    newQuestions.forEach((question, index) => {
      question.position = index;
    });

    // Set the new questions array
    setQuestions(newQuestions);

    // Send the updated questions to the server
    for (let question of newQuestions) {
      await fetch(`/api/surveys/${surveyId}/questions/${question.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          position: question.position,
        }),
      });
    }

    getQuestions();
  };

  const handleIsRequiredChange = async (
    questionId: string,
    required: boolean
  ) => {
    await fetch(`/api/surveys/${surveyId}/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        required,
      }),
    });

    getQuestions();
  };

  const deleteQuestion = async (questionId: string) => {
    await fetch(`/api/surveys/${surveyId}/questions/${questionId}`, {
      method: "DELETE",
    });

    getQuestions();
  };

  const cloneQuestion = async (question: QuestionsDTO["data"][0]) => {
    const newPosition = questions.length;
    await fetch(`/api/surveys/${surveyId}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...question,
        position: newPosition,
      }),
    });

    getQuestions();
  };

  useEffect(() => {
    getQuestions();
  }, [getQuestions]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="grid grid-cols-7 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5">
        <div className="col-span-1">
          <p className="font-medium">Position</p>
        </div>
        <div className="col-span-6 flex">
          <p className="font-medium">Text</p>
        </div>
        <div className="col-span-1 flex">
          <p className="font-medium">Is Required?</p>
        </div>
        <div className="col-span-1"></div>
      </div>
      <ReactSortable
        list={questions}
        setList={noop}
        animation={200}
        handle=".handle"
        onEnd={handlePositionChange}
      >
        {questions.map((item) => (
          <div
            className="grid grid-cols-7 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-9 md:px-6 2xl:px-7.5"
            key={item.id}
          >
            <div className="col-span-1 flex items-center gap-2 handle cursor-move">
              <IoReorderThreeSharp className="text-2xl" />
              {item.position}
            </div>
            <div
              className="col-span-6 flex items-center !border-0 !outline-0"
              contentEditable
              onInput={(e) => handleQuestionTextChange(e, item.id)}
              suppressContentEditableWarning={true}
            >
              {item.text}
            </div>
            <div className="col-span-1">
              <Switch
                id={item.id}
                initialState={item.required}
                onToggle={(state) => handleIsRequiredChange(item.id, state)}
              />
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button className="hover:text-primary py-2 px-2 rounded text-lg">
                <FaClone onClick={() => cloneQuestion(item)} />
              </button>
              <button className="hover:text-primary py-2 px-2 rounded text-lg">
                <FaTrash onClick={() => deleteQuestion(item.id)} />
              </button>
            </div>
          </div>
        ))}
      </ReactSortable>
      <div className="w-full">
        <button
          className="bg-primary w-full py-2 text-white font-bold"
          onClick={handleAddQuestion}
        >
          Add a Question
        </button>
      </div>
    </div>
  );
}
