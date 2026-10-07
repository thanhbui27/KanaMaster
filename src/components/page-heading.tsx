import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <section className="ui-page-heading"><div><span className="ui-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action && <div className="ui-page-action">{action}</div>}</section>;
}
