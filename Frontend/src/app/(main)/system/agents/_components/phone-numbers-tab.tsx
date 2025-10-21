
'use client';
import { useState, useEffect } from 'react';
import { Search, MoreVertical, Edit, Trash2, Phone, PlusCircle, Check, Copy, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CreatePhoneNumberDialog } from './create-phone-number-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface PhoneNumber {
    id: string;
    number: string;
    assignedTo: string | null;
    capabilities: ('voice' | 'sms' | 'mms')[];
    status: 'active' | 'inactive' | 'porting';
    createdAt: string;
}

export function PhoneNumbersTab() {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isImportOpen, setImportOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null);
    const { toast } = useToast();

    const fetchNumbers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Mocking API call
            const staticNumbers: PhoneNumber[] = [
                {id: 'pn-1', number: '+1 (555) 123-4567', assignedTo: 'AI Agent 1', capabilities: ['voice', 'sms'], status: 'active', createdAt: new Date().toISOString()},
                {id: 'pn-2', number: '+1 (555) 765-4321', assignedTo: null, capabilities: ['voice', 'sms', 'mms'], status: 'inactive', createdAt: new Date(Date.now() - 86400000).toISOString()},
                {id: 'pn-3', number: '+1 (555) 987-6543', assignedTo: 'Human Agent 2', capabilities: ['voice'], status: 'active', createdAt: new Date(Date.now() - 172800000).toISOString()},
                {id: 'pn-4', number: '+1 (555) 345-6789', assignedTo: 'AI Agent 5', capabilities: ['sms'], status: 'porting', createdAt: new Date(Date.now() - 259200000).toISOString()},
            ];
            setPhoneNumbers(staticNumbers);
        } catch (err) {
            setError('Failed to fetch phone numbers. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNumbers();
    }, []);

    const handleDelete = async () => {
        if (!selectedNumber) return;
        toast({ title: "Success", description: "Phone number deleted successfully." });
        setPhoneNumbers(prev => prev.filter(p => p.id !== selectedNumber.id));
        setDeleteOpen(false);
        setSelectedNumber(null);
    };

    const handleCopy = (number: string) => {
        navigator.clipboard.writeText(number);
        toast({ title: "Copied!", description: "Phone number copied to clipboard." });
    };

    const filteredNumbers = phoneNumbers.filter(num =>
        num.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (num.assignedTo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderNumberList = () => {
        if (loading) return <div className="text-center p-8">Loading numbers...</div>;
        if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
        if (filteredNumbers.length === 0) return <div className="text-center p-8 text-gray-500">No phone numbers found.</div>;
        
        return (
            <div className="space-y-3">
                {filteredNumbers.map(num => (
                    <div key={num.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                                <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-mono font-medium text-gray-800">{num.number}</p>
                                <p className="text-xs text-gray-500">
                                    {num.assignedTo ? `Assigned to ${num.assignedTo}` : 'Unassigned'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                {num.capabilities.map(cap => (
                                    <span key={cap} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">{cap.toUpperCase()}</span>
                                ))}
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                num.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                num.status === 'porting' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {num.status}
                            </span>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedNumber(num); setEditOpen(true); }}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopy(num.number)}><Copy className="mr-2 h-4 w-4" />Copy Number</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedNumber(num); setDeleteOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input placeholder="Search numbers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" /> Import Numbers</Button>
                    <Button onClick={() => setCreateOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Number</Button>
                </div>
            </div>
            
            {renderNumberList()}
            
            <CreatePhoneNumberDialog
                open={isCreateOpen || isEditOpen}
                onOpenChange={isEditOpen ? setEditOpen : setCreateOpen}
                onSuccess={() => {
                    fetchNumbers();
                    setSelectedNumber(null);
                }}
                phoneNumber={selectedNumber}
            />

            <ImportNumbersDialog
                open={isImportOpen}
                onOpenChange={setImportOpen}
                onSuccess={fetchNumbers}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the number {selectedNumber?.number}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function ImportNumbersDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [selectedNumbers, setSelectedNumbers] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setLoading(true);
            // Simulate fetching from a number provider
            setTimeout(() => {
                setAvailableNumbers([
                    { number: '+1 (555) 222-3333', location: 'San Francisco, CA' },
                    { number: '+1 (555) 444-5555', location: 'New York, NY' },
                    { number: '+1 (555) 666-7777', location: 'Chicago, IL' },
                ]);
                setLoading(false);
            }, 1000);
        }
    }, [open]);

    const handleImport = async () => {
        setIsSubmitting(true);
        // Mock API call to import numbers
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: 'Import Successful',
            description: `${Object.keys(selectedNumbers).length} numbers have been added to your workspace.`,
        });
        setIsSubmitting(false);
        onSuccess();
        onOpenChange(false);
    };

    const numSelected = Object.values(selectedNumbers).filter(Boolean).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import from Number Provider</DialogTitle>
                    <DialogDescription>
                        Select available numbers from your provider to import into this workspace.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3 max-h-80 overflow-y-auto">
                    {loading ? <p>Fetching available numbers...</p> : 
                        availableNumbers.map(num => (
                            <div key={num.number} className='flex items-center gap-3 p-3 border rounded-md'>
                                <Checkbox 
                                    id={num.number} 
                                    onCheckedChange={(checked) => setSelectedNumbers(s => ({...s, [num.number]: !!checked}))}
                                />
                                <Label htmlFor={num.number} className='flex-1'>
                                    <p className='font-mono'>{num.number}</p>
                                    <p className='text-xs text-muted-foreground'>{num.location}</p>
                                </Label>
                            </div>
                        ))
                    }
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={isSubmitting || numSelected === 0}>
                        {isSubmitting ? 'Importing...' : `Import ${numSelected} Number(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
