import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

type RootErrorBoundaryState = {
  hasError: boolean;
  message: string;
  stack: string;
};

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  RootErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "", stack: "" };
  }

  static getDerivedStateFromError(error: any): RootErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || String(error),
      stack: error?.stack || "",
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[RootErrorBoundary]", error, errorInfo);
    this.setState((prev) => ({
      ...prev,
      stack: [error?.stack || "", errorInfo?.componentStack || ""]
        .filter(Boolean)
        .join("\n\n"),
    }));
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 760, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, boxShadow: "0 10px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Application Error</h1>
          <p style={{ margin: 0, marginBottom: 12, color: "#475569" }}>An unexpected error occurred while rendering this page.</p>
          <pre style={{ margin: 0, background: "#0f172a", color: "#e2e8f0", borderRadius: 8, padding: 12, overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 320 }}>
            {this.state.message || "Unknown error"}
            {this.state.stack ? `\n\n${this.state.stack}` : ""}
          </pre>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
