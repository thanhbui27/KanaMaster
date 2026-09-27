"use client";
import { Fragment } from "react";
import { Check, PencilLine } from "lucide-react";
import type { Lesson, MinnaProgress } from "@/lib/minna/types";
import { FuriganaText, SectionContent } from "./content";
import { ExerciseSolution } from "./exercise-solution";

export function Practice({ lesson, progress, update }: { lesson: Lesson; progress: MinnaProgress; update: (fn: (p: MinnaProgress) => MinnaProgress) => void }) {
  const groups = [...new Set(lesson.exercises.map(e => `${e.sectionId}:${e.group}`))];
  const types = { "fill-blank": "Điền chỗ trống", "multiple-choice": "Chọn đáp án", "short-answer": "Tự viết câu trả lời", "sentence-completion": "Hoàn thành câu" };
  return <><div className="mn-heading"><div><span className="mn-kicker">THỰC HÀNH VỚI NỘI DUNG GỐC</span><h2>Bài tập từ Riki</h2></div><span className="mn-pill">{progress.completed.filter(id => lesson.exercises.some(e => e.id === id)).length} / {lesson.exercises.length} đã làm</span></div><div className="mn-notice"><PencilLine size={20} /><div><strong>Lời giải kèm giải thích cho từng câu</strong><p>Làm bài, mở “Xem lời giải” rồi đối chiếu từng ô. Câu mở có câu trả lời mẫu; đề nguồn bị lỗi được ghi chú riêng. “Đã làm” ghi nhận tiến độ, không phải điểm số. Bản nháp của bạn được lưu trên trình duyệt này.</p></div></div>
    {groups.map((key, groupIndex) => {
      const exercises = lesson.exercises.filter(e => `${e.sectionId}:${e.group}` === key);
      const section = lesson.practiceSections.find(s => s.id === exercises[0].sectionId)!;
      return <details className="mn-practice-group" key={key} open={groupIndex === 0}><summary><span>Nhóm {exercises[0].group}</span><small>{exercises.length} câu · {exercises.filter(e => progress.completed.includes(e.id)).length} đã làm</small></summary><div className="mn-practice-body">{exercises[0].context && <div className="mn-context"><span className="mn-kicker">HƯỚNG DẪN & VÍ DỤ TỪ NGUỒN</span><p><FuriganaText text={exercises[0].context} ruby={section.ruby} /></p></div>}{exercises.map((exercise, i) => {
        const fields = exercise.parts.filter(p => p.type === "input");
        const filled = fields.every(p => p.type === "input" && progress.answers[`${exercise.id}:${p.id}`]?.trim());
        const done = progress.completed.includes(exercise.id);
        const sourceIssue = exercise.solution?.status === "source-issue";
        const change = (field: string, value: string) => update(p => ({ ...p, answers: { ...p.answers, [`${exercise.id}:${field}`]: value }, completed: p.completed.filter(id => id !== exercise.id) }));
        return <article className="mn-exercise" key={exercise.id}><div className="mn-heading"><span className="mn-kicker">CÂU {i + 1} · {types[exercise.type]}</span>{sourceIssue ? <span className="mn-pill">Đề nguồn cần sửa</span> : done && <span className="mn-pill green">Đã làm · tự đối chiếu</span>}</div><div className="mn-exercise-question" lang="ja">{sourceIssue ? <FuriganaText text={exercise.question} ruby={section.ruby} /> : exercise.parts.map((part, index) => {
          if (part.type === "text") return <Fragment key={index}><FuriganaText text={part.text} ruby={section.ruby} /></Fragment>;
          const value = progress.answers[`${exercise.id}:${part.id}`] ?? "";
          const label = `Nhóm ${exercise.group}, câu ${i + 1}, ${part.id.replace("field-", "ô ")}`;
          return part.options ? <select key={index} aria-label={label} value={value} onChange={e => change(part.id, e.target.value)}><option value="">Chọn…</option>{part.options.map(option => <option key={option} value={option}>{option}</option>)}</select>
            : exercise.type === "short-answer" ? <textarea key={index} aria-label={label} rows={2} placeholder="Viết câu trả lời của bạn…" value={value} onChange={e => change(part.id, e.target.value)} />
              : <input key={index} aria-label={label} placeholder="…" autoComplete="off" value={value} onChange={e => change(part.id, e.target.value)} />;
        })}</div>{!sourceIssue && <div className="mn-exercise-footer"><span className="mn-muted">{done ? "Bạn đã lưu bài làm. Có thể sửa bất cứ lúc nào." : "Bản nháp tự động lưu khi nhập."}</span><button className="mn-button" disabled={!filled || done} onClick={() => update(p => ({ ...p, completed: [...new Set([...p.completed, exercise.id])] }))}><Check size={16} />{done ? "Đã lưu bài làm" : "Lưu bài làm"}</button></div>}<ExerciseSolution exercise={exercise} progress={progress} />{sourceIssue && <div className="mn-exercise-footer"><span className="mn-muted">Ghi nhận đã đọc hướng dẫn, không chấm đề lỗi.</span><button className="mn-button" disabled={done} onClick={() => update(p => ({ ...p, completed: [...new Set([...p.completed, exercise.id])] }))}><Check size={16} />{done ? "Đã đọc hướng dẫn" : "Đánh dấu đã đọc hướng dẫn"}</button></div>}</article>;
      })}</div></details>;
    })}
    {!lesson.exercises.length && <div className="mn-notice">Phần này chưa tách được thành câu hỏi. Bạn vẫn có thể học toàn bộ nội dung nguồn bên dưới và ghi chú lại.</div>}
    {lesson.practiceSections.map(section => <details className="mn-source-detail" key={section.id}><summary>Xem toàn bộ bài tập gốc · {section.title}</summary><SectionContent section={section} /><label className="mn-note-label">Ghi chú học tập<textarea rows={4} value={progress.notes[section.id] ?? ""} onChange={e => update(p => ({ ...p, notes: { ...p.notes, [section.id]: e.target.value } }))} placeholder="Điều cần hỏi giáo viên hoặc xem lại…" /></label></details>)}
  </>;
}
