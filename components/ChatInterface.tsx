import React, { useState, useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import { sendMessageStream, generateImage, resetChat } from '../services/gemini';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Hello. I'm Gemini. I can help you chat, generate images, or fetch real-time data. Try asking: 'Show me recent house sales' or 'Draw a neon cat'.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleReset = () => {
    resetChat();
    setMessages([{
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "Session cleared. Ready for a new topic.",
        timestamp: new Date()
    }]);
  };

  const isImageGenerationRequest = (text: string): boolean => {
    const lower = text.toLowerCase();
    return (
        lower.startsWith('draw') || 
        lower.startsWith('create image') || 
        lower.startsWith('generate image') ||
        lower.startsWith('buatkan gambar') ||
        lower.startsWith('gambar') ||
        lower.includes('buat gambar')
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    
    // Reset height of textarea
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();

    try {
        if (isImageGenerationRequest(userText)) {
            // Image Generation Mode
            setMessages((prev) => [
                ...prev,
                {
                  id: botMessageId,
                  role: Role.MODEL,
                  text: "Generating image...",
                  timestamp: new Date(),
                }
            ]);

            const imageBase64 = await generateImage(userText);
            
            if (imageBase64) {
                setMessages((prev) => 
                    prev.map((msg) => 
                        msg.id === botMessageId 
                        ? { ...msg, text: `Here is your image for: "${userText}"`, image: imageBase64 }
                        : msg
                    )
                );
            } else {
                 setMessages((prev) => 
                    prev.map((msg) => 
                        msg.id === botMessageId 
                        ? { ...msg, text: "I couldn't generate an image for that prompt. Please try again." }
                        : msg
                    )
                );
            }

        } else {
            // Text Chat Mode
            let accumulatedText = "";
            setMessages((prev) => [
                ...prev,
                {
                  id: botMessageId,
                  role: Role.MODEL,
                  text: "",
                  timestamp: new Date(),
                }
            ]);

            await sendMessageStream(userText, (chunk) => {
                accumulatedText += chunk;
                setMessages((prev) => 
                  prev.map((msg) => 
                    msg.id === botMessageId 
                      ? { ...msg, text: accumulatedText }
                      : msg
                  )
                );
            });
        }
    } catch (error) {
      setMessages((prev) => {
        // If the placeholder exists, update it to error
        const exists = prev.find(m => m.id === botMessageId);
        if (exists) {
            return prev.map(msg => msg.id === botMessageId ? {
                ...msg,
                text: "An error occurred connecting to the model. Please try again.",
                isError: true
            } : msg);
        }
        // Otherwise add new error message
        return [
            ...prev,
            {
              id: Date.now().toString(),
              role: Role.MODEL,
              text: "An error occurred connecting to the model. Please try again.",
              timestamp: new Date(),
              isError: true
            }
          ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto bg-black relative border-x border-zinc-900 shadow-2xl shadow-zinc-950">
      
      {/* Header - Minimalist */}
      <header className="flex-none h-14 px-6 border-b border-zinc-900 bg-black/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-black rounded-full" />
            </div>
            <h1 className="text-sm font-medium text-white tracking-tight">Gemini Chat</h1>
        </div>
        <button 
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-white transition-colors duration-200"
        >
            Reset
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1].role === Role.USER && (
           <div className="flex justify-start animate-fade-in pl-4">
                <TypingIndicator />
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area - Command Palette Style */}
      <div className="flex-none p-4 md:p-6 bg-black">
        <div className="relative flex flex-col gap-2 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 focus-within:border-zinc-600 transition-colors">
            <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, 'draw a cat', or 'check house sales'..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-zinc-500 text-sm p-3 focus:outline-none resize-none max-h-48"
                disabled={isLoading}
            />
            <div className="flex justify-between items-center px-2 pb-1">
                <span className="text-[10px] text-zinc-600 font-medium">GEMINI 2.5 FLASH</span>
                <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="p-1.5 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Send message"
                >
                    {isLoading ? (
                         <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
        <div className="text-center mt-3">
            <p className="text-[10px] text-zinc-600">
                AI can make mistakes. Please verify important information.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;