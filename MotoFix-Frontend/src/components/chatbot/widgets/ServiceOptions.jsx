import React from 'react';
import './ServiceOptions.css'; // Import the stylesheet

const ServiceOptions = (props) => {
    // Check if services are available before trying to map
    const options = (props.services || []).map((service) => ({
        text: service.name, // Displaying just the name on the button for a cleaner look
        handler: () => props.actionProvider.handleServiceDetail(service.name),
        id: service._id || service.name, // Use a unique key
    }));

    const buttonsMarkup = options.map((option) => (
        <button key={option.id} onClick={option.handler} className="option-button">
            {option.text}
        </button>
    ));

    return <div className="options-container">{buttonsMarkup}</div>;
};

export default ServiceOptions;