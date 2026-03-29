import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FixturesPage } from './pages/Fixtures';
import { HomePage } from './pages/Home';
import { TeamPicksPage } from './pages/TeamPicks';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Router>
        <Header />
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/team-picks" element={<TeamPicksPage />} />
          <Route path="/fixtures" element={<FixturesPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
