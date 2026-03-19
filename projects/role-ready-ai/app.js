const form = document.getElementById("analysisForm");
const analyzeButton = document.getElementById("analyzeButton");
const demoButton = document.getElementById("demoButton");
const clearButton = document.getElementById("clearButton");
const previewBanner = document.getElementById("previewBanner");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");
const statusPill = document.getElementById("statusPill");
const scoreRing = document.getElementById("scoreRing");

const fields = {
  jobTitle: document.getElementById("jobTitle"),
  companyName: document.getElementById("companyName"),
  focusMode: document.getElementById("focusMode"),
  candidateLevel: document.getElementById("candidateLevel"),
  resumeText: document.getElementById("resumeText"),
  jobDescription: document.getElementById("jobDescription"),
};

const output = {
  fitScoreValue: document.getElementById("fitScoreValue"),
  roleMeta: document.getElementById("roleMeta"),
  companyMeta: document.getElementById("companyMeta"),
  decisionMeta: document.getElementById("decisionMeta"),
  summaryHeadline: document.getElementById("summaryHeadline"),
  summaryText: document.getElementById("summaryText"),
  generatedMeta: document.getElementById("generatedMeta"),
  candidatePitch: document.getElementById("candidatePitch"),
  recruiterTake: document.getElementById("recruiterTake"),
  strengthsList: document.getElementById("strengthsList"),
  gapsList: document.getElementById("gapsList"),
  rewritesList: document.getElementById("rewritesList"),
  questionsList: document.getElementById("questionsList"),
  prepPlanList: document.getElementById("prepPlanList"),
};

const isGithubPages = window.location.hostname.endsWith("github.io");

const demoInputs = {
  jobTitle: "Software Engineer Intern",
  companyName: "Ramp",
  focusMode: "recruiter",
  candidateLevel: "internship",
  resumeText: `Labib Hasan
Virginia Tech Computer Science major with a Cyber Security minor graduating in December 2026.

Experience
- Software Development Intern, SavvyTechGirl, Summer 2025
  Built production-facing pages, implemented UI updates, and improved delivery quality in a fast-moving environment.
- AI Intern, Outlier AI, June 2024 to January 2025
  Reviewed large volumes of code and technical responses for correctness, quality, and clarity.
- QA and UX Intern, IDoxSolutions, 2021 and 2022
  Executed UI testing, API validation, and QA workflows across product releases.

Projects
- Browser-playable Python Dodge Game with collision logic, scaling difficulty, and persistent scoring.
- Browser-playable Python Space Shooter with hull tracking, level progression, and power-up mechanics.
- Palindrome tutorial video explaining Python logic clearly for beginner audiences.

Skills
Python, Java, JavaScript, TypeScript, React, Svelte, SQL, Docker, AWS EC2, Postman, GitHub, Azure DevOps, Linux`,
  jobDescription: `Ramp is hiring a Software Engineer Intern to work across product engineering teams. Interns build
production features, improve internal tools, and ship high-quality code in collaboration with engineers, product, and
design. Strong candidates show ownership, learn quickly, communicate clearly, and are comfortable with modern backend
or frontend development. Bonus points for experience with APIs, testing, data-driven product work, and AI-powered
developer workflows.`,
};

const demoResult = {
  analysis: {
    role_title: "Software Engineer Intern",
    company_name: "Ramp",
    fit_score: 84,
    decision: "Competitive early-career candidate with strong practical range",
    summary: "Labib reads as a credible internship candidate because the profile combines shipped UI work, QA depth, API validation, and recent AI-focused evaluation work. The strongest story is not raw years of experience, but the combination of delivery, testing discipline, and communication across different technical contexts.",
    candidate_pitch: "Virginia Tech CS student with internship experience across software delivery, QA automation, API validation, and AI-assisted code review. Best positioned as an engineer who can ramp quickly, communicate clearly, and contribute across product quality and implementation work.",
    recruiter_take: "The profile stands out when framed around shipping production pages, reviewing code quality at scale, and building interactive side projects that show ownership outside classwork. The main weakness is that the resume should make technical impact more measurable and tie projects more directly to engineering decisions.",
    strengths: [
      {
        title: "Real internship signal",
        detail: "Multiple internships reduce the risk that the resume reads like classroom-only experience."
      },
      {
        title: "Cross-functional software exposure",
        detail: "SavvyTechGirl, Outlier AI, and IDoxSolutions together suggest product delivery, quality assurance, and technical review experience."
      },
      {
        title: "Strong project presentation",
        detail: "The playable Python games show initiative, user-facing thinking, and an ability to turn small codebases into polished demos."
      },
      {
        title: "Communication advantage",
        detail: "The tutorial-style project and code review work support the idea that Labib can explain technical decisions clearly."
      }
    ],
    gaps: [
      {
        title: "Impact metrics are light",
        detail: "Several bullets describe responsibilities but not measurable outcomes, quality improvements, or scope.",
        fix: "Add numbers around pages shipped, bugs found, tests written, review volume, or time saved."
      },
      {
        title: "Backend ownership is implied more than proven",
        detail: "The resume references APIs and validation, but it does not yet show one strong end-to-end full-stack build.",
        fix: "Lead with an API-powered app and explain the request flow, data validation, and deployment path."
      },
      {
        title: "Project framing is still skill-first",
        detail: "The games are interesting, but they should read like systems design examples rather than just student practice.",
        fix: "Highlight mechanics, state management, progression systems, and deployment choices."
      }
    ],
    rewritten_bullets: [
      {
        original: "Built production-facing pages and implemented UI updates at SavvyTechGirl.",
        improved: "Built and shipped production-facing web pages at SavvyTechGirl, translating product requirements into polished UI updates that improved release readiness and presentation quality.",
        why_it_works: "This version sounds closer to shipped software work and makes the ownership clearer."
      },
      {
        original: "Reviewed code and technical responses at Outlier AI.",
        improved: "Reviewed high-volume code and technical responses at Outlier AI, identifying correctness issues and improving the clarity of model-generated engineering outputs.",
        why_it_works: "This creates a stronger link to AI workflows and technical quality judgment."
      },
      {
        original: "Built a Python space shooter project.",
        improved: "Built and deployed a browser-playable space shooter from an original Python project, adding hull tracking, level progression, power-ups, and a more complete gameplay state model.",
        why_it_works: "This reframes the project as a systems build with implementation depth."
      }
    ],
    interview_questions: [
      {
        question: "Tell me about a time you had to improve software quality before release.",
        why_it_matters: "The resume has strong QA and review signal, so interviewers will test whether that experience translates into engineering judgment.",
        talking_points: [
          "Describe the release context and what could have gone wrong.",
          "Explain the test or review process you used.",
          "Show how you communicated findings and what changed afterward."
        ]
      },
      {
        question: "What did you learn from building your playable game projects beyond Python syntax?",
        why_it_matters: "A good answer turns student projects into evidence of design thinking and engineering maturity.",
        talking_points: [
          "Discuss event loops, collision detection, and game-state management.",
          "Explain how you iterated the mechanics to make the experience feel complete.",
          "Connect the project work to user-facing product thinking."
        ]
      },
      {
        question: "Why are you interested in a product engineering internship at Ramp?",
        why_it_matters: "The role values ownership and shipping; you need a crisp story that connects your past work to that environment.",
        talking_points: [
          "Mention fast product iteration and real business impact.",
          "Tie your mix of development and quality experience to shipping reliable features.",
          "Show interest in modern AI-assisted engineering workflows."
        ]
      }
    ],
    prep_plan: [
      { day: "Day 1", focus: "Resume tightening", action: "Replace weak responsibility bullets with measurable delivery and quality outcomes." },
      { day: "Day 2", focus: "Project positioning", action: "Rewrite project summaries around systems, tradeoffs, and deployment rather than just languages used." },
      { day: "Day 3", focus: "Behavioral stories", action: "Prepare two concise stories on shipping work, one on QA judgment, and one on learning quickly." },
      { day: "Day 4", focus: "Technical interview prep", action: "Review data structures fundamentals plus one backend request-response flow you can explain clearly." },
      { day: "Day 5", focus: "AI product angle", action: "Practice explaining how this OpenAI-powered app handles validation, structured output, and deployment." },
      { day: "Day 6", focus: "Company alignment", action: "Map your strongest experiences directly to the company’s product culture and job requirements." },
      { day: "Day 7", focus: "Mock screen", action: "Run a 20-minute mock recruiter screen using the generated pitch and interview questions." }
    ]
  },
  meta: {
    model: "demo-preview",
    generatedAt: "2026-03-18T20:30:00.000Z",
    live: false
  }
};

const setStatus = (label, tone) => {
  statusPill.textContent = label;
  statusPill.className = `status-pill ${tone}`;
};

const showBanner = (message) => {
  previewBanner.textContent = message;
  previewBanner.classList.remove("hidden");
};

const hideBanner = () => {
  previewBanner.textContent = "";
  previewBanner.classList.add("hidden");
};

const createElement = (tagName, className, textContent) => {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
};

const renderStrengths = (items) => {
  output.strengthsList.replaceChildren();
  items.forEach((item) => {
    const card = createElement("article", "stack-item");
    card.append(createElement("h5", "", item.title), createElement("p", "", item.detail));
    output.strengthsList.append(card);
  });
};

const renderGaps = (items) => {
  output.gapsList.replaceChildren();
  items.forEach((item) => {
    const card = createElement("article", "stack-item");
    card.append(
      createElement("h5", "", item.title),
      createElement("p", "", item.detail),
      createElement("div", "stack-fix", `Fix: ${item.fix}`)
    );
    output.gapsList.append(card);
  });
};

const renderRewrites = (items) => {
  output.rewritesList.replaceChildren();
  items.forEach((item) => {
    const card = createElement("article", "rewrite-card");
    const improvedWrap = createElement("div", "rewrite-copy");
    improvedWrap.append(
      createElement("span", "rewrite-label", "Improved Version"),
      createElement("h5", "", item.improved),
      createElement("p", "", item.why_it_works)
    );

    card.append(createElement("div", "rewrite-original", item.original), improvedWrap);
    output.rewritesList.append(card);
  });
};

const renderQuestions = (items) => {
  output.questionsList.replaceChildren();
  items.forEach((item) => {
    const card = createElement("article", "question-card");
    const list = createElement("ul", "talking-points");
    item.talking_points.forEach((point) => {
      list.append(createElement("li", "", point));
    });

    card.append(createElement("h5", "", item.question), createElement("p", "", item.why_it_matters), list);
    output.questionsList.append(card);
  });
};

const renderPrepPlan = (items) => {
  output.prepPlanList.replaceChildren();
  items.forEach((item) => {
    const card = createElement("article", "timeline-card");
    card.append(
      createElement("span", "timeline-day", item.day),
      createElement("h5", "", item.focus),
      createElement("p", "", item.action)
    );
    output.prepPlanList.append(card);
  });
};

const formatTimestamp = (isoString, live) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return live ? "Live analysis" : "Demo preview";
  }

  return `${live ? "Live analysis" : "Demo preview"} • ${date.toLocaleString()}`;
};

const renderResults = ({ analysis, meta }) => {
  emptyState.classList.add("hidden");
  resultsContent.classList.remove("hidden");

  const score = Math.max(0, Math.min(100, Number(analysis.fit_score) || 0));
  scoreRing.style.setProperty("--ring-angle", `${Math.round((score / 100) * 360)}deg`);
  output.fitScoreValue.textContent = String(score);
  output.roleMeta.textContent = analysis.role_title || "Role";
  output.companyMeta.textContent = analysis.company_name || "Company";
  output.decisionMeta.textContent = analysis.decision || "Assessment";
  output.summaryHeadline.textContent =
    score >= 80 ? "Strong recruiting case" : score >= 65 ? "Promising, but needs tightening" : "Needs stronger positioning";
  output.summaryText.textContent = analysis.summary;
  output.generatedMeta.textContent = formatTimestamp(meta.generatedAt, meta.live);
  output.candidatePitch.textContent = analysis.candidate_pitch;
  output.recruiterTake.textContent = analysis.recruiter_take;

  renderStrengths(analysis.strengths);
  renderGaps(analysis.gaps);
  renderRewrites(analysis.rewritten_bullets);
  renderQuestions(analysis.interview_questions);
  renderPrepPlan(analysis.prep_plan);
};

const setLoadingState = (loading) => {
  analyzeButton.disabled = loading;
  demoButton.disabled = loading;
  clearButton.disabled = loading;
  analyzeButton.textContent = loading ? "Analyzing..." : "Analyze With AI";
};

const collectPayload = () => ({
  jobTitle: fields.jobTitle.value.trim(),
  companyName: fields.companyName.value.trim(),
  focusMode: fields.focusMode.value,
  candidateLevel: fields.candidateLevel.value,
  resumeText: fields.resumeText.value.trim(),
  jobDescription: fields.jobDescription.value.trim()
});

const applyDemoInputs = () => {
  fields.jobTitle.value = demoInputs.jobTitle;
  fields.companyName.value = demoInputs.companyName;
  fields.focusMode.value = demoInputs.focusMode;
  fields.candidateLevel.value = demoInputs.candidateLevel;
  fields.resumeText.value = demoInputs.resumeText;
  fields.jobDescription.value = demoInputs.jobDescription;
};

const resetResults = () => {
  emptyState.classList.remove("hidden");
  resultsContent.classList.add("hidden");
  scoreRing.style.setProperty("--ring-angle", "0deg");
};

const clearForm = () => {
  form.reset();
  hideBanner();
  resetResults();
  setStatus("Ready", "neutral");
};

const validatePayload = (payload) => {
  if (!payload.resumeText || !payload.jobDescription) {
    return "Paste both the resume text and the job description before running the analysis.";
  }
  if (payload.resumeText.length < 80) {
    return "The resume text is too short to produce a useful analysis.";
  }
  if (payload.jobDescription.length < 80) {
    return "The job description is too short to produce a useful analysis.";
  }
  return "";
};

const runDemo = (message, hydrateInputs = true) => {
  if (hydrateInputs) {
    applyDemoInputs();
  }
  renderResults(demoResult);
  setStatus("Demo Loaded", "warning");
  if (message) {
    showBanner(message);
  }
};

const runLiveAnalysis = async (payload) => {
  const response = await fetch("/api/role-ready", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The analysis request failed.");
  }

  return data;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideBanner();

  const payload = collectPayload();
  const validationError = validatePayload(payload);
  if (validationError) {
    setStatus("Needs Input", "warning");
    showBanner(validationError);
    return;
  }

  try {
    setLoadingState(true);
    setStatus("Running", "loading");
    const data = await runLiveAnalysis(payload);
    renderResults(data);
    setStatus("Live Analysis", "success");
  } catch (error) {
    if (isGithubPages) {
      runDemo("This GitHub Pages preview cannot run the serverless API route. Demo output is shown here; deploy the repo on Vercel with OPENAI_API_KEY for live analysis.", false);
    } else {
      setStatus("Error", "error");
      showBanner(error.message || "Unable to complete the analysis.");
    }
  } finally {
    setLoadingState(false);
  }
});

demoButton.addEventListener("click", () => {
  hideBanner();
  runDemo("Loaded the built-in demo scenario so the interface can be reviewed without an API key.");
});

clearButton.addEventListener("click", clearForm);

if (isGithubPages) {
  runDemo("This page is running on GitHub Pages, so it loads a demo analysis by default. The same UI uses the live OpenAI backend when deployed on Vercel.");
}
