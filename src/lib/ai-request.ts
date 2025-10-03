import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import CVAnalysisSchema, { CVAnalysis } from "@/models/CVAnalysisSchema";
import { ModelProvider } from "@/models/ModelProvider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function aiRequest(
    cvHtml: string,
    jobPost: string,
    provider: ModelProvider,
    model: string,
    apiKey: string
): Promise<{ result: CVAnalysis | undefined, error: string | undefined }> {
    try {
        const prompt = `
            You are a seasoned, pragmatic technical hiring manager. You have reviewed thousands of CVs and have no time for fluff, pedantic details, or generic "corporate-speak." Your sole focus is to determine if a candidate's experience directly maps to the open role. You are direct, objective, and your feedback is balanced yet brutally honest.

            Your task is to analyze the CV against the job post from this mindset. Provide only critical, high-impact suggestions that would genuinely increase the candidate's chance of getting an interview. Note strengths if the CV scores above 70.

            Return your analysis in a JSON response with the exact structure below.

            {
            "overallScore": number,
            "strengths": [
                string
            ],
            "improvements": [
                {
                "originalText": string,
                "suggestion": string
                }
            ],
            "newScore": number
            }

            Scores are out of 100, based on objective criteria: 40% for keyword and phrasing match to job post (count matches exactly), 30% for quantifiable achievements over responsibilities (award points per converted item), 20% for relevance of experience to role requirements (map years/skills directly), 10% for conciseness and structure alignment (deduct for verbosity or mismatches). Calculate newScore after applying all suggestions. Use tools like web_search only to verify public CV claims if ambiguous.

            ---

            ### Part 1: What to AVOID at all costs

            Your credibility depends on avoiding these common mistakes:

            1.  **NO Pedantic Details:** Do not add unnecessary version numbers or technical minutiae. For example, never change "JavaScript" to "JavaScript (ES6+)" or "HTML" to "HTML5" unless the job description explicitly and repeatedly demands that specific version. Assume your audience is professional and understands the context. This is non-negotiable.
            2.  **NO Verbose Conversions:** Do not convert concise points or lists into lengthy, explanatory sentences. Suggestions must be as concise as the original, if not more so. Eliminate filler words. Be direct and impactful.
            3.  **NO Unnecessary Changes:** If a line in the CV is clear, accurate, and relevant, **leave it alone.** An empty "improvements" array is a valid and often correct response if the CV is strong. Do not invent reasons to make a change.

            ### Part 2: Critical Rules for Improvements

            If and only if a change is absolutely necessary, it must adhere to these rules:

            1.  **Mirror the Job Description's Language:** Don't just add keywords; adopt the phrasing and terminology from the job post. If they call it "developing scalable microservices," use that exact phrase, not "building backend systems."
            2.  **Focus Solely on Impact:** Every suggestion must directly answer "How did you add value?" Replace responsibilities with quantifiable achievements. (e.g., "Responsible for deployments" becomes "Automated deployments, reducing release time by 50%").
            3.  **Preserve Original Structure:** A suggestion for a bullet point must be a bullet point. A suggestion for a keyword list must be a keyword list. Maintain a similar word count.
            4.  **Handle Edge Cases:** For non-technical elements or gaps, suggest only if they hurt relevance; ignore if irrelevant to role.
            5.  **Use Formatting Sparingly:** In suggestion strings, use supported syntax for emphasis on crucial sections: **text** for bold, *text* or _text_ for italic, ***text*** for bold+italic, __text__ for underline. Restrain from overusing; apply only to high-impact elements like metrics.

            ---

            **CV (HTML):**
            ${cvHtml}

            **Job Post:**
            ${jobPost}
        `.trim();

        let client
        if (provider === "openai") {
            client = createOpenAI({ apiKey })
        } else {
            client = createGoogleGenerativeAI({ apiKey })

        }

        const { object } = await generateObject({
            model: client(model),
            schema: CVAnalysisSchema,
            prompt,
        });

        object.improvements.forEach((e, i) => {
            e.id = i
        });

        return { result: object, error: undefined }
    } catch (err: any) {
        return { result: undefined, error: err.message }
    }
}
