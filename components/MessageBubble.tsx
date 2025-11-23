import React from 'react';
import { Message, Role } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative max-w-[85%] md:max-w-[80%] rounded-lg text-sm md:text-base leading-7
        ${
          isUser
            ? 'bg-zinc-800 text-zinc-100 px-4 py-3'
            : 'text-zinc-300 pl-4 pr-0'
        }
        ${message.isError ? 'text-red-400' : ''}
        `}
      >
        {!isUser && (
            <div className="absolute -left-5 top-1 w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80">
                <span className="text-[8px] font-bold text-white">G</span>
            </div>
        )}
        
        <div className="flex flex-col gap-3">
            {message.text && (
                <div className="whitespace-pre-wrap break-words font-sans">
                    {message.text}
                </div>
            )}
            
            {message.image && (
                <div className="mt-2 rounded-lg overflow-hidden border border-zinc-700 shadow-lg">
                    <img 
                        src={message.image} 
                        alt="Konten yang dibuat" 
                        className="w-full h-auto max-w-sm object-cover bg-zinc-900"
                        loading="lazy"
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;