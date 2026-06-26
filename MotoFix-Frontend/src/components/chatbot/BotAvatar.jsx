// import React from 'react';
// import { Wrench } from 'lucide-react';

// const BotAvatar = () => {
//   return (
//     <div className="react-chatbot-kit-chat-bot-avatar">
//       <div className="react-chatbot-kit-chat-bot-avatar-container">
//         <Wrench size={18} />
//       </div>
//     </div>
//   );
// };

// export default BotAvatar;

import React from 'react';

const BotAvatar = () => {
  return (
    <div className="react-chatbot-kit-chat-bot-avatar">
      <div className="react-chatbot-kit-chat-bot-avatar-container">
        <img
          src="/whitemotofix.png"
          alt="Bot Avatar"
          className="w-8 h-8 object-cover rounded-full"
        />
      </div>
    </div>
  );
};

export default BotAvatar;
