import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import PhaseProgress from './PhaseProgress';

interface Props {
  onSendMessage: (message: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--color-text-muted)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function ChatPanel({ onSendMessage }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, currentPhase, isStreaming, streamingText } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="h-full flex flex-col rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}>
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2.5"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            AI Assistant
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Ask me to modify your itinerary
          </p>
        </div>
      </div>

      <PhaseProgress currentPhase={currentPhase} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'
              }`}
            >
              {msg.role === 'system' ? (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-surface-tertiary)',
                    color: 'var(--color-text-muted)',
                  }}>
                  {msg.content}
                </span>
              ) : (
                <div className="flex items-end gap-1.5 max-w-[85%]">
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'gradient-primary text-white rounded-br-md'
                        : 'glass rounded-bl-md'
                    }`}
                    style={msg.role === 'assistant' ? { color: 'var(--color-text-primary)' } : undefined}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
                      <User className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {streamingText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-1.5"
          >
            <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-bl-md px-3 py-2 text-sm max-w-[85%]"
              style={{ color: 'var(--color-text-primary)' }}>
              {streamingText}
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? 'Generating...' : 'e.g. "Add a wine tasting on day 2"'}
          disabled={isStreaming}
          className="flex-1 px-3.5 py-2 rounded-xl text-sm outline-none transition-shadow duration-200 border"
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-glow)'}
          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="w-9 h-9 rounded-xl gradient-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
