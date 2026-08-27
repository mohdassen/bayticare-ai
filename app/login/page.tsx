'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login(){
  const r=useRouter();
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setLoading(true);
    const f=new FormData(e.currentTarget);
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f))});
    if(res.ok)r.push('/dashboard');else setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    setLoading(false);
  }
  return <main className="authShell">
    <section className="authVisual">
      <div className="brand"><div className="brandMark">B</div>Bayti<span>Care AI</span></div>
      <div><div className="heroBadge" style={{background:'rgba(255,255,255,.1)',borderColor:'rgba(255,255,255,.14)',color:'#fff'}}>مرحبًا بعودتك</div><h2>كل ما يخص منزلك، محفوظ ومنظم في مكان واحد.</h2><p>ادخل إلى لوحة منزلك لمتابعة صحة المنزل، الصيانة، الضمانات والمصروفات.</p></div>
      <small style={{color:'#a8c8b9'}}>BaytiCare — Your Home Operating System</small>
    </section>
    <section className="authPanel">
      <form className="card form" onSubmit={submit}>
        <div className="eyebrow">WELCOME BACK</div><h1 style={{fontSize:36,marginTop:8}}>تسجيل الدخول</h1><p className="muted">أدخل بيانات حسابك للوصول إلى منزلك.</p>
        <label>البريد الإلكتروني</label><input name="email" type="email" autoComplete="email" placeholder="name@example.com" required/>
        <label>كلمة المرور</label><input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required/>
        {error&&<div className="badge danger" style={{display:'block',marginBottom:14,padding:12}}>{error}</div>}
        <button className="btn" style={{width:'100%'}} disabled={loading}>{loading?'جاري الدخول...':'دخول إلى منزلي'}</button>
        <p className="muted" style={{textAlign:'center',marginTop:18,marginBottom:0}}>جديد في BaytiCare؟ <Link href="/register" style={{color:'#0f6a48',fontWeight:800}}>أنشئ حسابك</Link></p>
      </form>
    </section>
  </main>
}
