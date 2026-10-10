-- Replace the open Myfxbook / Tracknow role with the Customer Success Engineer JD.
-- Run once in Supabase SQL Editor (Production).

update public.company_profiles
set location = 'Ashkelon'
where company_name ilike '%myfxbook%'
   or company_name ilike '%tracknow%';

update public.roles as r
set
  title = 'Customer Success Engineer',
  department = 'Customer success',
  work_model = 'Hybrid',
  job_presentation = $job$
Tracknow (a Myfxbook company) is hiring a Customer Success Engineer to join our growing team in Ashkelon.

If you come from Tier 2/3 Technical Support, QA, or Technical Onboarding, this is a strong next step into a client-facing tech role — with more ownership, more impact, and a clear career leap.

You’ll sit between our product and our international clients: leading technical integrations, troubleshooting live issues, and running smooth onboarding journeys from kickoff to first value.
$job$,
  description = $job$
Tracknow (a Myfxbook company) is hiring a Customer Success Engineer to join our growing team in Ashkelon.

If you come from Tier 2/3 Technical Support, QA, or Technical Onboarding, this is a strong next step into a client-facing tech role — with more ownership, more impact, and a clear career leap.

You’ll sit between our product and our international clients: leading technical integrations, troubleshooting live issues, and running smooth onboarding journeys from kickoff to first value.
$job$,
  responsibilities = $resp$
- Lead technical onboarding for new clients end to end
- Own integrations and handoffs between Tracknow and client systems
- Troubleshoot live technical issues with speed and clarity
- Translate client needs into actionable feedback for product and engineering
- Build trust with international accounts through clear, confident communication
$resp$,
  requirements = $req$
- Fluent English, verbal and written (required)
- Strong technical aptitude, including HTML, CSS, and API integrations
- Sharp analytical and troubleshooting skills
- Excellent communication and a confident client-facing presence
- Background in Tier 2/3 Technical Support, QA, or Technical Onboarding

Nice to have:
- Experience with SaaS onboarding or partner integrations
- Hebrew for local team collaboration
$req$,
  required_skills = array[
    'HTML',
    'CSS',
    'API integrations',
    'Technical support',
    'Customer success',
    'Troubleshooting',
    'Technical onboarding',
    'English'
  ],
  updated_at = now()
from public.company_profiles as cp
where r.company_id = cp.user_id
  and (
    cp.company_name ilike '%myfxbook%'
    or cp.company_name ilike '%tracknow%'
  )
  and r.status = 'open';
