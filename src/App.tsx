import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/Home';
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
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
