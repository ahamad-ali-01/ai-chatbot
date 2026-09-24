"use client";
export function ModelSelector({model,onChange,models}:{model:string;onChange:(m:string)=>void;models:string[]}){if(!models.length)return null;return <select value={model} onChange={e=>onChange(e.target.value)} className="border rounded-lg bg-transparent px-2 py-1 text-sm">{models.map(m=><option key={m} value={m}>{m}</option>)}</select>}
