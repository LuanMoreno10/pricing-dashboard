import Showcase from './pages/Showcase';

// The published site is the public, read-only services page.
// The internal pricing tools (src/pages/*, store) are no longer routed.
export default function App() {
  return <Showcase />;
}
