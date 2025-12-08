# World Cup 2026 Sweepstake Tracker

Professional React TypeScript application with clean folder-based architecture.

## 🚀 Quick Start

```bash
# Install
npm install

# Start development
npm start

# Before pushing to git
npm run prepare-push
```

---

## 📁 Project Structure

### Folder-Based Architecture

Each component and page has its own folder with organized files:

```
src/
├── types/
│   └── shared.ts              # Shared TypeScript interfaces
│
├── components/
│   ├── StatCard/
│   │   ├── index.tsx          # Component logic
│   │   ├── styles.ts          # Styled components
│   │   └── types.ts           # Component types
│   │
│   └── Header/
│       ├── index.tsx
│       ├── styles.ts
│       └── data.ts            # Component data (when needed)
│
└── pages/
    ├── Home/
    │   ├── index.tsx          # Page component
    │   ├── styles.ts          # Page styles
    │   └── data.ts            # Page data
    │
    └── TeamPicks/
        ├── index.tsx
        ├── styles.ts
        └── data.ts
```

### File Responsibilities

#### `index.tsx`

Component logic and JSX. Always the default export.

```typescript
import { playerData } from './data';
import { Container, Title } from './styles';

export const TeamPicks = () => {
  return (
    <Container>
      <Title>{playerData.title}</Title>
    </Container>
  );
};
```

#### `styles.ts`

All styled components for this component/page.

```typescript
import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
`;

export const Title = styled.h1`
  color: ${theme.colors.primary};
`;
```

#### `types.ts`

Component-specific TypeScript interfaces.

```typescript
import type { Player } from '../../types/shared';

export interface PlayerCardProps {
  player: Player;
}
```

#### `data.ts` (when needed)

Static data for the component/page.

```typescript
export const players: Player[] = [
  { name: "Daniel", teams: [...] },
  { name: "Adam", teams: [...] }
];
```

## 🎯 Development Workflow

### Daily Development

```bash
# 1. Start dev server
npm start

# 2. Make changes (files auto-format on save in VS Code)

# 3. Before commit
npm run pre-commit
git add .
git commit -m "Add feature"

# 4. Before push
npm run prepare-push
git push
```

### Available Commands

#### Development

```bash
npm start                # Dev server (localhost:3000)
npm run build           # Production build
npm test                # Run tests (watch mode)
```

#### Git Workflow

```bash
npm run prepare-push    # ⭐ Run before every push
npm run pre-commit      # Quick cleanup before commit
npm run pre-push        # Validation only (no auto-fix)
npm run check-all       # Full validation + build
```

#### Code Quality

```bash
npm run lint            # Check for errors
npm run lint:fix        # Auto-fix errors
npm run format          # Format all code
npm run format:check    # Check formatting
npm run type-check      # TypeScript validation
```

### Script Details

**`npm run prepare-push`** (Main Script)

1. Auto-fixes lint errors
2. Formats all code
3. Validates TypeScript
4. Runs all tests

**`npm run pre-commit`** (Quick)

1. Auto-fixes lint errors
2. Formats code

**`npm run pre-push`** (Validation)

1. Checks TypeScript
2. Checks lint (no fix)
3. Checks format (no fix)
4. Runs tests

**`npm run check-all`** (Complete)

1. Everything in pre-push
2. Plus production build

---

## 📝 Editing the Project

### Creating a New Component

```bash
# 1. Create folder
mkdir src/components/MyComponent

# 2. Create files
touch src/components/MyComponent/index.tsx
touch src/components/MyComponent/styles.ts
touch src/components/MyComponent/types.ts
```

**index.tsx:**

```typescript
import type { MyComponentProps } from './types';
import { Container } from './styles';

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return <Container>{title}</Container>;
};
```

**styles.ts:**

```typescript
import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
`;
```

**types.ts:**

```typescript
export interface MyComponentProps {
  title: string;
}
```

### Creating a New Page

Same as component, but in `src/pages/` folder. Add route to `App.tsx`:

```typescript
import { MyPage } from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />
```

---

## 🎨 Customization

### Colors

Edit `src/styles/theme.ts`:

```typescript
colors: {
  primary: '#1a4d2e',      // Change primary color
  secondary: '#ffd700',    // Change secondary color
  accent: '#ff6b35'        // Change accent color
}
```

### Fonts

1. Update Google Fonts in `public/index.html`
2. Edit `src/styles/typography.ts`:

```typescript
fonts: {
  display: 'Bebas Neue',   // Display font
  heading: 'Oswald',       // Heading font
  body: 'Inter'            // Body font
}
```

---

## 🧪 Testing

### Run Tests

```bash
npm test                           # Watch mode
npm run test -- --watchAll=false   # Run once
```

### Before Push

```bash
npm run prepare-push               # Includes test run
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output in `build/` folder.

---

## 📖 Key Concepts

### Component Structure

```
ComponentName/
├── index.tsx          # Logic & JSX
├── styles.ts          # All styles
├── types.ts           # Interfaces
└── data.ts            # Static data (optional)
```

### Import Patterns

```typescript
// Component imports its own files
import { myData } from './data';
import { Container } from './styles';
import type { MyProps } from './types';

// Component imports shared types
import type { Player } from '../../types/shared';

// Clean folder imports (index.tsx is automatic)
import { StatCard } from './components/StatCard';
```

### Data Flow

```
types/shared.ts
└── Defines: interface Player { ... }

pages/TeamPicks/data.ts
└── Uses: const players: Player[] = [...]

pages/TeamPicks/index.tsx
└── Imports: import { players } from './data';

components/PlayerCard/types.ts
└── Imports: import type { Player } from '../../types/shared';
```

---

## ✅ Pre-Push Checklist

Before pushing to git:

```bash
npm run prepare-push
```

This ensures:

- ✅ Code is formatted
- ✅ No lint errors
- ✅ TypeScript validates
- ✅ Tests pass

If it passes, you're ready to push!

---

## 🔧 Troubleshooting

### npm install fails

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript errors

```bash
npm run type-check    # See all errors
```

### Lint errors

```bash
npm run lint:fix      # Auto-fix
npm run lint          # Check remaining
```

### Format errors

```bash
npm run format        # Auto-format
```

## 💡 Best Practices

### Code Quality

- Always run `prepare-push` before pushing
- Let scripts auto-fix what they can
- Fix remaining errors manually

### Git Workflow

- Commit often with clear messages
- Run `pre-commit` before committing
- Run `prepare-push` before pushing
- Never push without validation

---

## 🎯 Quick Reference

```bash
# Development
npm start                    # Start dev

# Before git push (MOST IMPORTANT!)
npm run prepare-push         # Auto-fix + validate + test

# Quick cleanup
npm run pre-commit           # Auto-fix + format

# Production
npm run build                # Build for deploy
```

---
