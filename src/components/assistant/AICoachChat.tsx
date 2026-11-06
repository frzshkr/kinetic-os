import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, UserSettings, FastingState, BriskwalkSession } from '../../types';
import { aiService, AIContextSnapshot } from '../../services/aiService';
import { sound } from '../../utils/audio';
import { voice } from '../../utils/speech';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  Flame,
  Footprints,
  User,
} from 'lucide-react';

interface AICoachChatProps {
  userSettings: UserSettings;
  fastingState: FastingState;
  recentWalks: BriskwalkSession[];
  activeWalk?: BriskwalkSession | null;
}

export const AICoachChat: React.FC<AICoachChatProps> = ({
  userSettings,
  fastingState,
  recentWalks,
  activeWalk,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      content: `**STRIDE Intelligence Ready.**

Connected to real-time bio-telemetry:
- **Fasting:** Autophagy phase detection & window alerts
- **Brisk Walk:** Pacing zones & metabolic expenditure
- **Radar:** Turn-by-turn routing & elevation tracking

What do you want to optimize right now?`,
      timestamp: Date.now(),
      suggestions: [
        'Check current fasting metabolic stage',
        'Analyze my brisk walk pace target',
        'Fasted vs fed walking for fat loss',
      ],
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const contextSnapshot: AIContextSnapshot = {
      userSettings,
      fastingState,
      recentWalks,
      activeWalk,
    };

    try {
      const result = await aiService.sendMessage(text, messages, contextSnapshot);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        content: result.response,
        timestamp: Date.now(),
        suggestions: result.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      sound.playMilestone();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          content: 'Connection issue. Please retry or verify your API settings.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support Web Speech Recognition.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = userSettings.voiceLanguage || 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    sound.playClick();
    voice.speak(text.replace(/[#*`_>]/g, ''), true);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-175px)] max-h-[800px] bg-white/80 backdrop-blur-2xl rounded-[32px] border border-black/10 overflow-hidden shadow-sm">
      {/* Telemetry Header */}
      <div className="p-4 bg-white border-b border-black/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-xs">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5 font-['Outfit'] uppercase">
              STRIDE COACH
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-medium">
              High-Precision Health & Route Advisor
            </p>
          </div>
        </div>

        {/* Telemetry Badges */}
        <div className="hidden sm:flex items-center gap-2">
          {fastingState.isActive && (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono font-black flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              FAST ACTIVE
            </span>
          )}
          {activeWalk && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-black flex items-center gap-1">
              <Footprints className="w-3 h-3" />
              WALK ACTIVE
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-black flex items-center gap-1">
            <User className="w-3 h-3" />
            {userSettings.weightKg}KG
          </span>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-[#F5F2EB]/40 to-white/60">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <motion.div
              key={msg.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`rounded-[24px] p-4 text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[80%] border shadow-xs ${
                  isUser
                    ? 'bg-black text-[#E8F84A] border-black font-semibold'
                    : 'bg-white text-slate-800 border-black/[0.08]'
                }`}
              >
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-slate-400 font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Speak"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-slate-700 transition-colors"
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
                  {msg.suggestions.map((sug, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleSend(sug)}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 text-[11px] font-bold transition-all text-left shadow-2xs"
                    >
                      {sug}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white border border-black/10 shadow-sm w-fit">
            <Sparkles className="w-4 h-4 text-black animate-spin" />
            <span className="text-xs text-slate-600 font-mono font-medium">
              STRIDE is computing response...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-black/[0.06]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                : 'bg-[#F5F2EB] border-black/[0.06] text-slate-700 hover:text-black'
            }`}
            title={isListening ? 'Listening...' : 'Voice Dictate'}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fasting phases, brisk walk pacing, route..."
            className="flex-1 py-3 px-4 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] focus:border-black focus:bg-white text-slate-950 placeholder-slate-400 text-xs sm:text-sm outline-none transition-all font-medium"
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl bg-black hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed text-[#E8F84A] shadow-md transition-all"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
