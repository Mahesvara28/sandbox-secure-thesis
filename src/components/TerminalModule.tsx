import React, { useState, useEffect, useRef } from 'react';

interface TerminalModuleProps {
  onCommand: (cmd: string) => void;
  systemMessage: string;
  nonce: number;
}

const TypewriterLine = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    indexRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      if (indexRef.current <= text.length) {
        setDisplayedText(text.slice(0, indexRef.current));
        indexRef.current++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 15);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

export const TerminalModule: React.FC<TerminalModuleProps> = ({ 
  onCommand, 
  systemMessage, 
  nonce 
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{type: 'sys' | 'user', content: string, id: number}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastNonceRef = useRef(0);

  useEffect(() => {
    if (nonce > 0 && nonce !== lastNonceRef.current && systemMessage) {
      lastNonceRef.current = nonce;
      setHistory((prev) => [...prev, { type: 'sys', content: systemMessage, id: nonce }]);
    }
  }, [nonce, systemMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setHistory((prev) => [...prev, { type: 'user', content: input, id: Date.now() }]);
    onCommand(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full font-mono text-[12px] text-green-400 bg-black/80 p-4 rounded border border-green-900/50">
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto mb-2 space-y-1 pr-2 scrollbar-hide"
      >
        {history.map((line, i) => (
          <div key={`${line.id}-${i}`} className={line.type === 'sys' ? 'text-green-400' : 'text-white/90'}>
            <span className="opacity-50 mr-2 select-none">
              {line.type === 'sys' ? '[SYS]:' : 'user@sandbox:~$'}
            </span>
            {line.type === 'sys' && i === history.length - 1 ? (
              <TypewriterLine text={line.content} />
            ) : (
              <span className="whitespace-pre-wrap">{line.content}</span>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-center border-t border-green-900/50 pt-2 shrink-0">
        <span className="text-green-500 mr-2 select-none">user@sandbox:~$</span>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-green-400 focus:ring-0 p-0 uppercase tracking-wider"
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
};

export default TerminalModule;