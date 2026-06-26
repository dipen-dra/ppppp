// src/chatbot/widgets/GeneralOptions.jsx

import React from 'react';

const GeneralOptions = (props) => {
    // This component will receive an array of options from the ActionProvider
    const { options } = props;

    return (
        <div className="options-container">
            {options.map((option) => (
                <button
                    key={option.id}
                    onClick={option.handler}
                    className="option-button"
                >
                    {option.text}
                </button>
            ))}
        </div>
    );
};

export default GeneralOptions;