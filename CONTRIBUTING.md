# Contributing to UNGs App Development Club Website - Frontend

Thank you for your interest in contributing to our frontend! This document provides guidelines and instructions for contributing to this React + Vite project.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Copy `.env.example` to `.env.local` and configure
4. **Start the dev server**: `npm run dev`
5. **Create a new branch** for your work (see Branch Naming below)
6. **Make your changes** following our code style guidelines
7. **Test your changes** thoroughly
8. **Submit a pull request** when ready

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Basic knowledge of React and modern JavaScript/TypeScript

## Branch Naming Conventions

Use descriptive branch names with the following prefixes:

- `feature/` - New features (e.g., `feature/add-event-calendar`)
- `bugfix/` - Bug fixes (e.g., `bugfix/fix-mobile-nav`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-button-component`)
- `style/` - UI/styling changes (e.g., `style/update-color-scheme`)
- `test/` - Adding or updating tests (e.g., `test/add-component-tests`)

## Code Style Guidelines

### General React Best Practices
- Use functional components with hooks (no class components)
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use meaningful component and variable names (e.g., `UserProfileCard` not `Card2`)
- Avoid prop drilling - use Context API or state management when needed

### File Structure
- Place components in `/src/components/`
- Use PascalCase for component files (e.g., `EventCard.jsx`)
- Keep related files together (component, styles, tests)
- Place shared utilities in `/src/utils/`
- Store constants in `/src/constants/`

### Code Formatting
- **Run Prettier** before committing: `npm run format`
- **Run ESLint** and fix issues: `npm run lint`
- Use consistent quote style (single quotes preferred)
- Add trailing commas in multiline objects/arrays
- Use 2 spaces for indentation

### TypeScript/JavaScript
- Use `const` and `let` (never `var`)
- Prefer function declaration for component definitions
- Use destructuring for props: `const { title, description } = props`
- Use optional chaining: `user?.profile?.avatar`

### Component Example
```jsx
import { useState } from 'react';
import './EventCard.css';

function EventCard({ title, date, description, onRegister }) {
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = () => {
    onRegister();
    setIsRegistered(true);
  };

  return (
    <div className="event-card">
      <h3>{title}</h3>
      <p className="date">{date}</p>
      <p>{description}</p>
      <button onClick={handleRegister} disabled={isRegistered}>
        {isRegistered ? 'Registered' : 'Register'}
      </button>
    </div>
  );
};

export default EventCard;
```

### CSS/Styling
- Use CSS Modules or styled-components if configured
- Follow BEM naming convention for CSS classes
- Make components responsive (mobile-first approach)
- Use CSS variables for colors and common values
- Avoid inline styles except for dynamic values

## Testing Requirements

- Write tests for new components and features
- Test user interactions and edge cases
- Ensure all existing tests pass: `npm test`
- Aim for meaningful coverage of critical paths
- Use React Testing Library for component tests

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Ensure the app builds**: `npm run build`
3. **Run all checks**: `npm run lint && npm test`
4. **Write a clear PR description** using the PR template
5. **Link related issues** (e.g., "Closes #42")
6. **Add screenshots/videos** for UI changes
7. **Request reviews** from at least one club member
8. **Address review feedback** promptly
9. **Keep PRs focused** - one feature or fix per PR

### PR Checklist
Before submitting, verify:
- [ ] Code follows the style guidelines
- [ ] App runs without errors or warnings
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Components are responsive on mobile/tablet/desktop
- [ ] No `console.log` or debug code left in
- [ ] Screenshots included for UI changes
- [ ] Commit messages are clear and descriptive

## Commit Message Guidelines

Write clear commit messages that explain what and why:

```
feat: add user profile page

- Created profile component with bio and avatar
- Integrated with backend API
- Responsive design for all screen sizes
```

Use conventional commit prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - UI/CSS changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, config)

## Common Issues & Solutions

### Port already in use
- Change the port in `vite.config.js` or kill the process using port 5173

### Environment variables not loading
- Ensure variables start with `VITE_`
- Restart the dev server after changing `.env.local`

### CORS errors
- Check that backend URL is correct in `.env.local`
- Verify backend is running and configured for CORS

## Getting Help

- **Questions?** Open an issue with the "question" label
- **Stuck?** Reach out in the club Discord/Slack
- **Found a bug?** Open an issue with the "bug" label
- **Have an idea?** Open an issue with the "enhancement" label
- **Need design help?** Tag the design team in your PR

## Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run tests
```

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all learning together! This is a club project - help each other grow as developers.

## Recognition

All contributors will be recognized in our README. Thank you for helping build an awesome club website!

---

**Questions about these guidelines?** Open an issue and we'll clarify!
