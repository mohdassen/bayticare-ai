'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register(){
  const r=useRouter();
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setLoading(true);
    const f=new FormData(e.currentTarget);
    const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f))});
    if(res.ok)r.push('/properties?onboarding=1');else setError((await res.json()).error||'تعذر إنشاء الحساب');
    setLoading(false);
  }
  return <main className="authShell">
    <section className="authVisual">
      <div className="brand"><div className="brandMark">B</div>Bayti<span>Care AI</span></div>
      <div><div className="heroBadge" style={{background:'rgba(255,255,255,.1)',borderColor:'rgba(255,255,255,.14)',color:'#fff'}}>ابدأ خلال دقيقتين</div><h2>حوّل منزلك إلى سجل ذكي يعرف ما يحتاجه.</h2><p>سجّل منزلك وأجهزتك، ودع BaytiCare ينظم الضمانات والصيانة والمصروفات لك.</p></div>
      <small style={{color:'#a8c8b9'}}>بياناتك خاصة بك ولا تتم مشاركتها مع مزودي الخدمة إلا عند طلبك.</small>
    </section>
    <section className="authPanel">
      <form className="card form" onSubmit={submit}>
        <div className="eyebrow">CREATE ACCOUNT</div><h1 style={{fontSize:36,marginTop:8}}>إنشاء حساب</h1><p className="muted">ابدأ مجانًا، ويمكنك إضافة منزلك مباشرة بعد التسجيل.</p>
        <label>الاسم</label><input name="name" autoComplete="name" placeholder="محمد" required/>
        <label>البريد الإلكتروني</label><input name="email" type="email" autoComplete="email" placeholder="name@example.com" required/>
        <label>رقم الجوال</label><input name="phone" inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx"/>
        <label>كلمة المرور</label><input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="8 أحرف على الأقل" required/>
        {error&&<div className="badge danger" style={{display:'block',marginBottom:14,padding:12}}>{error}</div>}
        <button className="btn" style={{width:'100%'}} disabled={loading}>{loading?'جاري إنشاء الحساب...':'إنشاء الحساب'}</button>
        <p className="muted" style={{textAlign:'center',marginTop:18,marginBottom:0}}>لديك حساب؟ <Link href="/login" style={{color:'#0f6a48',fontWeight:800}}>تسجيل الدخول</Link></p>
      </form>
    </section>
  </main>
}
