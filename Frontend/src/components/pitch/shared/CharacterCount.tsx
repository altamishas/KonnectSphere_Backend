import React from "react";

interface CharacterCountProps {
  current: number;
  maximum: number;
}

const CharacterCount = ({ current, maximum }: CharacterCountProps) => {
  const percentage = (current / maximum) * 100;
  let colorClass = "text-slate-500";
  
  if (percentage > 90) {
    colorClass = "text-red-500";
  } else if (percentage > 75) {
    colorClass = "text-amber-500";
  }

  return (
    <div className="flex justify-end">
      <span className={`text-xs ${colorClass}`}>
        {current} / {maximum} characters
      </span>
    </div>
  );
};

export default CharacterCount;