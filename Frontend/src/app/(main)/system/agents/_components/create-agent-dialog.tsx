
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { XI_BASE_URL } from '@/lib/config';
import type { Agent } from './agents-tab';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface CreateAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent?: Agent | null;
    onSuccess?: () => void;
}

export function CreateAgentDialog({ open, onOpenChange, agent, onSuccess }: CreateAgentDialogProps) {
    const [name, setName] = useState('Demo Agent');
    const [firstMessage, setFirstMessage] = useState('Hello! I’m your new AI assistant.');
    const [prompt, setPrompt] = useState('You are a helpful AI assistant specialized in customer engagement and sales support.');
    const [temperature, setTemperature] = useState(0.7);
    const [llm, setLlm] = useState('gpt-4o');
    const [language, setLanguage] = useState('en');
    const [interruptionsDisabled, setInterruptionsDisabled] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const isEditMode = !!agent;

    useEffect(() => {
        if (agent && open) {
            setName(agent.name);
            // In a real app, you would fetch full agent details here via GET /agents/{id}
            // For now, we'll use placeholder data or what's available.
            // The list endpoint doesn't provide all config details.
            setFirstMessage('Hello! I’m your updated AI assistant.');
            setPrompt('You are an expert AI assistant focused on lead engagement.');
        } else if (!agent) {
             // Reset to default for creation
            setName('Demo Agent');
            setFirstMessage('Hello! I’m your new AI assistant.');
            setPrompt('You are a helpful AI assistant specialized in customer engagement and sales support.');
            setTemperature(0.7);
            setLlm('gpt-4o');
        }
    }, [agent, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const apiKey = 'ec4e64c2b17bf057a451949c080adb9274676fd0eb166aa17b346de61bde70e3';
        
        let payload;
        let url;
        let method;

        if (isEditMode) {
            method = 'PATCH';
            url = `${XI_BASE_URL}/agents/${agent.agent_id}`;
            payload = {
              "name": name,
              "conversation_config": {
                "agent": {
                  "language": language,
                  "first_message": firstMessage,
                  "disable_first_message_interruptions": interruptionsDisabled,
                  "prompt": {
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": 600,
                    "llm": llm
                  }
                },
                "tts": {
                  "model_id": "eleven_turbo_v2",
                  "voice_id": "cjVigY5qzO86Huf0OWal",
                  "speed": 1.0,
                  "similarity_boost": 0.8
                },
                "conversation": {
                  "text_only": false,
                  "max_duration_seconds": 600
                }
              }
            };
        } else {
            method = 'POST';
            url = `${XI_BASE_URL}/agents/create`;
            payload = {
              "conversation_config": {
                "agent": {
                  "name": name,
                  "language": language,
                  "first_message": firstMessage,
                  "disable_first_message_interruptions": interruptionsDisabled
                },
                "prompt": {
                  "prompt": prompt,
                  "temperature": temperature,
                  "max_tokens": 500,
                  "llm": llm
                }
              }
            };
        }
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const responseData = await response.json().catch(() => ({ detail: `HTTP Error: ${response.status}` }));
                throw new Error(responseData.detail || `Failed to ${isEditMode ? 'update' : 'create'} voice agent.`);
            }
            
            let successMessage = `Voice Agent ${name} has been ${isEditMode ? 'updated' : 'created'}.`;
            if (!isEditMode) {
                 const responseData = await response.json();
                 successMessage += ` Agent ID: ${responseData.agent_id}`;
            }

            toast({
                title: 'Success!',
                description: successMessage,
            });

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: (error as Error).message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Voice Agent' : 'Create Voice Agent'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update the details for your voice agent.' : 'Configure and create a new ElevenLabs voice agent.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 max-h-[70vh] overflow-y-auto pr-4">
                        <fieldset className="grid gap-4 border p-4 rounded-lg">
                            <legend className="text-sm font-medium px-1">Agent Details</legend>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                            </div>
                             <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="first_message" className="text-right pt-2">First Message</Label>
                                <Textarea id="first_message" value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                 <Label htmlFor="disable-interruptions" className="text-right">Disable Interruptions</Label>
                                 <div className="col-span-3">
                                    <Switch id="disable-interruptions" checked={interruptionsDisabled} onCheckedChange={setInterruptionsDisabled} />
                                 </div>
                             </div>
                        </fieldset>
                       
                        <fieldset className="grid gap-4 border p-4 rounded-lg">
                            <legend className="text-sm font-medium px-1">Prompt Configuration</legend>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="prompt" className="text-right pt-2">System Prompt</Label>
                                <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="col-span-3" rows={5} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="llm" className="text-right">LLM</Label>
                                <Select value={llm} onValueChange={(value: string) => setLlm(value)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select LLM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="temperature" className="text-right">Temperature</Label>
                                <div className="col-span-3 flex items-center gap-3">
                                    <Slider id="temperature" min={0} max={1} step={0.1} value={[temperature]} onValueChange={(val) => setTemperature(val[0])} />
                                    <span className="text-sm font-mono w-10 text-center">{temperature.toFixed(1)}</span>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Agent'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
