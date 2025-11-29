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

    const { jobId, description, company } = await request.json();

    if (!jobId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [jobInfo, companyInfo] = await Promise.all([
      enrichJobDescription(description),
      extractCompanyInfo(company, description),
    ]);

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

    const { error } = await supabase
      .from('jobs')
      .update({
        extracted_description: JSON.stringify(extractedData),
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich job data' },
      { status: 500 }
    );
  }
}
