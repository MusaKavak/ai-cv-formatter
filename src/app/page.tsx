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

export default function ReplaceDocxPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [filePreview, setFilePreview] = useState<Blob | null>(null);
    const [findText, setFindText] = useState<string>("");
    const [replaceText, setReplaceText] = useState<string>("");
    const [font, setFont] = useState<string>("Cambria");
    const [fontSize, setFontSize] = useState<string>("10");
    const [modifiedFile, setModifiedFile] = useState<Blob | null>(null);
    const [apiKey, setApiKey] = useState("")
    const [modelProvider, setProvider] = useState<ModelProvider>("openai")
    const [model, setModel] = useState(Models["openai"][0])

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

    const handleReplace = async () => {
        if (!file) {
            alert("Please select a .docx file");
            return;
        }

        const result = await aiRequest(
            await docxExtractText(file),
            jobDescription,
            modelProvider,
            model,
            apiKey
        )

        console.log(result)

        // const replacements = { [findText]: replaceText };
        // const blob = await docxReplaceText(file, replacements, font, parseInt(fontSize));

        // setModifiedFile(blob);
    };

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

    return (
        <ResizablePanelGroup direction="horizontal" className="min-h-screen">
            <ResizablePanel defaultSize={30} className="p-3">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Upload and Replace Text</CardTitle>
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
                            <Button onClick={handleReplace}>Replace</Button>
                            <Button onClick={handleDownload} disabled={!modifiedFile}>Download</Button>
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
                            <p className="text-xs">*The preview may not be correct</p>
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
