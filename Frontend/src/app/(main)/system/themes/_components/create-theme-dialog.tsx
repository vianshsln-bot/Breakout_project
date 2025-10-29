
'use client';
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';

const themeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  booking_limit_min: z.coerce.number().int().min(1, 'Min players must be at least 1'),
  booking_limit_max: z.coerce.number().int().min(1, 'Max players must be at least 1'),
}).refine(data => data.booking_limit_max >= data.booking_limit_min, {
    message: "Max players cannot be less than min players",
    path: ["booking_limit_max"],
});

type ThemeFormValues = z.infer<typeof themeSchema>;

interface CreateThemeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateThemeDialog({ open, onOpenChange, onSuccess }: CreateThemeDialogProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ThemeFormValues>({
        resolver: zodResolver(themeSchema),
    });
    const { toast } = useToast();

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    const onSubmit: SubmitHandler<ThemeFormValues> = async (data) => {
        try {
            const payload = {
                ...data,
                description: data.description || "",
                theme_id: Math.random().toString(36).substring(2, 15).toUpperCase(), // Generate a random theme_id
            };

            const response = await fetch(`${API_BASE_URL}/themes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP Error: ${response.status}` }));
                throw new Error(errorData.detail || 'Failed to create theme.');
            }

            toast({
                title: 'Success!',
                description: `Theme "${data.name}" has been created.`,
            });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: (error as Error).message,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New Theme</DialogTitle>
                        <DialogDescription>
                            Configure the details for a new event theme.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Theme Name</Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} />
                            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                            <Input id="duration_minutes" type="number" {...register('duration_minutes')} />
                            {errors.duration_minutes && <p className="text-xs text-red-600">{errors.duration_minutes.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="booking_limit_min">Min Players</Label>
                                <Input id="booking_limit_min" type="number" {...register('booking_limit_min')} />
                                {errors.booking_limit_min && <p className="text-xs text-red-600">{errors.booking_limit_min.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="booking_limit_max">Max Players</Label>
                                <Input id="booking_limit_max" type="number" {...register('booking_limit_max')} />
                                {errors.booking_limit_max && <p className="text-xs text-red-600">{errors.booking_limit_max.message}</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Theme'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
