import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { diagnoseIssue } from './actions';
import { ExampleChips } from '@/components/ExampleChips';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

const severityMeta:Record<string,{label:string;badge:string;icon:string}>={
  LOW:{label:'منخفض',badge:'',icon:'✓'},
  MEDIUM:{label:'متوسط',badge:'warning',icon:'⚠️'},
  HIGH:{label:'مرتفع',badge:'danger',icon:'⚠️'},
  EMERGENCY:{label:'طارئ',badge:'danger',icon:'🚨'},
};
const examples=['مكيف الصالة بدأ يسرّب ماء وصوته أعلى من المعتاد منذ أمس','الثلاجة ما تبرد زي الأول والصوت غريب','خزان المياه يفرغ أسرع من المعتاد'];

export default async function AIPage({searchParams}:Props){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const params=(await searchParams)||{};
  const summary=typeof params.summary==='string'?params.summary:'';
  const severity=typeof params.severity==='string'?params.severity:'';
  const confidence=typeof params.confidence==='string'?params.confidence:'';
  const category=typeof params.category==='string'?params.category:'';
  const error=typeof params.error==='string'?params.error:'';
  const meta=severityMeta[severity];

  return <AppShell>
    <div className="aiHero">
      <div><span className="eyebrow" style={{color:'#a8e0c2'}}>✧ AI Safety First</span><h2>مساعد BaytiCare الذكي</h2><p>اشرح مشكلة المنزل بجملة أو جملتين، وسيعطيك تقييمًا أوليًا وخطوة تالية واضحة قبل حجز الفني.</p></div>
    </div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}
    <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr'}}>
      <form className="card" action={diagnoseIssue}>
        <h2>صف المشكلة</h2>
        <textarea name="text" rows={7} required placeholder="مثال: مكيف الصالة بدأ يسرّب ماء وصوته أعلى من المعتاد منذ أمس" style={{width:'100%',padding:14,border:'1px solid #d9e3dc',borderRadius:14,background:'#fbfdfb',outline:'none',fontFamily:'inherit',fontSize:14,resize:'vertical'}}/>
        <ExampleChips examples={examples}/>
        <p className="muted" style={{fontSize:13}}>لا تعتمد على التشخيص الآلي في حالات الكهرباء الخطرة أو الحريق أو الغاز أو الأضرار الإنشائية — اتصل بالطوارئ مباشرة.</p>
        <button className="btn" type="submit">✧ تحليل المشكلة</button>
      </form>
      <div className="card">
        <div className="sectionHead"><h2>نتيجة التحليل</h2>{meta&&<span className={`badge ${meta.badge}`}>{meta.icon} {meta.label}</span>}</div>
        {summary?<>
          {severity==='EMERGENCY'&&<div className="badge danger" style={{display:'block',marginBottom:12,padding:12}}>🚨 اتصل بالدفاع المدني (998) أو الطوارئ (911) إذا كان هناك خطر فوري.</div>}
          <p style={{lineHeight:1.9}}>{summary}</p>
          <div className="list" style={{marginTop:14}}>
            {category&&<div className="item"><span>الفئة المقترحة</span><span className="pill">{category}</span></div>}
            {confidence&&<div className="item"><span>درجة الثقة</span><strong>{confidence}%</strong></div>}
          </div>
          <p className="muted" style={{fontSize:12,marginTop:14}}>هذا تقييم أولي بمساعدة الذكاء الاصطناعي وليس بديلًا عن فحص فني مؤهل.</p>
          <a className="btn secondary" href="/services" style={{marginTop:10,display:'inline-block'}}>📅 احجز فني الآن</a>
        </>:<div className="empty"><div style={{fontSize:32}}>✧</div><h3 style={{fontSize:15,margin:'8px 0 4px'}}>اكتب وصف المشكلة</h3><p className="muted" style={{fontSize:13}}>ستظهر النتيجة هنا خلال ثوانٍ. عند عدم تفعيل مزود AI سيعمل النظام بوضع آمن وشفاف دون ادعاء تشخيص غير حقيقي.</p></div>}
      </div>
    </div>
  </AppShell>;
}
