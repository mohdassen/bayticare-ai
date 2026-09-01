import Link from 'next/link';

export default function Home(){
  return <main className="hero">
    <nav className="landingNav">
      <div className="brand"><div className="brandMark">B</div>Bayti<span>Care AI</span></div>
      <div className="actions"><Link className="btn ghost small" href="/login">تسجيل الدخول</Link><Link className="btn small" href="/register">ابدأ مجانًا</Link></div>
    </nav>

    <section className="landingHero">
      <div className="heroCopy">
        <div className="heroBadge"><span className="statusDot"></span> مدير ذكي لمنزلك</div>
        <h1>منزل يعرف ما يحتاجه قبل أن يتعطل.</h1>
        <p>BaytiCare يجمع أجهزة منزلك، الضمانات، الصيانة الوقائية، المصروفات والخدمات في مكان واحد — ويحوّلها إلى صورة واضحة عن صحة منزلك وما يحتاج اهتمامك الآن.</p>
        <div className="actions"><Link className="btn" href="/register">ابدأ بمنزلك الآن ←</Link><Link className="btn secondary" href="/login">لدي حساب</Link></div>
      </div>

      <div className="heroPreview">
        <div className="previewHead"><div><span className="eyebrow">HOME STATUS</span><h3 style={{marginTop:6}}>منزلي — الرياض</h3></div><span className="badge">الحالة جيدة</span></div>
        <div className="previewHome">
          <div className="healthWrap"><div className="health" style={{'--score':86} as React.CSSProperties}><strong>86</strong><small>/100</small></div><div className="healthText"><h3>صحة المنزل ممتازة</h3><p style={{color:'#cce1d6'}}>تبقى مهمتان فقط هذا الشهر للحفاظ على الحالة.</p></div></div>
        </div>
        <div className="previewStats"><div className="previewStat"><strong>12</strong><small>أصل مسجل</small></div><div className="previewStat"><strong>2</strong><small>مهام قادمة</small></div><div className="previewStat"><strong>8</strong><small>ضمانات</small></div></div>
      </div>
    </section>

    <section className="featureRow">
      <div className="feature"><div className="featureIcon">◫</div><h3>نسخة رقمية من منزلك</h3><p className="muted">سجل الأجهزة والغرف والضمانات وتاريخ الصيانة لكل أصل في المنزل.</p></div>
      <div className="feature"><div className="featureIcon">✓</div><h3>صيانة قبل الأعطال</h3><p className="muted">تذكيرات ذكية توضح ما الذي يحتاج صيانة ومتى، بدل الانتظار حتى يتعطل.</p></div>
      <div className="feature"><div className="featureIcon">✧</div><h3>مساعد منزلي ذكي</h3><p className="muted">اسأل عن أجهزتك، مصروفاتك، الضمانات والمشاكل المنزلية من مكان واحد.</p></div>
    </section>

    <footer style={{display:'flex',gap:16,justifyContent:'center',padding:'24px 0',fontSize:13}} className="muted">
      <Link href="/privacy">سياسة الخصوصية</Link>
      <Link href="/terms">شروط الاستخدام</Link>
    </footer>
  </main>
}
