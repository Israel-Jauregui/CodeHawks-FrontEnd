import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import nighthawkMascot from '../../nighthawk.webp';
import './NighthawkMascot.css';

type Position = {
  x: number;
  y: number;
};

type NighthawkMascotProps = {
  boundsRef: React.RefObject<HTMLDivElement | null>;
};

const STORAGE_KEY = 'codehawks:nigel-position-v3';
const TASKBAR_HEIGHT = 42;
const EDGE_PADDING = 12;

const readStoredPosition = (): Position | null => {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<Position>;
    if (
      typeof parsedValue.x !== 'number' ||
      Number.isNaN(parsedValue.x) ||
      typeof parsedValue.y !== 'number' ||
      Number.isNaN(parsedValue.y)
    ) {
      return null;
    }

    return { x: parsedValue.x, y: parsedValue.y };
  } catch {
    return null;
  }
};

const persistPosition = (position: Position) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage failures so the tray icon still works.
  }
};

export const NighthawkMascot: React.FC<NighthawkMascotProps> = ({ boundsRef }) => {
  const mascotRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const reactionTimeoutRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    pointerOffsetX: number;
    pointerOffsetY: number;
    dragStarted: boolean;
  } | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const clampPosition = useCallback((nextPosition: Position): Position => {
    const boundsElement = boundsRef.current;
    const mascotElement = mascotRef.current;

    if (!boundsElement || !mascotElement) {
      return nextPosition;
    }

    const boundsRect = boundsElement.getBoundingClientRect();
    const maxX = Math.max(
      boundsRect.left + EDGE_PADDING,
      boundsRect.left + boundsElement.clientWidth - mascotElement.offsetWidth - EDGE_PADDING,
    );
    const maxY = Math.max(
      boundsRect.top + EDGE_PADDING,
      boundsRect.top + boundsElement.clientHeight - mascotElement.offsetHeight - TASKBAR_HEIGHT - EDGE_PADDING,
    );

    return {
      x: Math.min(Math.max(nextPosition.x, boundsRect.left + EDGE_PADDING), maxX),
      y: Math.min(Math.max(nextPosition.y, boundsRect.top + EDGE_PADDING), maxY),
    };
  }, [boundsRef]);

  const getDefaultPosition = useCallback((): Position => {
    const boundsElement = boundsRef.current;
    const mascotElement = mascotRef.current;

    if (!boundsElement || !mascotElement) {
      return { x: window.innerWidth - 132, y: window.innerHeight - 198 };
    }

    const boundsRect = boundsElement.getBoundingClientRect();
    return clampPosition({
      x: boundsRect.left + boundsElement.clientWidth - mascotElement.offsetWidth - 18,
      y: boundsRect.top + boundsElement.clientHeight - mascotElement.offsetHeight - TASKBAR_HEIGHT - 6,
    });
  }, [boundsRef, clampPosition]);

  const triggerReaction = () => {
    setIsReacting(false);

    if (reactionTimeoutRef.current !== null) {
      window.clearTimeout(reactionTimeoutRef.current);
    }

    window.requestAnimationFrame(() => {
      setIsReacting(true);
    });

    reactionTimeoutRef.current = window.setTimeout(() => {
      setIsReacting(false);
    }, 700);
  };

  useLayoutEffect(() => {
    const restoredPosition = readStoredPosition();
    const nextPosition = restoredPosition ?? { x: window.innerWidth - 132, y: window.innerHeight - 198 };

    setPosition(nextPosition);
    positionRef.current = nextPosition;
    setIsReady(true);

    window.requestAnimationFrame(() => {
      const settledPosition = restoredPosition ? clampPosition(restoredPosition) : getDefaultPosition();
      setPosition(settledPosition);
      positionRef.current = settledPosition;
      persistPosition(settledPosition);
    });
  }, [clampPosition, getDefaultPosition]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((currentPosition) => {
        const nextPosition = clampPosition(currentPosition);
        persistPosition(nextPosition);
        return nextPosition;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [clampPosition]);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current !== null) {
        window.clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, []);

  const stopDragging = (persistDrop: boolean) => {
    dragStateRef.current = null;
    setIsDragging(false);
    document.body.classList.remove('xp-window-dragging');

    if (persistDrop) {
      persistPosition(positionRef.current);
    }
  };

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const mascotElement = mascotRef.current;
    if (!mascotElement) {
      return;
    }

    const mascotRect = mascotElement.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      pointerOffsetX: event.clientX - mascotRect.left,
      pointerOffsetY: event.clientY - mascotRect.top,
      dragStarted: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add('xp-window-dragging');
  };

  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextPosition = clampPosition({
      x: event.clientX - dragState.pointerOffsetX,
      y: event.clientY - dragState.pointerOffsetY,
    });

    const movedEnough =
      Math.abs(nextPosition.x - position.x) > 3 || Math.abs(nextPosition.y - position.y) > 3;

    if (movedEnough) {
      dragState.dragStarted = true;
      setIsDragging(true);
    }

    positionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const shouldPersistDrop = dragState.dragStarted;
    stopDragging(shouldPersistDrop);

    if (!dragState.dragStarted) {
      triggerReaction();
    }
  };

  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = () => {
    stopDragging(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className={`nighthawk-mascot${isDragging ? ' is-dragging' : ''}${isReacting ? ' is-reacting' : ''}`}
          ref={mascotRef}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            visibility: isReady ? 'visible' : 'hidden',
          }}
        >
          <button
            type="button"
            className="nighthawk-mascot__dismiss"
            aria-label="Hide Nigel"
            onClick={() => setIsOpen(false)}
          >
            x
          </button>
          <button
            type="button"
            className="nighthawk-mascot__button"
            aria-label="Nigel the Nighthawk"
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                triggerReaction();
              }
            }}
          >
            <span className="nighthawk-mascot__figure" aria-hidden="true">
              <span className="nighthawk-mascot__floor-shadow"></span>
              <img className="nighthawk-mascot__sprite" src={nighthawkMascot} alt="" draggable={false} />
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        className={`nighthawk-tray-button${isOpen ? ' is-active' : ''}`}
        aria-label={isOpen ? 'Hide Nigel' : 'Show Nigel'}
        title={isOpen ? 'Hide Nigel' : 'Show Nigel'}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span className="nighthawk-tray-button__icon-frame" aria-hidden="true">
          <img className="nighthawk-tray-button__icon-image" src={nighthawkMascot} alt="" draggable={false} />
        </span>
      </button>
    </>
  );
};

export default NighthawkMascot;