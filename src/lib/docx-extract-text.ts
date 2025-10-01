import mammoth from "mammoth";

export async function extractHtmlFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    return value;

}
