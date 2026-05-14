"use client";

import { useEffect, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import {
  authorInitials,
  authorLabels,
  newCommentId,
  type Comment,
  type CommentAuthor
} from "@/lib/memory-types";
import { useConfirm } from "./ConfirmProvider";

const authorStorageKey = "taipei-trip-comment-author-v1";

function formatAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (sameDay) return time;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function CommentThread({
  comments,
  onAdd,
  onRemove
}: {
  comments: Comment[];
  onAdd: (comment: Comment) => void;
  onRemove: (id: string) => void;
}) {
  const [author, setAuthor] = useState<CommentAuthor>("youngha");
  const [text, setText] = useState("");
  const confirm = useConfirm();

  useEffect(() => {
    const stored = window.localStorage.getItem(authorStorageKey);
    if (stored === "youngha" || stored === "sohyun") setAuthor(stored);
  }, []);

  const pickAuthor = (next: CommentAuthor) => {
    setAuthor(next);
    window.localStorage.setItem(authorStorageKey, next);
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({ id: newCommentId(), author, text: trimmed, at: new Date().toISOString() });
    setText("");
  };

  return (
    <div className="comment-thread">
      <div className="comment-thread__head">
        <span>댓글</span>
        <small>{comments.length}개</small>
      </div>

      <div className="comment-list">
        {comments.length === 0 && (
          <div className="comment-empty">아직 댓글이 없어요. 한 마디 남겨보세요.</div>
        )}
        {comments.map((c) => (
          <div key={c.id} className={`comment comment--${c.author}`}>
            <span className="comment__avatar">{authorInitials[c.author]}</span>
            <div className="comment__body">
              <div className="comment__meta">
                <strong>{authorLabels[c.author]}</strong>
                {formatAt(c.at) && <small>{formatAt(c.at)}</small>}
                <button
                  type="button"
                  className="comment__del"
                  onClick={async () => {
                    const preview = c.text.length > 40 ? `${c.text.slice(0, 40)}…` : c.text;
                    const ok = await confirm({
                      title: "이 코멘트를 삭제할까요?",
                      description: `${authorLabels[c.author]} · "${preview}"`
                    });
                    if (ok) onRemove(c.id);
                  }}
                  title="삭제"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <p>{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="comment-composer">
        <div className="comment-composer__who" role="group" aria-label="작성자">
          <span>나는</span>
          {(["youngha", "sohyun"] as CommentAuthor[]).map((a) => (
            <button
              key={a}
              type="button"
              className={
                author === a
                  ? `comment-who comment-who--${a} comment-who--active`
                  : `comment-who comment-who--${a}`
              }
              onClick={() => pickAuthor(a)}
            >
              {authorLabels[a]}
            </button>
          ))}
        </div>
        <div className="comment-composer__row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`${authorLabels[author]}로 한 마디... (⌘/Ctrl+Enter)`}
            rows={2}
          />
          <button type="button" className="comment-send" onClick={submit} disabled={!text.trim()}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
