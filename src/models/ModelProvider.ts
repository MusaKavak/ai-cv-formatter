export type ModelProvider = "openai" | "google"

export const Models: Record<ModelProvider, string[]> = {
    openai: ["gpt-4o-mini", "gpt-4.1", "gpt-3.5-turbo"],
    google: ["gemini-2.5-pro", "models/gemini-2.5-flash"],
}