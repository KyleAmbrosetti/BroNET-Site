import { createRoot } from "react-dom/client";
import Intercom from '@intercom/messenger-js-sdk';
import App from "./App";
import "./index.css";

Intercom({
  app_id: 'wj8o6t7c',
});

createRoot(document.getElementById("root")!).render(<App />);
