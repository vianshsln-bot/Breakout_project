
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Trash2, Eye, EyeOff, PlusCircle } from 'lucide-react';
import { XI_API_KEY, setXiApiKey } from '@/lib/config';

interface Secret {
    id: string;
    key: string;
    value: string;
}

export function WorkspaceSettingsTab() {
    const [workspaceName, setWorkspaceName] = useState('My AI Workspace');
    const [autoIndex, setAutoIndex] = useState(true);
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState(XI_API_KEY);
    const [revealed, setRevealed] = useState(false);
    const { toast } = useToast();

    const handleSaveChanges = () => {
        setXiApiKey(elevenLabsApiKey);
        toast({
            title: "Settings Saved",
            description: "Your workspace settings have been updated.",
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input id="workspace-name" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <Label htmlFor="auto-index-rag" className="font-medium">
                                Auto-index RAG
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Automatically compute RAG index after document creation.
                            </p>
                        </div>
                        <Switch id="auto-index-rag" checked={autoIndex} onCheckedChange={setAutoIndex} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Secrets & Keys</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">Manage API keys and other secrets for your workspace.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-4">
                            <KeyRound className="w-5 h-5 text-gray-500" />
                            <div>
                                <p className="font-medium text-gray-900">ELEVENLABS_API_KEY</p>
                                <Input
                                    type={revealed ? 'text' : 'password'}
                                    value={elevenLabsApiKey}
                                    onChange={(e) => setElevenLabsApiKey(e.target.value)}
                                    className="font-mono text-sm text-gray-600"
                                />
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setRevealed(!revealed)}>
                            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </div>
    );
}
