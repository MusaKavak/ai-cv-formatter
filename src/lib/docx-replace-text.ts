import JSZip from 'jszip';
import { parseStringPromise, Builder } from 'xml2js';

/**
 * Represents a text segment with optional formatting properties
 */
interface TextFormat {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;      // Hex color without #, e.g., "FF0000" for red
    fontSize?: number;   // Font size in half-points (24 = 12pt)
    highlight?: string;  // Highlight color name, e.g., "yellow"
    fontFamily?: string; // Font name, e.g., "Arial", "Times New Roman"
}

/**
 * Parses Markdown-style formatting into TextFormat segments
 * 
 * Supported syntax:
 * - **text** or ***text*** → Bold
 * - *text* or _text_ → Italic
 * - ***text*** → Bold + Italic
 * - __text__ → Underline
 * - `text` → Colored text (blue)
 * 
 * @param text - Markdown-formatted string
 * @returns Array of formatted text segments
 */
function parseMarkdown(text: string): TextFormat[] {
    const segments: TextFormat[] = [];

    // Regex breakdown:
    // \*\*\*(.+?)\*\*\* - Bold + Italic (***text***)
    // \*\*(.+?)\*\*     - Bold (**text**)
    // \*(.+?)\*         - Italic (*text*)
    // __(.+?)__         - Underline (__text__)
    // _(.+?)_           - Italic (_text_)
    // `(.+?)`           - Code/colored (`text`)
    // ([^*_`]+)         - Plain text
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_|`(.+?)`|([^*_`]+))/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match[2]) {
            // ***bold italic***
            segments.push({ text: match[2], bold: true, italic: true });
        } else if (match[3]) {
            // **bold**
            segments.push({ text: match[3], bold: true });
        } else if (match[4]) {
            // *italic*
            segments.push({ text: match[4], italic: true });
        } else if (match[5]) {
            // __underline__
            segments.push({ text: match[5], underline: true });
        } else if (match[6]) {
            // _italic_
            segments.push({ text: match[6], italic: true });
        } else if (match[7]) {
            // `code` (rendered as blue text)
            segments.push({ text: match[7], color: "0000FF" });
        } else if (match[8]) {
            // plain text
            segments.push({ text: match[8] });
        }
    }

    return segments;
}

/**
 * Converts TextFormat objects into DOCX run structures
 * 
 * A "run" in DOCX is a segment of text with consistent formatting.
 * Each run can have properties like bold, italic, color, etc.
 * 
 * @param formats - Array of text segments with formatting
 * @returns Array of DOCX run objects in xml2js format
 */
function createFormattedRuns(formats: TextFormat[]): any[] {
    return formats.map(format => {
        // Base run structure with text content
        const run: any = {
            "w:t": [{
                _: format.text,
                $: { "xml:space": "preserve" } // Preserve spaces
            }]
        };

        // Build formatting properties object
        const props: any = {};

        if (format.bold) {
            props["w:b"] = [{}]; // Bold
        }
        if (format.italic) {
            props["w:i"] = [{}]; // Italic
        }
        if (format.underline) {
            props["w:u"] = [{ $: { "w:val": "single" } }]; // Single underline
        }
        if (format.color) {
            props["w:color"] = [{ $: { "w:val": format.color } }]; // Text color
        }
        if (format.fontSize) {
            props["w:sz"] = [{ $: { "w:val": (format.fontSize * 2).toString() } }]; // Font size
        }
        if (format.highlight) {
            props["w:highlight"] = [{ $: { "w:val": format.highlight } }]; // Highlight color
        }
        if (format.fontFamily) {
            props["w:rFonts"] = [{
                $: {
                    "w:ascii": format.fontFamily,
                    "w:hAnsi": format.fontFamily,
                    "w:cs": format.fontFamily
                }
            }]; // Font family
        }

        // Only add run properties if there are any formatting options
        if (Object.keys(props).length > 0) {
            run["w:rPr"] = [props];
        }

        return run;
    });
}

/**
 * Recursively walks through the document structure to find paragraphs
 * 
 * @param node - Current node in the document tree
 * @param processCallback - Function to call when a paragraph is found
 */
function walkParagraphs(node: any, processCallback: (paragraph: any) => void): void {
    if (node == null || typeof node !== "object") return;

    for (const key of Object.keys(node)) {
        const child = node[key];

        // Found a paragraph element
        if (key === "w:p" && Array.isArray(child)) {
            child.forEach(paragraph => {
                processCallback(paragraph);
            });
        }

        // Continue walking the tree
        if (Array.isArray(child)) {
            child.forEach(c => walkParagraphs(c, processCallback));
        } else {
            walkParagraphs(child, processCallback);
        }
    }
}

/**
 * Extracts all text content from a paragraph's runs
 * 
 * @param runs - Array of run objects from a paragraph
 * @returns Concatenated text from all runs
 */
function extractTextFromRuns(runs: any[]): string {
    let fullText = "";

    runs.forEach(run => {
        if (run["w:t"]) {
            const textNodes = Array.isArray(run["w:t"])
                ? run["w:t"]
                : [run["w:t"]];

            textNodes.forEach(tNode => {
                const text = typeof tNode === "string" ? tNode : tNode._;
                if (text) {
                    fullText += text;
                }
            });
        }
    });

    return fullText;
}

/**
 * Processes a single paragraph to find and replace text with formatting
 * 
 * @param paragraph - Paragraph object to process
 * @param find - Text to search for
 * @param replacementFormats - Formatted segments to replace with
 */
function processParagraph(
    paragraph: any,
    find: string,
    replacementFormats: TextFormat[]
): void {
    // Skip paragraphs without runs
    if (!paragraph["w:r"]) return;

    // Normalize runs to array
    const runs = Array.isArray(paragraph["w:r"])
        ? paragraph["w:r"]
        : [paragraph["w:r"]];

    // Extract all text from the paragraph
    const fullText = extractTextFromRuns(runs);

    // Skip if search text not found
    if (!fullText.includes(find)) return;

    // Split text into segments around the search term
    // e.g., "Hello World Hello" with find="Hello" → ["", " World ", ""]
    const parts = fullText.split(find);
    const newRuns: any[] = [];

    // Get original formatting from first run (to preserve base style)
    const originalFormat = runs[0] && runs[0]["w:rPr"]
        ? runs[0]["w:rPr"][0]
        : null;

    parts.forEach((part, idx) => {
        // Add text segment with original formatting
        if (part) {
            newRuns.push({
                ...(originalFormat && { "w:rPr": [originalFormat] }),
                "w:t": [{
                    _: part,
                    $: { "xml:space": "preserve" }
                }]
            });
        }

        // Add formatted replacement between segments (not after last segment)
        if (idx < parts.length - 1) {
            newRuns.push(...createFormattedRuns(replacementFormats));
        }
    });

    // Replace paragraph runs with new formatted runs
    paragraph["w:r"] = newRuns;
}

/**
 * Replaces text in a DOCX file with Markdown-formatted content
 * 
 * This function:
 * 1. Opens the DOCX file (which is a ZIP archive)
 * 2. Extracts and parses the document.xml file
 * 3. Searches for the specified text in all paragraphs
 * 4. Replaces found text with formatted segments
 * 5. Rebuilds and returns the modified DOCX
 * 
 * @param file - Input DOCX file
 * @param find - Text to search for (case-sensitive)
 * @param replace - Markdown-formatted replacement text
 * @param fontFamily - Optional font family to apply to all replacement text (e.g., "Arial", "Times New Roman")
 * @param fontSize - Optional font size to apply to all replacement text (e.g., 10, 32)
 * @returns Promise resolving to modified DOCX as Blob
 * 
 * @example
 * ```typescript
 * const docx = await docxReplaceText(
 *     file, 
 *     "Hello", 
 *     "**Bold** and *italic* text",
 *     "Arial",
 *     10
 * );
 * ```
 */
async function docxReplaceText(
    file: File,
    find: string,
    replace: string,
    fontFamily?: string,
    fontSize?: number
): Promise<Blob> {
    // Step 1: Read the DOCX file as a ZIP archive
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Step 2: Extract the main document XML
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) {
        throw new Error("Invalid DOCX: missing document.xml");
    }

    // Step 3: Parse XML to JavaScript object
    const docObj = await parseStringPromise(docXml);

    // Step 4: Parse the markdown replacement text
    const replacementFormats = parseMarkdown(replace);

    // Apply font family to all segments if specified
    if (fontFamily) {
        replacementFormats.forEach(format => {
            format.fontFamily = fontFamily;
        });
    }

    // Apply font size to all segments if specified
    if (fontSize) {
        replacementFormats.forEach(format => {
            format.fontSize = fontSize;
        });
    }

    // Step 5: Walk through all paragraphs and perform replacements
    walkParagraphs(docObj, (paragraph) => {
        processParagraph(paragraph, find, replacementFormats);
    });

    // Step 6: Convert modified object back to XML
    const builder = new Builder();
    const newXml = builder.buildObject(docObj);

    // Step 7: Update the document.xml in the ZIP archive
    zip.file("word/document.xml", newXml);

    // Step 8: Generate and return the new DOCX file
    const newBlob = await zip.generateAsync({ type: "blob" });
    return newBlob;
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Basic usage
const modifiedDocx = await docxReplaceText(
    myFile, 
    "Hello World", 
    "**Bold** text"
);

// Multiple formats
const docx = await docxReplaceText(
    myFile,
    "Replace me",
    "**Bold**, *italic*, __underlined__, `colored`, and [Comic Sans MS:fun text]"
);

// Complex formatting with custom fonts
const result = await docxReplaceText(
    myFile,
    "Status",
    "[Arial:Status:] ***Important*** - System is __operational__"
);

// Different fonts in same replacement
const mixed = await docxReplaceText(
    myFile,
    "Hello",
    "[Times New Roman:Formal] and [Courier New:Technical]"
);
*/

export default docxReplaceText