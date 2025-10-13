
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { XI_BASE_URL } from '@/lib/config';

interface Document {
    id: string;
    name: string;
}

interface EditDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: Document;
    onSuccess: () => void;
}

export function EditDocumentDialog({ open, onOpenChange, document, onSuccess }: EditDocumentDialogProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const apiKey = 'ec4e64c2b17bf057a451949c080adb9274676fd0eb166aa17b346de61bde70e3';

    useEffect(() => {
        if (document) {
            setName(document.name);
        }
    }, [document]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/${document.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP Error: ${response.status}` }));
                throw new Error(errorData.detail || 'Failed to update the document.');
            }

            toast({
                title: 'Success!',
                description: 'Document name updated successfully.',
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
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Document Name</DialogTitle>
                        <DialogDescription>
                            Update the name of your knowledge base document.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
