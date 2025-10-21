
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { XI_BASE_URL } from '@/lib/config';

interface Document {
    id: string;
    name: string;
}

interface ComputeRagIndexDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: Document;
    apiKey: string;
    onSuccess: () => void;
}

export function ComputeRagIndexDialog({ open, onOpenChange, document, apiKey, onSuccess }: ComputeRagIndexDialogProps) {
    const [model, setModel] = useState('e5_mistral_7b_instruct');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/${document.id}/rag-index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({ model }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP Error: ${response.status}` }));
                throw new Error(errorData.detail || 'Failed to start RAG index computation.');
            }

            const result = await response.json();
            toast({
                title: 'Processing Started',
                description: `RAG indexing for "${document.name}" has begun. Status: ${result.status}.`,
            });
            onSuccess();
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compute RAG Index</DialogTitle>
                    <DialogDescription>
                        Select a model to compute the RAG index for the document "{document.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="model-select">Indexing Model</Label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger id="model-select">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="e5_mistral_7b_instruct">e5_mistral_7b_instruct</SelectItem>
                                <SelectItem value="multilingual_e5_large_instruct">multilingual_e5_large_instruct</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Starting...' : 'Start Indexing'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
