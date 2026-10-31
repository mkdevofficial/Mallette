import Link from 'next/link';
import { getCategoriesCounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  const counts = getCategoriesCounts();

  const categoriesData = [
    {
      name: 'قوانين',
      title: 'القوانين والأوامر القانونية',
      desc: 'تشمل القوانين الصادرة عن الجمعية الوطنية، مدونات الحقوق، الأوامر القانونية المنظمة للعدالة، والتعديلات التشريعية.',
      icon: 'fa-gavel',
      color: 'emerald',
    },
    {
      name: 'مراسيم',
      title: 'المراسيم التطبيقية',
      desc: 'المراسيم الرئاسية والحكومية المحددة لتنظيم القطاعات والهيئات والمؤسسات، وإجراءات تطبيق القوانين.',
      icon: 'fa-stamp',
      color: 'blue',
    },
    {
      name: 'الجريدة الرسمية',
      title: 'الجريدة الرسمية',
      desc: 'الأعداد الرسمية الصادرة عن الجريدة الرسمية للجمهورية الإسلامية الموريتانية، شاملة كافة المراسيم والإعلانات.',
      icon: 'fa-newspaper',
      color: 'amber',
    },
    {
      name: 'قرارات المحاكم',
      title: 'قرارات المحاكم والمحكمة العليا',
      desc: 'مجلات المحكمة العليا الموريتانية ومجموعات الاجتهاد القضائي والقرارات المبدئية للغرف المدنية والجنائية.',
      icon: 'fa-scale-balanced',
      color: 'purple',
    },
    {
      name: 'مقررات',
      title: 'المقررات الوزارية',
      desc: 'المقررات التنظيمية واللوائح الداخلية الصادرة عن الوزارات والقطاعات الحكومية المعنية بالعدل والداخلية.',
      icon: 'fa-scroll',
      color: 'teal',
    },
    {
      name: 'الاتفاقيات الدولية',
      title: 'الاتفاقيات والتعاون القضائي الدولي',
      desc: 'المعاهدات والاتفاقيات الثنائية والإقليمية المتعلقة بالتعاون القضائي في المواد المدنية والتجارية والجنائية.',
      icon: 'fa-globe',
      color: 'indigo',
    },
    {
      name: 'تعميمات',
      title: 'التعميمات والتوجيهات القضائية',
      desc: 'التعميمات المشتركة الصادرة عن النيابة العامة ووزارة العدل حول آليات المتابعة القضائية وتطبيق الإجراءات.',
      icon: 'fa-bullhorn',
      color: 'rose',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
          <i className="fa-solid fa-folder-tree"></i> الفهرس الموضوعي
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
          أقسام وتصنيفات النصوص القانونية
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          استعرض التشريعات والقوانين والمراسيم والقرارات القضائية الموريتانية مصنفة حسب طبيعتها الرسمية.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesData.map((cat) => {
          const count = counts[cat.name] || 0;
          return (
            <div
              key={cat.name}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-slate-50 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}
                  >
                    <i className={`fa-solid ${cat.icon}`}></i>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {count} وثيقة
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {cat.title}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4">
                  {cat.desc}
                </p>
              </div>

              <Link
                href={`/?category=${encodeURIComponent(cat.name)}`}
                className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-700 hover:text-white text-slate-800 font-bold text-sm transition-colors mt-2"
              >
                <span>تصفح نصوص القسم</span>
                <i className="fa-solid fa-arrow-left text-xs"></i>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
