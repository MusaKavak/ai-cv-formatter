import { z } from "zod";

const CVAnalysisSchema = z.object({
    overallScore: z.number().min(0).max(100),
    improvements: z.array(
        z.object({
            id: z.number(),
            originalText: z.string(),
            suggestion: z.string(), // can include **bold**, _italic_, __underlined__
        })
    ),
    newScore: z.number().min(0).max(100),
});

export type CVAnalysis = z.infer<typeof CVAnalysisSchema>

export default CVAnalysisSchema