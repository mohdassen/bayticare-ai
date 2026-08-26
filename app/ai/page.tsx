import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { diagnoseIssue } from './actions';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function AIPage({searchParams}:Props){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const params=(await searchParams)||{};
  const summary=typeof params.summary==='string'?params.summary:'';
  const severity=typeof params.severity==='string'?params.severity:'';
  const confidence=typeof params.confidence==='string'?params.confidence:'';
  const category=typeof params.category==='string'?params.category:'';
  const severityLabel:Record<string,string>={LOW:'منخفض',MEDIUM:'متوسط',HIGH:'مرتفع',EMERGENCY:'طارئ'};

  return <AppShell>
    <div className="top"><div><h1>مساعد BaytiCare الذكي</h1><p className="muted">اشرح مشكلة المنزل وسيعطيك النظام توجيهًا أوليًا قبل حجز الفني.</p></div><span className="badge">AI Safety First</span></div>
    <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr'}}>
      <form className="card" action={diagnoseIssue}>
        <h2>صف المشكلة</h2>
        <textarea name="text" rows={8} required placeholder="مثال: مكيف الصالة بدأ يسرّب ماء وصوته أعلى من المعتاد منذ أمس" />
        <p className="muted">لا تعتمد على التشخيص الآلي في حالات الكهرباء الخطرة أو الحريق أو الغاز أو الأضرار الإنشائية.</p>
        <button className="btn" type="submit">تحليل المشكلة</button>
      </form>
      <div className="card"><h2>نتيجة التحليل</h2>{summary?<>
        <div style={{marginBottom:12}}><span className="badge">الخطورة: {severityLabel[severity]||severity||'غير محدد'}</span></div>
        <p>{summary}</p>
        {category&&<p className="muted">الفئة المقترحة: {category}</p>}
        {confidence&&<p className="muted">درجة الثقة: {confidence}%</p>}
        <p className="muted">هذا تقييم أولي وليس بديلًا عن فحص فني مؤهل.</p>
      </>:<p className="muted">اكتب وصف المشكلة لتظهر النتيجة هنا. عند عدم تفعيل مزود AI خارجي سيعمل النظام بوضع آمن وشفاف دون ادعاء تشخيص غير حقيقي.</p>}</div>
    </div>
  </AppShell>;
}
