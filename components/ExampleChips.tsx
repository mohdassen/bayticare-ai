'use client';

export function ExampleChips({ examples }: { examples: string[] }) {
  function fill(text: string) {
    const el = document.querySelector<HTMLTextAreaElement>('textarea[name="text"]');
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  }
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
    {examples.map((ex) => <button key={ex} type="button" className="pill" style={{ fontSize: 11, cursor: 'pointer', border: 0 }} onClick={() => fill(ex)}>{ex.slice(0, 26)}…</button>)}
  </div>;
}
