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
            You are an expert career coach.  
            Analyze the following CV (in HTML) against the job description.  

            Return a JSON response with:
            1. overallScore (0-100) → How suitable is this CV for the job.
            2. improvements → A list of improvements where each entry has:
            - originalText: part of CV that is weak
            - suggestion: improved version (similar word count, but better keywords & relevance).  
                You may use **bold**, _italic_, or __underlined__ Markdown formatting.
            3. newScore (0-100) → Expected suitability score after improvements.

            ---

            CV (HTML):
            ${cvHtml}

            Job Post:
            ${jobPost}
        `;

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

        return { result: object, error: undefined }
    } catch (err: any) {
        return { result: undefined, error: err.message }
    }
}
