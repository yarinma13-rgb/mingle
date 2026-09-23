You are working on the existing **mingle.careers** application.

Your task is to upgrade mingle's existing recruitment matching capabilities into a sophisticated, explainable, mutual **AI Recruiting Intelligence & Matching Engine**.

IMPORTANT:

Do not rebuild the application from scratch.

Do not replace working functionality unnecessarily.

Do not change authentication, existing user flows, database architecture, or unrelated screens unless required for this feature.

First inspect the existing codebase, database/schema, AI integrations, matching logic, candidate profile structure, job structure, and existing UI.

Reuse existing architecture and components wherever possible.

The goal is to make mingle's matching engine significantly more intelligent, useful, explainable, and differentiated.

---

# PRODUCT VISION

Traditional recruitment systems primarily ask:

**"Which candidates match this job?"**

mingle should ask:

**"Why does this person fit this role, why might they not fit, how strong is the mutual fit, what is still unknown, and what should the hiring team validate before moving forward?"**

mingle is not simply a CV ranking system.

It is an:

**AI-powered Recruiting Intelligence & Mutual Matching platform.**

The core intelligence loop should be:

**UNDERSTAND → MATCH → EXPLAIN → CHALLENGE → VALIDATE → CONNECT → LEARN**

The core product differentiation is:

### WHY THIS MATCH

*

### WHY NOT

*

### WHAT TO VALIDATE

---

# 1. DATA INTELLIGENCE

The system must use all relevant candidate, role, company, and interaction data available in the existing mingle application.

Do not rely only on keywords or CV similarity.

## Candidate intelligence

Analyze, where available:

* Skills
* Technical skills
* Soft skills
* Experience
* Years of experience
* Seniority
* Previous roles
* Responsibilities
* Achievements
* Industry experience
* Domain experience
* Company-stage experience
* Career trajectory
* Career progression
* Career direction
* Goals
* Motivation
* Work preferences
* Work environment preferences
* Communication preferences
* Collaboration preferences
* Leadership preferences
* Location
* Remote/hybrid/on-site preferences
* Compensation expectations
* Availability
* Profile answers
* Candidate interests
* Other relevant structured or unstructured profile information

## Role intelligence

Analyze:

* Job title
* Responsibilities
* Required skills
* Preferred skills
* Seniority
* Years of experience
* Industry/domain requirements
* Technical requirements
* Soft-skill requirements
* Team environment
* Company environment
* Work model
* Location
* Growth opportunities
* Career path
* Role scope
* Expectations
* Company characteristics
* Hiring manager input where available

Do not treat the Job Description as a perfect representation of the real hiring need.

---

# 2. UNDERSTAND THE REAL ROLE

Before matching candidates, AI should interpret the role.

Separate requirements into:

### MUST HAVE

Critical requirements that are genuinely necessary.

### PREFERRED

Useful but not essential requirements.

### TRANSFERABLE

Requirements that may be satisfied through adjacent or equivalent experience.

### DEVELOPMENTAL

Capabilities that could realistically be learned.

### CONTEXTUAL

Requirements that depend on the company's specific environment.

### UNKNOWN

Information that is not sufficiently defined.

The system should identify which requirements are actually critical rather than simply counting keywords.

Example:

If a role says:

"5 years of SaaS experience"

and a candidate has:

"4 years in B2B fintech software"

the system should be able to identify this as potentially relevant transferable experience rather than automatically rejecting the candidate.

Never invent equivalence.

Explain the reasoning.

---

# 3. AI MATCHING

Build a multi-dimensional matching model.

The match must evaluate at least:

## ROLE FIT

How well can this person perform the role?

Evaluate:

* Skills
* Experience
* Responsibilities
* Seniority
* Domain knowledge
* Industry experience
* Transferable experience
* Career trajectory
* Critical requirements
* Preferred requirements

## HUMAN FIT

How well does the person fit the working environment?

Evaluate, where data exists:

* Working style
* Communication style
* Collaboration
* Leadership preferences
* Team dynamics
* Work environment
* Organizational environment
* Management style
* Work model preferences

Do NOT make unsupported personality judgments.

Only use information actually available in the candidate/company data.

## MOTIVATION FIT

How well does the opportunity align with what the candidate wants next?

Evaluate:

* Career direction
* Career goals
* Motivation
* Growth expectations
* Role expectations
* Company interest
* Work model
* Location
* Compensation expectations where available
* Timing
* Availability

A technically excellent candidate should not automatically receive a high overall match if motivation or expectations are significantly misaligned.

---

# 4. MUTUAL MATCHING

This is a fundamental part of mingle.

Do not evaluate only:

Candidate → Job

Evaluate BOTH:

### COMPANY → TALENT FIT

"How well does this candidate fit what the company needs?"

AND

### TALENT → COMPANY FIT

"How well does this opportunity fit what the candidate is looking for?"

The final match should represent the degree of mutual alignment.

Example:

Role Fit: 96%
Human Fit: 91%
Motivation Fit: 61%

The system should identify:

"Strong professional fit, but potential motivation/expectation mismatch."

Do not hide this behind a high overall score.

---

# 5. MATCH SCORE

If mingle already has a Match Score, improve the existing implementation rather than creating duplicate scoring systems.

The Match Score should reflect the relevant dimensions of:

* Role Fit
* Human Fit
* Motivation Fit
* Critical requirements
* Mutual alignment
* Gaps
* Uncertainty

Avoid arbitrary or misleading precision.

The score should be explainable.

A recruiter should be able to understand:

"Why is this 91% rather than 72%?"

The answer must come from actual evidence.

---

# 6. MATCH CONFIDENCE

Introduce a separate concept:

## MATCH CONFIDENCE

Match Score answers:

**"How strong does the match appear based on available information?"**

Match Confidence answers:

**"How confident are we that this assessment is reliable?"**

Example:

MATCH SCORE: 91%

MATCH CONFIDENCE: MEDIUM

Why?

"Strong role alignment, but motivation and leadership experience have not yet been sufficiently validated."

Confidence should decrease when:

* Important candidate information is missing
* Important job information is missing
* Critical requirements are unclear
* Motivation is unknown
* Work preferences are unknown
* AI is relying heavily on inference
* Evidence is weak

This prevents false precision.

---

# 7. WHY THIS MATCH

Every meaningful match must provide an explainable summary.

Display:

## WHY THIS MATCH

Generate 3–5 concise, specific, evidence-based reasons.

Examples:

✓ 4/5 critical requirements strongly aligned
✓ Relevant experience in a similar company environment
✓ Career direction aligns with the opportunity
✓ Work model matches candidate preference
✓ Strong motivation alignment

Avoid generic AI language such as:

"Excellent candidate with great potential."

Every statement should be supported by actual data.

Where possible, allow the recruiter to understand exactly which candidate evidence produced the insight.

---

# 8. WHY NOT

This is one of the most important features in mingle.

The system must actively challenge its own match.

Do not only search for reasons why the candidate fits.

Search for:

* Gaps
* Risks
* Contradictions
* Uncertainties
* Expectation mismatches
* Experience limitations
* Environment mismatches
* Motivation mismatches
* Missing evidence

Display:

## WHY NOT / POTENTIAL RISKS

Examples:

⚠ No direct enterprise experience
⚠ Candidate prefers fully remote work while the role requires 3 office days
⚠ Limited people-management experience
⚠ Career expectations may exceed current role scope
⚠ Motivation for this specific opportunity is unclear

Classify each issue as:

### HARD GAP

Likely to prevent successful performance.

### DEVELOPMENT GAP

Can realistically be learned or developed.

### PREFERENCE GAP

Difference in preferences or expectations.

### UNKNOWN

Insufficient information to determine fit.

Do not automatically reject candidates because of gaps.

The purpose is transparency and better decision-making.

---

# 9. EVIDENCE VS INFERENCE

The AI must distinguish between:

### FACT

Directly supported by available data.

### INFERENCE

A reasonable interpretation based on multiple pieces of evidence.

### UNKNOWN

There is not enough information to determine the answer.

Never present an inference as a confirmed fact.

Never invent:

* Skills
* Experience
* Motivation
* Personality
* Achievements
* Company characteristics
* Candidate preferences

If information is missing, say so.

Example:

Bad:

"Candidate is a strong leader."

Better:

"Candidate managed a team of 8 for 3 years."

If there is not enough evidence:

"Leadership capability has not yet been sufficiently validated."

---

# 10. TRANSFERABLE SKILLS

Do not depend exclusively on exact keyword matching.

Identify potentially transferable or adjacent experience.

Examples:

React experience → potentially relevant frontend engineering experience.

Fintech B2B → potentially relevant B2B SaaS experience.

Recruiting experience → potentially relevant talent acquisition experience.

However:

Never automatically assume equivalence.

The AI must explain why an experience may be transferable and indicate confidence.

Example:

"Potentially transferable: 4 years in B2B fintech software may provide relevant experience for this B2B SaaS environment."

---

# 11. TALENT DISCOVERY

Where the existing platform supports a candidate database, matching should help surface candidates who may otherwise be missed.

Do not only return exact matches.

Identify:

### STRONG MATCH

Clearly aligned.

### POTENTIAL MATCH

Relevant transferable or adjacent experience.

### DEVELOPMENT MATCH

Candidate may fit with reasonable development.

### LOW CONFIDENCE MATCH

Potential fit exists but insufficient information is available.

This should reduce unnecessary candidate filtering.

---

# 12. AUTOMATION

Use AI and automation to reduce repetitive recruiter work.

Automate where appropriate:

* Job description parsing
* Requirement extraction
* Requirement prioritization
* Candidate profile analysis
* Skill normalization
* Job title normalization
* Candidate-to-role matching
* Mutual matching
* Match explanation
* Risk detection
* Gap detection
* Missing-information detection
* Validation-question generation
* Interview focus recommendations
* Match updates after new information
* Recruiter summaries

Automation should remove administrative work, not remove human judgment.

---

# 13. RECRUITING INTELLIGENCE

The system should help recruiters understand the role and candidate pool, not simply rank candidates.

Where sufficient data exists, identify:

* Overly restrictive requirements
* Requirements that eliminate many otherwise relevant candidates
* Transferable skill opportunities
* Candidate pool limitations
* Potentially unnecessary filters
* Common skill gaps
* Common expectation mismatches
* Areas where the job description may be unclear

If there is insufficient data, explicitly state:

**INSUFFICIENT DATA**

Never fabricate market intelligence.

---

# 14. WHAT TO VALIDATE

Every important gap or uncertainty should produce an actionable validation point.

Display:

## WHAT TO VALIDATE

Examples:

* Validate leadership experience during the manager interview.
* Confirm willingness to work from the office three days per week.
* Explore expectations regarding career progression.
* Validate depth of enterprise experience.
* Clarify motivation for moving from the current role.
* Confirm compensation expectations.

This turns mingle into a preparation tool for the recruiter.

The system should help the hiring team know:

**What should I ask this candidate?**

before the conversation happens.

---

# 15. RECOMMENDED NEXT STEP

Based on the available evidence, suggest an appropriate next step.

Examples:

* HR Interview
* Hiring Manager Interview
* Team Conversation
* Request More Information
* Validate Key Risk
* Hold
* Not Enough Information

Do not present this as an unquestionable decision.

It is an AI recommendation based on the available evidence.

The recruiter retains final judgment.

---

# 16. INTERVIEW INTELLIGENCE

Use the identified gaps and uncertainties to generate targeted interview focus areas.

For example:

MATCH:

Role Fit: 94%
Human Fit: 88%
Motivation Fit: 76%

WHY NOT:

⚠ Candidate expects rapid management progression.

WHAT TO VALIDATE:

"Explore whether the candidate's expected career progression is compatible with the current scope of the role."

This should create a direct bridge:

**MATCHING → INTERVIEW → DECISION**

---

# 17. CONTINUOUS LEARNING

Structure the system so matching can improve over time.

The architecture should be ready to incorporate:

Match
→ Connection
→ HR Interview
→ Hiring Manager Interview
→ Team Conversation
→ Candidate Feedback
→ Hiring Decision
→ 30-Day Feedback
→ 90-Day Feedback

Future data may be used to identify:

* Which signals correlate with successful hires
* Which risks frequently materialize
* Which matches progress
* Which expectation mismatches lead to drop-off
* Which candidate characteristics correlate with successful outcomes

IMPORTANT:

Do not claim predictive accuracy until sufficient real-world data exists.

Build the architecture for learning, but do not manufacture conclusions from insufficient data.

---

# 18. HUMAN-IN-THE-LOOP

AI should support recruiters and hiring managers.

It should not make autonomous hiring decisions.

The system should provide:

**DATA → INSIGHT → MATCH → RISK → VALIDATION → NEXT STEP**

The human makes the final decision.

---

# 19. UI / UX

Keep the existing mingle visual language.

Do not create a generic enterprise AI dashboard.

The experience should feel:

* Premium
* Modern
* Clean
* Human
* Intelligent
* Trustworthy
* Easy to scan

Use existing mingle:

* Typography
* Colors
* Components
* Spacing
* Cards
* Buttons
* Design patterns

Do not introduce unnecessary visual complexity.

Prioritize concise, actionable information.

The recruiter should understand a match within seconds, with the ability to expand for deeper reasoning.

Suggested structure:

### MATCH

Overall Match Score

### FIT BREAKDOWN

Role Fit
Human Fit
Motivation Fit

### CONFIDENCE

High / Medium / Low

### WHY THIS MATCH

3–5 strongest reasons

### WHY NOT

Gaps / risks / mismatches

### WHAT TO VALIDATE

Questions or uncertainties

### RECOMMENDED NEXT STEP

AI-supported next action

---

# 20. EXAMPLE OF THE TARGET EXPERIENCE

The final experience should be able to produce something like:

## 91% MATCH

**Match Confidence: Medium**

### ROLE FIT

95%

### HUMAN FIT

89%

### MOTIVATION FIT

87%

### WHY THIS MATCH

✓ Strong alignment with 4 of 5 critical requirements
✓ Relevant experience in a similar environment
✓ Career direction aligns with the role
✓ Work model matches candidate preference
✓ Strong motivation alignment

### WHY NOT

⚠ Limited direct people-management experience
⚠ Candidate's desired career progression may exceed current role scope

### WHAT TO VALIDATE

• Explore leadership experience beyond formal management
• Clarify expectations for progression during the next 12–18 months

### RECOMMENDED NEXT STEP

**HR Interview**

This is the level of practical intelligence the system should provide.

---

# 21. CORE DIFFERENTIATION

Do not position mingle as simply:

"AI finds candidates."

Do not position mingle as simply:

"AI ranks candidates."

Do not position mingle as simply:

"AI matches CVs to jobs."

Instead, the product should be built around:

**mingle understands the role.**

**mingle understands the person.**

**mingle understands the relationship between them.**

**mingle explains WHY the match makes sense.**

**mingle explains WHY it might not.**

**mingle identifies what is still unknown.**

**mingle tells the recruiter what to validate next.**

This is the core difference between a traditional matching engine and mingle.

---

# 22. FINAL PRODUCT PRINCIPLE

Traditional recruitment intelligence:

**DATA + AI + AUTOMATION → IDENTIFY MATCHES**

mingle:

**DATA + AI + AUTOMATION → UNDERSTAND → MATCH → EXPLAIN → CHALLENGE → VALIDATE → CONNECT → LEARN**

The objective is not to create more matches.

The objective is to create **better-informed connections and better recruitment decisions.**

Build the feature so that this principle is reflected consistently in:

* Matching logic
* AI prompts
* Data processing
* Scoring
* Confidence
* UI
* Recruiter workflow
* Candidate experience
* Future learning architecture

---

# IMPLEMENTATION PROCESS

Before writing code:

1. Audit the current matching implementation.
2. Identify existing data structures.
3. Identify existing AI/API integrations.
4. Identify current scoring logic.
5. Identify current match UI.
6. Identify reusable components.
7. Identify potential conflicts or duplicate logic.
8. Propose the implementation plan.

Then implement the upgrade incrementally.

After implementation, test:

* Strong exact matches
* Strong transferable matches
* Technically strong but motivation-poor matches
* Strong candidate-to-role but weak mutual matches
* Candidates with missing information
* Jobs with incomplete requirements
* Candidates with significant gaps
* Candidates with adjacent experience
* Different work-model preferences
* Different seniority levels

Verify that:

* Existing functionality still works.
* No unsupported claims are generated.
* No candidate information is invented.
* Match scores are explainable.
* Confidence reflects information quality.
* Why This Match is evidence-based.
* Why Not actively identifies meaningful risks.
* What To Validate is actionable.
* Mutual fit is represented.
* The UI remains consistent with mingle.
* The architecture can support future learning from recruitment outcomes.

Do not finish by simply saying the feature is implemented.

Provide a concise summary of:

1. What you changed
2. Which existing components you reused
3. Which matching logic was improved
4. How Match Score is calculated
5. How Match Confidence is calculated
6. How Why This Match works
7. How Why Not works
8. How mutual matching works
9. What remains for future iterations
