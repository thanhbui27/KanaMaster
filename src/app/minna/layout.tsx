import "./minna.css";

export default function MinnaLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-shell mn-app" lang="vi"><main className="mn-container">{children}</main></div>;
}
