// Basic
import { Component } from "react";

// Router
import {
  Routes,
  Route,
} from "react-router-dom";

// Utils
import { ContextProvider } from "./utils/contextModule";
import {
  LivepeerConfig,
  ThemeConfig,
  createReactClient,
  studioProvider,
} from '@livepeer/react';

// Pages
import Main from "./pages/main";
import Streamer from "./pages/streamer";

const livepeerClient = createReactClient({
  provider: studioProvider({
    apiKey: process.env.REACT_APP_LIVEPEER,
  }),
});

class App extends Component {
  render() {
    return (
      <ContextProvider>
        <LivepeerConfig client={livepeerClient}>
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/streamer/:pub" element={<Streamer />} />
            <Route path="*" element={<Main />} />
          </Routes>
        </LivepeerConfig>
      </ContextProvider>
    );
  }
}

export default App;
