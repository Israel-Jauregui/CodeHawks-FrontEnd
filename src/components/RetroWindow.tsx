import type { ReactNode } from 'react';

// The retro desktop window from the club styling guide and the countdown screens:
// a title bar with a file path, a gold rule, an optional menu bar, the content, and a status bar.
type Props = {
  title: ReactNode;
  menu?: ReactNode;
  status?: [ReactNode, ReactNode?];
  className?: string;
  children: ReactNode;
};

export default function RetroWindow({ title, menu, status, className = '', children }: Props) {
  return (
    <div className={`win ${className}`}>
      <div className="win__title">
        <span className="win__path">{title}</span>
        <span className="win__btns" aria-hidden="true"><i>_</i><i>&#9633;</i><i>&times;</i></span>
      </div>
      <div className="win__rule" />
      {menu && <div className="win__menu">{menu}</div>}
      {children}
      {status && (
        <div className="win__status">
          <span>{status[0]}</span>
          {status[1] && <span>{status[1]}</span>}
        </div>
      )}
    </div>
  );
}
