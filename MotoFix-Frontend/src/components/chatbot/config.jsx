import React from 'react';
import { createChatBotMessage } from 'react-chatbot-kit';
import { Wrench } from 'lucide-react';

import BotAvatar from '../chatbot/BotAvatar.jsx';
import ServiceOptions from './widgets/ServiceOptions.jsx';
import GeneralOptions from './widgets/GeneralOptions.jsx';

const config = {
    botName: "MotoFixBot",
    initialMessages: [
        createChatBotMessage(
            "Welcome to MotoFix! I'm here to help. Here are a few things you can ask me:",
            // {
            //     widget: 'generalOptions', // This widget will now be populated by the ActionProvider
            // }
        )
    ],
    state: {
        services: [], // This will be populated by the API call
        options: [],  // This will be populated by the ActionProvider's getOptions method
    },
    customComponents: {
        header: () => (
            <div
                style={{
                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                    color: 'white',
                    padding: '16px',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <Wrench size={24} />
                <span>MotoFix Assistant</span>
            </div>
        ),
        botAvatar: (props) => <BotAvatar {...props} />,
    },
    widgets: [
        {
            widgetName: 'serviceOptions',
            widgetFunc: (props) => <ServiceOptions {...props} />,
            mapStateToProps: ['services'],
        },
        {
            widgetName: 'generalOptions',
            widgetFunc: (props) => <GeneralOptions {...props} />,
            mapStateToProps: ['options'], // Ensure this widget receives the 'options' from the state
        },
    ],
};

export default config;