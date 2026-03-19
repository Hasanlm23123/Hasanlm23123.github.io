const MODEL = "gpt-5.4-mini";
const MAX_FIELD_LENGTH = 14000;

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "role_title",
    "company_name",
    "fit_score",
    "decision",
    "summary",
    "candidate_pitch",
    "recruiter_take",
    "strengths",
    "gaps",
    "rewritten_bullets",
    "interview_questions",
    "prep_plan"
  ],
  properties: {
    role_title: { type: "string" },
    company_name: { type: "string" },
    fit_score: { type: "integer" },
    decision: { type: "string" },
    summary: { type: "string" },
    candidate_pitch: { type: "string" },
    recruiter_take: { type: "string" },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" }
        }
      }
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "fix"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          fix: { type: "string" }
        }
      }
    },
    rewritten_bullets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "improved", "why_it_works"],
        properties: {
          original: { type: "string" },
          improved: { type: "string" },
          why_it_works: { type: "string" }
        }
      }
    },
    interview_questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "why_it_matters", "talking_points"],
        properties: {
          question: { type: "string" },
          why_it_matters: { type: "string" },
          talking_points: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    prep_plan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "focus", "action"],
        properties: {
          day: { type: "string" },
          focus: { type: "string" },
          action: { type: "string" }
        }
      }
    }
  }
};

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const validatePayload = ({ resumeText, jobDescription }) => {
  if (!resumeText || !jobDescription) {
    return "Both resumeText and jobDescription are required.";
  }

  if (resumeText.length < 80) {
    return "resumeText is too short for a meaningful analysis.";
  }

  if (jobDescription.length < 80) {
    return "jobDescription is too short for a meaningful analysis.";
  }

  if (resumeText.length > MAX_FIELD_LENGTH || jobDescription.length > MAX_FIELD_LENGTH) {
    return `Inputs must stay under ${MAX_FIELD_LENGTH} characters each.`;
  }

  return "";
};

const buildPrompt = ({ jobTitle, companyName, focusMode, candidateLevel, resumeText, jobDescription }) => {
  const safeJobTitle = jobTitle || "Target role not provided";
  const safeCompanyName = companyName || "Target company not provided";

  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            "You are RoleReady AI, a precise recruiting and career analysis assistant. Ground every conclusion in the supplied resume and job description. Do not invent experience, metrics, or technologies. Prefer direct, useful recruiting language over hype. Make the rewritten bullets stronger, but do not fabricate facts. Return only structured JSON that matches the provided schema."
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Analyze this candidate for the role below.

Focus mode: ${focusMode}
Candidate level: ${candidateLevel}
Job title: ${safeJobTitle}
Company: ${safeCompanyName}

Resume:
${resumeText}

Job description:
${jobDescription}

Instructions:
- Give a fit score from 0 to 100.
- Make strengths and gaps specific to the evidence in the inputs.
- Rewrite exactly 3 resume bullets or profile bullets in a stronger, recruiter-friendly way.
- Generate exactly 3 likely interview questions with concise talking points.
- Generate exactly 7 prep plan steps, one for each day.
- If company information is missing, still analyze the role and note that the company field was not provided.`
        }
      ]
    }
  ];
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY in the deployment environment." });
  }

  const parsed = parseBody(req.body);
  const payload = {
    jobTitle: normalizeText(parsed.jobTitle),
    companyName: normalizeText(parsed.companyName),
    focusMode: normalizeText(parsed.focusMode) || "recruiter",
    candidateLevel: normalizeText(parsed.candidateLevel) || "internship",
    resumeText: normalizeText(parsed.resumeText),
    jobDescription: normalizeText(parsed.jobDescription)
  };

  const validationError = validatePayload(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        max_output_tokens: 1800,
        input: buildPrompt(payload),
        text: {
          format: {
            type: "json_schema",
            name: "role_ready_analysis",
            strict: true,
            schema
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage =
        data && data.error && data.error.message
          ? data.error.message
          : "OpenAI did not return a successful response for the analysis request.";
      return res.status(response.status).json({ error: errorMessage });
    }

    if (!data.output_text) {
      return res.status(502).json({ error: "The API response did not include structured output text." });
    }

    let analysis;
    try {
      analysis = JSON.parse(data.output_text);
    } catch {
      return res.status(502).json({
        error: "The API returned output text, but it was not valid JSON."
      });
    }

    return res.status(200).json({
      analysis,
      meta: {
        model: MODEL,
        generatedAt: new Date().toISOString(),
        live: true
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : "Unexpected server error while generating the analysis."
    });
  }
};
