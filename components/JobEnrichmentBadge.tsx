interface JobEnrichmentBadgeProps {
  job: {
    extracted_description?: string | null;
  };
}

export default function JobEnrichmentBadge({ job }: JobEnrichmentBadgeProps) {
  if (!job.extracted_description) return null;

  let enriched;
  try {
    enriched = JSON.parse(job.extracted_description);
  } catch {
    return null;
  }

  return (
    <div className="mt-2 flex gap-2 flex-wrap">
      {enriched.seniority && enriched.seniority !== 'unknown' && (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
          {enriched.seniority}
        </span>
      )}
      {enriched.remote && enriched.remote !== 'unknown' && (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          {enriched.remote}
        </span>
      )}
      {enriched.skills?.slice(0, 3).map((skill: string) => (
        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          {skill}
        </span>
      ))}
    </div>
  );
}
