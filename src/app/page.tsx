'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocxPreview } from "@/components/DocxPreview";
import docxReplaceText from "@/lib/docx-replace-text";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Textarea } from "@/components/ui/textarea";
import { ModelProvider, Models } from "@/models/ModelProvider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { aiRequest } from "@/lib/ai-request";
import { docxExtractText } from "@/lib/docx-extract-text";
import { CVAnalysis } from "@/models/CVAnalysisSchema";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

export default function ReplaceDocxPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [filePreview, setFilePreview] = useState<Blob | null>(null);
    const [font, setFont] = useState<string>("Cambria");
    const [fontSize, setFontSize] = useState<string>("10");
    const [modifiedFile, setModifiedFile] = useState<Blob | null>(null);
    const [apiKey, setApiKey] = useState("")
    const [modelProvider, setProvider] = useState<ModelProvider>("google")
    const [model, setModel] = useState(Models["google"][0])
    const [analysis, setAnalysis] = useState<CVAnalysis | undefined>()
    const [requestStatus, setRequestStatus] = useState<'loading' | 'error' | undefined>()
    const [error, setError] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFilePreview(new Blob([selectedFile], { type: selectedFile.type }));
            setModifiedFile(null);
        } else {
            setFile(null);
            setFilePreview(null);
            setModifiedFile(null);
        }
    };

    const sendToAI = async () => {
        if (!file) {
            alert("Please select a .docx file");
            return;
        }

        setRequestStatus('loading')

        const result = await aiRequest(
            await docxExtractText(file),
            jobDescription,
            modelProvider,
            model,
            apiKey
        )

        if (result.result) {
            setAnalysis(result.result)
            setRequestStatus(undefined)
        } else {
            setError(result.error || "An Error Occurred")
            setRequestStatus('error')
        }
    };

    const handleFileReplace = async () => {
        if (!file) {
            alert("Please select a .docx file");
            return;
        }

        if (!analysis || !analysis.improvements) {
            alert("There is no improvements to make")
            return
        }

        const blob = await docxReplaceText(
            file,
            analysis.improvements.reduce((p, i) => { p[i.originalText] = i.suggestion; return p }, {} as { [key: string]: string }),
            font,
            parseInt(fontSize)
        );

        setModifiedFile(blob)
    }

    const handleDownload = () => {
        if (!modifiedFile) {
            alert("No modified file to download. Please replace text first.");
            return;
        }

        const a = document.createElement("a");
        const downloadUrl = URL.createObjectURL(modifiedFile);
        a.href = downloadUrl;
        a.download = "output.docx";
        a.click();
        URL.revokeObjectURL(downloadUrl);
    };

    const handleImprovementUpdate = (key: 'originalText' | 'suggestion', improvement: CVAnalysis['improvements'][0], value: string) => {
        setAnalysis(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                improvements: prev.improvements.map(item =>
                    item.id === improvement.id
                        ? { ...item, [key]: value }
                        : item
                )
            };
        });
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="min-h-screen max-h-screen">
            <ResizablePanel defaultSize={30} className="p-3">
                <Card className="h-full overflow-y-auto">
                    <CardHeader>
                        <CardTitle className="flex justify-between align-middle">
                            <div className="h-min">Unfuck My CV</div>
                            <ThemeToggleButton />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <SelectGroup className="space-y-2">
                            <Label>Select DOCX file:</Label>
                            <Input type="file" accept=".docx" onChange={handleFileChange} />
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>Job Description</Label>
                            <Textarea
                                placeholder="Paste the job description."
                                className="h-40" value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>Font:</Label>
                            <Input
                                type="text"
                                value={font}
                                onChange={(e) => setFont(e.target.value)}
                            />
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>Font Size:</Label>
                            <Input
                                type="number"
                                value={fontSize}
                                onChange={(e) => setFontSize(e.target.value)}
                            />
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                            />
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>Provider</Label>
                            <Select
                                value={modelProvider}
                                onValueChange={(val: ModelProvider) => {
                                    setProvider(val)
                                    setModel(Models[val][0])
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="google">Google Gemini</SelectItem>
                                </SelectContent>
                            </Select>
                        </SelectGroup>

                        <SelectGroup className="space-y-2">
                            <Label>Model</Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Models[modelProvider].map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SelectGroup>

                        <div className="flex gap-3 justify-end">
                            <Button onClick={sendToAI}>Send to AI</Button>
                        </div>

                        {requestStatus == "loading" && (
                            <div className="w-full flex justify-center my-5"><Spinner variant="circle" /></div>
                        )}

                        {requestStatus == "error" && (
                            <p className="text-red-700">{error}</p>
                        )}

                        {analysis && (
                            <div className="flex items-center gap-3 my-5">
                                <div className="grid place-items-center flex-1 font-mono">
                                    <div className="text-6xl">
                                        {analysis.overallScore}%
                                    </div>
                                    <div>Old Score</div>
                                </div>
                                <i>east</i>
                                <div className="grid place-items-center flex-1 font-mono">
                                    <div className="text-6xl">
                                        {analysis.newScore}%
                                    </div>
                                    <div>New Score</div>
                                </div>
                            </div>
                        )}

                        {analysis && (
                            <div>
                                <Label className="mb-3">Replacements</Label>
                                <div className="text-xs text-red-500">Original</div>
                                <div className="text-xs text-green-500">Suggestion</div>
                                <p className="whitespace-pre-wrap font-mono text-sm">
                                    {`Supported syntax:
- **text** → Bold
- *text* or _text_ → Italic
- ***text*** → Bold + Italic
- __text__ → Underline`}
                                </p>
                            </div>
                        )}
                        <div className="space-y-15">
                            {analysis?.improvements && analysis.improvements.map((imp) => (
                                <div key={imp.id} className="space-y-3">
                                    <Textarea
                                        className="bg-red-50 dark:border-red-800 dark:border-3 h-30"
                                        value={imp.originalText}
                                        onChange={(e) => handleImprovementUpdate('originalText', imp, e.target.value)} />
                                    <Textarea
                                        className="bg-green-50 dark:border-green-800 dark:border-3 h-30"
                                        value={imp.suggestion}
                                        onChange={(e) => handleImprovementUpdate('suggestion', imp, e.target.value)} />
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setAnalysis(prev => (prev ? {
                                                    ...prev,
                                                    improvements: prev.improvements.filter(
                                                        (item) => item.id !== imp.id
                                                    ),
                                                } : undefined))
                                            }}>
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            )).concat((
                                <div className="space-y-3" key="action-buttons">
                                    <Button variant="outline" className="w-full" onClick={handleFileReplace}>
                                        Apply Changes
                                    </Button>
                                    <Button className="w-full" onClick={handleDownload}>
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={70}>
                <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={40} className="p-3">
                        <div className="flex justify-between flex-wrap">
                            <h2 className="text-lg font-semibold mb-4">Original</h2>
                            <p className="text-xs">*The preview may not be fully accurate</p>
                        </div>
                        <div className="max-h-full border rounded-md p-2 overflow-auto">
                            {filePreview ? (
                                <DocxPreview file={filePreview} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Upload a file to see the preview
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={60} className="p-3">
                        <h2 className="text-lg font-semibold mb-4">Modified</h2>
                        <div className="max-h-full border rounded-md p-2 overflow-auto">
                            {modifiedFile ? (
                                <DocxPreview file={modifiedFile} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Replace text to see the preview
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
