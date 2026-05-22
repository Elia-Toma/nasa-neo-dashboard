import './App.css'
import { createBrowserRouter, createRoutesFromElements, Link, Route, RouterProvider } from 'react-router-dom'
import Main from './modules/main/Main'
import Home from './pages/Home'
import AsteroidDetail from './pages/AsteroidDetail';
import NotFound from './pages/NotFound'
import { TooltipProvider } from './components/ui/tooltip'
import { ThemeProvider } from './components/theme-provider'

function App() {
  let router = undefined;
  router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Main />} handle={{ crumb: () => <Link to="/">Home</Link> }}>
        <Route path="/" element={<Home />} />
        <Route path="/asteroid/:id" element={<AsteroidDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
