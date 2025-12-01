import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichJobDescription, extractCompanyInfo } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    // Fetch job from database
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Parallel AI calls with 5-second timeout
    const enrichmentPromise = Promise.race([
      Promise.all([
        enrichJobDescription(job.raw_description || ''),
        extractCompanyInfo(job.company, job.raw_description || ''),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 5000)
      ),
    ]);

    const [jobInfo, companyInfo] = await enrichmentPromise;

    // Combine insights
    const extractedData = {
      summary: jobInfo.summary,
      skills: jobInfo.skills,
      responsibilities: jobInfo.responsibilities,
      seniority: jobInfo.seniority,
      remote: jobInfo.remote,
      industry: companyInfo.industry,
      companySize: companyInfo.size,
      hiringManager: companyInfo.hiringManager,
      department: companyInfo.department,
    };

    // Update job with enrichment
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        extracted_description: JSON.stringify(extractedData),
        seniority_level: jobInfo.seniority,
        ai_enriched_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Return insights for popup display
    return NextResponse.json({
      success: true,
      insights: {
        seniority: jobInfo.seniority,
        remote: jobInfo.remote,
        topSkills: jobInfo.skills.slice(0, 3),
        summary: jobInfo.summary,
      },
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    // Return safe defaults instead of failing
    return NextResponse.json({
      success: false,
      insights: {
        seniority: 'unknown',
        remote: 'unknown',
        topSkills: [],
        summary: 'Analysis unavailable',
      },
    });
  }
}
