
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { PhoneNumber } from './phone-numbers-tab';

interface CreatePhoneNumberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phoneNumber?: PhoneNumber | null;
    onSuccess?: () => void;
}

export function CreatePhoneNumberDialog({ open, onOpenChange, phoneNumber, onSuccess }: CreatePhoneNumberDialogProps) {
    const [number, setNumber] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [capabilities, setCapabilities] = useState({ voice: false, sms: false, mms: false });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (phoneNumber) {
            setNumber(phoneNumber.number);
            setAssignedTo(phoneNumber.assignedTo || '');
            setCapabilities({
                voice: phoneNumber.capabilities.includes('voice'),
                sms: phoneNumber.capabilities.includes('sms'),
                mms: phoneNumber.capabilities.includes('mms'),
            });
        } else {
            setNumber('');
            setAssignedTo('');
            setCapabilities({ voice: true, sms: true, mms: false });
        }
    }, [phoneNumber, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: 'Success!',
            description: `Phone number ${phoneNumber ? 'updated' : 'added'}.`,
        });

        setIsSubmitting(false);
        onSuccess?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{phoneNumber ? 'Edit Phone Number' : 'Add Phone Number'}</DialogTitle>
                        <DialogDescription>
                            Manage a phone number for your agents.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="number">Phone Number</Label>
                            <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+1 (555) 000-0000" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Assigned Agent (Optional)</Label>
                            <Input id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="AI Agent 1" />
                        </div>
                        <div className="space-y-2">
                            <Label>Capabilities</Label>
                            <div className="flex gap-4 pt-2">
                                {Object.keys(capabilities).map(key => (
                                    <div key={key} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={key} 
                                            checked={capabilities[key as keyof typeof capabilities]}
                                            onCheckedChange={(checked) => setCapabilities(c => ({...c, [key]: checked}))}
                                        />
                                        <Label htmlFor={key} className="font-normal">{key.toUpperCase()}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Number'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
