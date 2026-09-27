"use client";
import { useState } from "react";
import { BookOpen, Check, Search } from "lucide-react";
import type { Exercise, MinnaProgress } from "@/lib/minna/types";
import { matchesReference } from "@/lib/minna/solutions";

export function ExerciseSolution({ exercise, progress }: { exercise: Exercise; progress: MinnaProgress }) {
  const [compare, setCompare] = useState(false);
  const solution = exercise.solution;
  if (!solution) return null;
  const fields = exercise.parts.filter(part => part.type === "input");
  const hasAttempt = fields.some(field => progress.answers[`${exercise.id}:${field.id}`]?.trim());
  const issue = solution.status === "source-issue";
  return <details className={`mn-solution${issue ? " mn-solution-issue" : ""}`}>
    <summary><BookOpen size={17} /><span>{issue ? "Xem hướng dẫn sửa đề" : "Xem lời giải"}</span><small>{issue ? "Đề nguồn cần sửa" : solution.status === "sample" ? "Câu trả lời mẫu" : "Đáp án tham khảo"}</small></summary>
    <div className="mn-solution-body">
      {!issue && <><p className="mn-muted">{solution.status === "sample" ? "Đây là một cách trả lời phù hợp. Bạn có thể viết câu khác đúng ngữ pháp và ngữ cảnh." : "Điền phần dưới đây vào từng ô theo thứ tự. Dấu / ngăn cách những cách viết được chấp nhận."}</p>
        <ol className="mn-solution-answers">{solution.answers.map((alternatives, index) => {
          const value = progress.answers[`${exercise.id}:${fields[index].id}`] ?? "";
          const match = matchesReference(value, alternatives);
          return <li key={fields[index].id}><span className="mn-kicker">Ô {index + 1}</span><span lang="ja">{alternatives.join(" / ")}</span>{compare && <div className={`mn-answer-comparison${match ? " matched" : ""}`}>
            {match ? <Check size={15} /> : <Search size={15} />}<span>{!value.trim() ? "Bạn chưa điền ô này." : match ? "Khớp lời giải tham khảo." : "Khác gợi ý — đối chiếu giải thích; câu của bạn vẫn có thể đúng."}</span>
          </div>}</li>;
        })}</ol>
        <button className="mn-button secondary" type="button" disabled={!hasAttempt} onClick={() => setCompare(true)}><Search size={15} />Đối chiếu bài làm</button>
        {compare && <p className="mn-muted" role="status">Đang đối chiếu nội dung hiện tại của từng ô. Kết quả này không phải điểm chấm tự động.</p>}
      </>}
      <div className="mn-solution-explanation"><strong>{issue ? "Vấn đề trong đề & cách hiểu" : "Giải thích"}</strong><p>{solution.explanation}</p></div>
      <small className="mn-muted">Biên soạn từ đề bài và ngữ pháp; không phải đáp án chính thức của Riki.</small>
    </div>
  </details>;
}
