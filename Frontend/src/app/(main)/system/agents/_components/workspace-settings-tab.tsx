
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Trash2, Eye, EyeOff, PlusCircle } from 'lucide-react';

interface Secret {
    id: string;
    key: string;
    value: string;
}

export function WorkspaceSettingsTab() {
    const [workspaceName, setWorkspaceName] = useState('My AI Workspace');
    const [autoIndex, setAutoIndex] = useState(true);
    const [secrets, setSecrets] = useState<Secret[]>([
        { id: 'sec-1', key: 'ELEVENLABS_API_KEY', value: 'sk_xxxxxxxxxxxxxxxxxxxx' },
        { id: 'sec-2', key: 'OPENAI_API_KEY', value: 'sk_xxxxxxxxxxxxxxxxxxxx' },
    ]);
    const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your workspace settings have been updated.",
        });
    };

    const toggleReveal = (id: string) => {
        setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Secrets &amp; Keys</CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">Manage API keys and other secrets for your workspace.</p>
                    </div>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Secret</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {secrets.map(secret => (
                         <div key={secret.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center gap-4">
                                <KeyRound className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">{secret.key}</p>
                                    <p className="font-mono text-sm text-gray-600">
                                        {revealedSecrets[secret.id] ? secret.value : '••••••••••••••••••••'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => toggleReveal(secret.id)}>
                                    {revealedSecrets[secret.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </div>
    );
}
