import React from 'react';

export interface ActionButtonProps {
  onClick: () => void;
  label: string;
  position?: 'fixed' | 'static' | 'relative';
  gradient?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  label,
  position = 'fixed',
  gradient = true,
}) => {
  const buttonStyle = gradient
    ? {
        background: '#FF5757',
        color: '#FFFFFF',
      }
    : {
        backgroundColor: '#FF5757',
        color: '#FFFFFF',
      };

  let positionClass = '';
  
  if (position === 'fixed') {
    positionClass = 'fixed bottom-16 inset-x-0 mx-auto max-w-[450px] p-4 z-20';
  } else if (position === 'relative') {
    positionClass = 'relative w-full';
  }

  return (
    <div className={positionClass}>
      <button
        onClick={onClick}
        className="w-full py-3 rounded-lg font-semibold mt-5"
        style={buttonStyle}
      >
        {label}
      </button>
    </div>
  );
};

export default ActionButton;
