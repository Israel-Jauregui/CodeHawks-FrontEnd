import React, { useState, useEffect } from 'react';

interface MultiLineTypeWriterProps {
  lines: string[];
  speed?: number;
  delay?: number;
  cursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
  className?: string;
  lineClassName?: string;
  loop?: boolean;
  loopDelay?: number;
}

export const MultiLineTypeWriter: React.FC<MultiLineTypeWriterProps> = ({
  lines,
  speed = 50,
  delay = 1,
  cursor = true,
  cursorChar = '|',
  onComplete,
  className = '',
  lineClassName = '',
  loop = false,
  loopDelay = 2000,
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>(
    lines.map(() => '')
  );
  const [currentIndices, setCurrentIndices] = useState<number[]>(
    lines.map(() => 0)
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const linesSignature = lines.join('\u0000');

  useEffect(() => {
    // Handle initial delay
    if (delay > 0 && !hasStarted) {
      const delayTimer = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(delayTimer);
    } else if (delay === 0 && !hasStarted) {
      setHasStarted(true);
    }
    return undefined;
  }, [delay, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return undefined;

    // Check if all lines are complete
    const allComplete = currentIndices.every((index, i) => index >= lines[i].length);
    
    if (allComplete && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
      
      // Handle looping
      if (loop) {
        const loopTimer = setTimeout(() => {
          setDisplayedLines(lines.map(() => ''));
          setCurrentIndices(lines.map(() => 0));
          setIsComplete(false);
          setHasStarted(false);
        }, loopDelay);
        return () => clearTimeout(loopTimer);
      }
      return undefined;
    }

    if (!allComplete) {
      const timer = setTimeout(() => {
        setCurrentIndices(prevIndices => 
          prevIndices.map((index, i) => {
            // If this line is already complete, don't increment
            if (index >= lines[i].length) {
              return index;
            }
            return index + 1;
          })
        );

        setDisplayedLines(prevDisplayed =>
          prevDisplayed.map((displayed, i) => {
            const nextIndex = currentIndices[i];
            if (nextIndex < lines[i].length) {
              return displayed + lines[i][nextIndex];
            }
            return displayed;
          })
        );
      }, speed);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentIndices, lines, speed, isComplete, hasStarted, onComplete, loop, loopDelay]);

  // Reset only when the actual text content changes.
  // The parent can re-render for unrelated reasons, like dragging a
  // desktop window. In those cases React may pass a new array instance
  // with the same strings. Depending on `lines` directly would treat
  // that as "new content" and restart the animation unnecessarily.
  useEffect(() => {
    setDisplayedLines(lines.map(() => ''));
    setCurrentIndices(lines.map(() => 0));
    setIsComplete(false);
    setHasStarted(false);
  }, [linesSignature]);

  return (
    <div className={className}>
      <pre style={{ margin: 0, fontFamily: 'monospace' }}>
        {displayedLines.map((line, index) => {
          const isLastLine = index === displayedLines.length - 1;
          
          return (
            <div key={index} className={lineClassName}>
              {line}
              {!isLastLine && ' '}
              {cursor && isLastLine && (
                <span
                  className="typewriter-cursor"
                  style={{
                    animation: isComplete ? 'blink 1s step-end infinite' : 'none',
                    opacity: hasStarted ? 1 : 0,
                  }}
                >
                  {cursorChar}
                </span>
              )}
              {'\n'}
            </div>
          );
        })}
      </pre>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MultiLineTypeWriter;
