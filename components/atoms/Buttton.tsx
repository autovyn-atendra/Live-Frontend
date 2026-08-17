import React from 'react';

// Existing ButtonProps interface
export interface ButtonProps {
  text?: string;
  color?: string;
  onClick?: () => void;
  type: 'button' | 'submit' | 'reset'; // Restrict type to valid button types
}

// Typing the component using React.FC with the ButtonProps interface
export const AButton: React.FC<ButtonProps> = ({
  text,
  onClick,
  color,
  type,
}) => {
  return (
    <button
      onClick={onClick}
      className={`uppercase mx-2 font-bold text-lg rounded-md text-white bg-${color} px-6 py-0.5 transition-transform transform hover:-rotate-1 hover:scale-105`}
      type={type}
    >
      {text}
    </button>
  );
};

export default AButton;
