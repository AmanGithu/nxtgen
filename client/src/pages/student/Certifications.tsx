import { useState, useEffect } from 'react';
import { Award, ExternalLink, BookOpen } from 'lucide-react';
import api from '../../services/api';

interface Certification {
  id: string;
  name: string;
  provider: string | null;
  link: string | null;
  prerequisite: string | null;
  courseTitle: string;
}

interface CourseSummary {
  id: string;
  title: string;
}

/**
 * Certifications relevant to the courses this student is enrolled in — not
 * the full public catalogue.
 */
const StudentCertifications = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/student/certifications');
        if (res.data.success) {
          setCertifications(res.data.certifications);
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error('Failed to load certifications:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Your Certifications</h2>
        <p className="mt-1 text-sm text-text-muted">
          {courses.length
            ? `Certifications aligned to ${courses.map((c) => c.title).join(', ')}.`
            : 'Certifications relevant to your enrolled courses.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : certifications.length === 0 ? (
        <div className="rounded-xl border border-line bg-bg-surface p-10 text-center">
          <Award size={28} className="mx-auto text-text-muted" />
          <p className="mt-3 font-medium text-strong">No certifications linked yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Your academy administrator links certifications to each course — they&apos;ll appear here once they do.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col rounded-xl border border-line bg-bg-surface p-5 transition-colors hover:border-brand-orange/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                  <Award size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug text-strong">{cert.name}</h3>
                  {cert.provider && <p className="mt-0.5 text-xs text-text-muted">{cert.provider}</p>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1 rounded bg-elevate px-2 py-0.5">
                  <BookOpen size={11} />
                  {cert.courseTitle}
                </span>
                {cert.prerequisite && cert.prerequisite !== 'None' && (
                  <span className="rounded bg-elevate px-2 py-0.5">Prereq: {cert.prerequisite}</span>
                )}
              </div>

              {cert.link && (
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange hover:underline"
                >
                  Registration details <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCertifications;
