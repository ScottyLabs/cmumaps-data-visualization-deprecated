import { twMerge } from "tailwind-merge";

import React from "react";
import { FaRegQuestionCircle } from "react-icons/fa";

interface Props {
  url: string;
  style?: string;
}

const QuestionCircle = ({ url, style }: Props) => {
  return (
    <a href={url} target="_blank">
      <FaRegQuestionCircle
        className={twMerge(
          "cursor-pointer rounded-full text-2xl hover:text-blue-600",
          style
        )}
      />
    </a>
  );
};

export default QuestionCircle;
