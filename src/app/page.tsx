'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DocxPreview } from "@/components/DocxPreview";
import docxReplaceText from "@/lib/docx-replace-text";

export default function ReplaceDocxPage() {
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<Blob | null>(null);
    const [findText, setFindText] = useState<string>("");
    const [replaceText, setReplaceText] = useState<string>("");
    const [modifiedFile, setModifiedFile] = useState<Blob | null>(null);

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

        const blob = await docxReplaceText(file, findText, replaceText, "Cambria", 10)


        setModifiedFile(blob);
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
        <div className="flex h-screen">
            <div className="w-1/3 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload and Replace Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label>Select DOCX file:</label>
                            <Input type="file" accept=".docx" onChange={handleFileChange} />
                        </div>
                        <div>
                            <label>Find:</label>
                            <Input
                                type="text"
                                value={findText}
                                onChange={(e) => setFindText(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label>Replace with:</label>
                            <Input
                                type="text"
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleReplace}>Replace</Button>
                        <Button onClick={handleDownload} disabled={!modifiedFile}>Download</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="w-2/3 flex p-4 border-l">
                <div className="w-1/2 pr-2">
                    <h2 className="text-lg font-semibold mb-4">Original</h2>
                    <div className="h-full border rounded-md p-2">
                        {filePreview ? (
                            <DocxPreview file={filePreview} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Upload a file to see the preview
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-1/2 pl-2">
                    <h2 className="text-lg font-semibold mb-4">Modified</h2>
                    <div className="h-full border rounded-md p-2">
                        {modifiedFile ? (
                            <DocxPreview file={modifiedFile} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Replace text to see the preview
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
