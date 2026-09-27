import { Fragment } from "react";
import type { Block, Media, Ruby, Section } from "@/lib/minna/types";
import { cleanSourceDisplay } from "@/lib/minna/solutions";

export function FuriganaText({ text, ruby = [] }: { text: string; ruby?: Ruby[] }) {
  text = cleanSourceDisplay(text);
  const readings = new Map<string, Set<string>>();
  for (const item of ruby) {
    if (!item.text || item.readings.length !== 1 || !item.readings[0] || !/[\u3400-\u9fff]/.test(item.text)) continue;
    const options = readings.get(item.text) ?? new Set(); options.add(item.readings[0]); readings.set(item.text, options);
  }
  const entries = [...readings].filter(([, r]) => r.size === 1).sort((a, b) => b[0].length - a[0].length);
  if (!entries.length) return <>{text}</>;
  const pattern = new RegExp(`(${entries.map(([base]) => base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return <>{text.split(pattern).map((part, i) => readings.get(part)?.size === 1
    ? <ruby key={i} lang="ja">{part}<rt>{[...readings.get(part)!][0]}</rt></ruby>
    : <Fragment key={i}>{part}</Fragment>)}</>;
}
function safeUrl(value: string) { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url : null; } catch { return null; } }

export function LessonMedia({ media }: { media: Media[] }) {
  const unique = media.filter((m, i) => media.findIndex(n => n.url === m.url) === i);
  return <div className="mn-media">{unique.map((item, i) => {
    const url = safeUrl(item.url); if (!url) return null;
    const youtube = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(url.hostname) && /^\/embed\/[\w-]+$/.test(url.pathname);
    if (youtube) return <iframe key={i} src={`https://www.youtube-nocookie.com${url.pathname}`} title={`Video bài học ${i + 1}`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
    // Source-hosted images have unknown dimensions and may be unavailable remotely.
    // eslint-disable-next-line @next/next/no-img-element
    if (item.kind === "img") return <a key={i} href={url.href} target="_blank" rel="noreferrer"><img src={url.href} alt={item.alt || "Hình minh họa bài học từ Riki"} loading="lazy" /></a>;
    if (item.kind === "audio") return <audio key={i} controls preload="none" src={url.href}>Trình duyệt không hỗ trợ audio.</audio>;
    if (item.kind === "video") return <video key={i} controls preload="none" src={url.href} aria-label="Video bài học" />;
    return <a key={i} href={url.href} target="_blank" rel="noreferrer">Mở tài liệu nguồn ↗</a>;
  })}</div>;
}

export function ContentBlocks({ blocks, ruby = [] }: { blocks: Block[]; ruby?: Ruby[] }) {
  return <div className="mn-prose">{blocks.map((block, i) => {
    if (block.type === "media") return null; // Render the deduplicated section media inventory once.
    if (block.type === "text") return <p key={i} className={/^例\s*\d*[:：]/.test(block.text) ? "mn-example" : undefined}><FuriganaText text={block.text} ruby={ruby} /></p>;
    if (block.type === "heading") return <h4 key={i}><FuriganaText text={block.text} ruby={ruby} /></h4>;
    if (block.type === "list") { const Tag = block.ordered ? "ol" : "ul"; return <Tag key={i}>{block.items.map((items, n) => <li key={n}><ContentBlocks blocks={items} ruby={ruby} /></li>)}</Tag>; }
    if (block.type === "table") return <div className="mn-table-wrap" key={i} tabIndex={0} role="region" aria-label="Bảng nội dung bài học"><table><tbody>{block.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} rowSpan={Math.max(1, Number(cell.rowSpan) || 1)} colSpan={Math.max(1, Number(cell.colSpan) || 1)}><FuriganaText text={cell.text} ruby={ruby} /></td>)}</tr>)}</tbody></table></div>;
    return null;
  })}</div>;
}

export function SectionContent({ section }: { section: Section }) {
  return <><ContentBlocks blocks={section.blocks} ruby={section.ruby} /><LessonMedia media={section.media} />{section.links.length > 0 && <div className="mn-source-links">{section.links.filter(l => safeUrl(l.url)).map((link, i) => <a key={i} href={link.url} target="_blank" rel="noreferrer">{link.text || "Tài liệu liên quan"} ↗</a>)}</div>}</>;
}
