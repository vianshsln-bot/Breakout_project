
'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Edit, Trash2, FileText, Globe, Type, Upload, PlusCircle, Link2, ArrowLeft, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { XI_BASE_URL } from '@/lib/config';
import { useToast } from "@/hooks/use-toast";
import { EditDocumentDialog } from './edit-document-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComputeRagIndexDialog } from './compute-rag-index-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';


interface Document {
    id: string;
    name: string;
    type: 'file' | 'url' | 'text';
    status: 'indexed' | 'processing' | 'failed' | 'ready';
    created_at_unix_secs: number;
    size_bytes: number;
}

interface ApiResponse {
    documents: Document[];
}

export function KnowledgeBaseTab() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [isRagIndexOpen, setRagIndexOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const { toast } = useToast();
    const apiKey = 'ec4e64c2b17bf057a451949c080adb9274676fd0eb166aa17b346de61bde70e3';

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base`, {
                headers: {
                    'xi-api-key': apiKey,
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch documents: ${response.status} ${errorText || response.statusText}`);
            }
            const data: ApiResponse = await response.json();
            setDocuments(data.documents || []);
            setError(null); // Clear error on success
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching documents.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDelete = async () => {
        if (!selectedDoc) return;

        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/${selectedDoc.id}`, {
                method: 'DELETE',
                headers: {
                    'xi-api-key': apiKey,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete document: ${response.status} ${errorText || response.statusText}`);
            }

            toast({
                title: "Success",
                description: "Document deleted successfully."
            });
            
            fetchDocuments(); // Refresh the list
        } catch (error) {
             toast({
                variant: 'destructive',
                title: "Error",
                description: (error as Error).message || 'Could not delete the document.'
            });
        } finally {
            setDeleteOpen(false);
            setSelectedDoc(null);
        }
    };


    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderDocumentList = () => {
        if (loading && documents.length === 0) return <div className="text-center p-8">Loading documents...</div>;
        if (error && documents.length === 0) return <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>;
        if (filteredDocuments.length === 0) return <div className="text-center p-8 text-gray-500">No documents found.</div>;

        return (
            <div className="space-y-3">
                {filteredDocuments.map(doc => (
                    <div key={doc.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                                {doc.type === 'file' && <FileText className="w-5 h-5 text-gray-600" />}
                                {doc.type === 'url' && <Globe className="w-5 h-5 text-gray-600" />}
                                {doc.type === 'text' && <Type className="w-5 h-5 text-gray-600" />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(doc.size_bytes / 1024).toFixed(2)} KB &middot; Added on {new Date(doc.created_at_unix_secs * 1000).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
                                doc.status === 'indexed' || doc.status === 'ready' ? 'bg-emerald-100 text-emerald-800' :
                                doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    doc.status === 'indexed' || doc.status === 'ready' ? 'bg-emerald-500' :
                                    doc.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                                    'bg-red-500'
                                }`}/>
                                {doc.status}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setEditOpen(true); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => { setSelectedDoc(doc); setRagIndexOpen(true); }}>
                                        <Cpu className="mr-2 h-4 w-4" />
                                        Compute RAG Index
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedDoc(doc); setDeleteOpen(true); }}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
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
                    <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setCreateOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Document</Button>
                </div>
            </div>
            {renderDocumentList()}

            <CreateDocumentDialog open={isCreateOpen} onOpenChange={setCreateOpen} onSuccess={fetchDocuments} apiKey={apiKey} />

            {selectedDoc && (
                <EditDocumentDialog 
                    open={isEditOpen} 
                    onOpenChange={setEditOpen} 
                    document={selectedDoc} 
                    onSuccess={() => {
                        setEditOpen(false);
                        fetchDocuments();
                    }} 
                />
            )}
             {selectedDoc && (
                <ComputeRagIndexDialog
                    open={isRagIndexOpen}
                    onOpenChange={setRagIndexOpen}
                    document={selectedDoc}
                    apiKey={apiKey}
                    onSuccess={() => {
                        setRagIndexOpen(false);
                        fetchDocuments();
                    }}
                />
            )}
            
            <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document "{selectedDoc?.name}".
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

const initialTextData = {
    companyName: '',
    industry: '',
    location: '',
    website: '',
    companyDescription: '',
    products: '',
    productFeatures: '',
    targetAudience: '',
    policies: '',
    codeOfConduct: '',
    dataPrivacy: '',
    sops: '',
    faqs: '',
    commonIssues: '',
    internalDocs: '',
    manuals: '',
    trainingMaterials: '',
    importantUrls: '',
};


function CreateDocumentDialog({ open, onOpenChange, onSuccess, apiKey }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, apiKey: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [url, setUrl] = useState('');
    const [urlName, setUrlName] = useState('');
    
    const [textName, setTextName] = useState('');
    const [textData, setTextData] = useState(initialTextData);
    
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleTextDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setTextData(prev => ({ ...prev, [id]: value }));
    };

    const resetState = () => {
        setUrl(''); setUrlName('');
        setTextData(initialTextData); setTextName('');
        setFile(null); setFileName('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            resetState();
        }
        onOpenChange(isOpen);
    }

    const handleUrlSubmit = async () => {
        if (!url) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                body: JSON.stringify({ url, name: urlName || undefined }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add URL: ${response.status} ${errorText || response.statusText}`);
            }
            const result = await response.json();
            toast({ title: 'URL Added', description: `Document "${result.name}" (${result.id}) is being indexed.` });
            onSuccess();
            handleOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error adding URL', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTextSubmit = async () => {
        const textContent = `
# Company Information
## Basic Company Information
- Company Name: ${textData.companyName}
- Industry / Domain: ${textData.industry}
- Headquarters / Main Location: ${textData.location}
- Official Website: ${textData.website}
- Description: ${textData.companyDescription}

## Products / Services
- Main Products/Services: ${textData.products}
- Features/Benefits: ${textData.productFeatures}
- Target Audience: ${textData.targetAudience}

# Policies & Procedures
- HR & Work Policies: ${textData.policies}
- Code of Conduct: ${textData.codeOfConduct}
- Data Privacy: ${textData.dataPrivacy}
- SOPs: ${textData.sops}

# Customer Support & Knowledge
- FAQs: ${textData.faqs}
- Common Issues: ${textData.commonIssues}
- Internal Documents: ${textData.internalDocs}

# Key Documents & Links
- Product Manuals/Guides: ${textData.manuals}
- Training Materials: ${textData.trainingMaterials}
- Important URLs: ${textData.importantUrls}
        `.trim();

        if (textContent.length < 200) { // arbitrary length check
             toast({ variant: 'destructive', title: 'Error', description: 'Please fill out more information to create a meaningful document.' });
             return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
                body: JSON.stringify({ text: textContent, name: textName || textData.companyName || 'Company Knowledge Base' }),
            });
             if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create text document: ${response.status} ${errorText || response.statusText}`);
            }
            const result = await response.json();
            toast({ title: 'Text Document Created', description: `Document "${result.name}" (${result.id}) is being indexed.` });
            onSuccess();
            handleOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error creating text document', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSubmit = async () => {
        if (!file) return;
        setIsSubmitting(true);
        
        const formData = new FormData();
        formData.append('file', file);
        if (fileName) {
            formData.append('name', fileName);
        }
        
        try {
            const response = await fetch(`${XI_BASE_URL}/knowledge-base/file`, {
                method: 'POST',
                headers: { 'xi-api-key': apiKey },
                body: formData,
            });
             if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to upload file: ${response.status} ${errorText || response.statusText}`);
            }
            const result = await response.json();
            toast({ title: 'File Uploaded', description: `Document "${result.name}" (${result.id}) is being indexed.` });
            onSuccess();
            handleOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error uploading file', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add to Knowledge Base</DialogTitle>
                    <DialogDescription>Add a new document by URL, text template, or file upload.</DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="text" className="pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="url"><Link2 className="w-4 h-4 mr-2" />URL</TabsTrigger>
                        <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" />From Template</TabsTrigger>
                        <TabsTrigger value="file"><Upload className="w-4 h-4 mr-2" />File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="pt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url-name">Name (Optional)</Label>
                            <Input id="url-name" placeholder="My Document Name" value={urlName} onChange={e => setUrlName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="url">Website URL</Label>
                            <Input id="url" type="url" placeholder="https://example.com/faq" value={url} onChange={e => setUrl(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUrlSubmit} disabled={isSubmitting || !url}>
                                {isSubmitting ? 'Importing...' : 'Import from URL'}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                    <TabsContent value="text" className="pt-4">
                         <div className="space-y-2 mb-6">
                            <Label htmlFor="text-name">Document Name</Label>
                            <Input id="text-name" placeholder="e.g., Acme Inc. Knowledge Base" value={textName} onChange={e => setTextName(e.target.value)} />
                        </div>
                         <ScrollArea className="h-[50vh] pr-6">
                            <div className="space-y-6">
                                <fieldset className="space-y-4 p-4 border rounded-lg">
                                    <legend className="text-lg font-semibold px-2">Basic Company Information</legend>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label htmlFor="companyName">Company Name</Label><Input id="companyName" value={textData.companyName} onChange={handleTextDataChange}/></div>
                                        <div className="space-y-2"><Label htmlFor="industry">Industry / Domain</Label><Input id="industry" value={textData.industry} onChange={handleTextDataChange} /></div>
                                        <div className="space-y-2"><Label htmlFor="location">Headquarters / Main Location</Label><Input id="location" value={textData.location} onChange={handleTextDataChange} /></div>
                                        <div className="space-y-2"><Label htmlFor="website">Official Website Link</Label><Input id="website" type="url" value={textData.website} onChange={handleTextDataChange} /></div>
                                    </div>
                                    <div className="space-y-2"><Label htmlFor="companyDescription">Short Description (what the company does)</Label><Textarea id="companyDescription" value={textData.companyDescription} onChange={handleTextDataChange} /></div>
                                </fieldset>
                                <fieldset className="space-y-4 p-4 border rounded-lg">
                                    <legend className="text-lg font-semibold px-2">Products / Services</legend>
                                    <div className="space-y-2"><Label htmlFor="products">List of main products or services</Label><Textarea id="products" value={textData.products} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="productFeatures">Short description of each (1–2 lines), key features, or benefits</Label><Textarea id="productFeatures" value={textData.productFeatures} onChange={handleTextDataChange} /></div>
                                    <div className="spacey-2"><Label htmlFor="targetAudience">Target users/customers</Label><Textarea id="targetAudience" value={textData.targetAudience} onChange={handleTextDataChange} /></div>
                                </fieldset>
                                 <fieldset className="space-y-4 p-4 border rounded-lg">
                                    <legend className="text-lg font-semibold px-2">Policies &amp; Procedures</legend>
                                    <div className="space-y-2"><Label htmlFor="policies">HR &amp; work policies (leave, attendance, WFH, etc.)</Label><Textarea id="policies" value={textData.policies} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="codeOfConduct">Code of conduct / basic company rules</Label><Textarea id="codeOfConduct" value={textData.codeOfConduct} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="dataPrivacy">Security or data privacy do’s and don’ts</Label><Textarea id="dataPrivacy" value={textData.dataPrivacy} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="sops">Department-wise SOPs (if available)</Label><Textarea id="sops" value={textData.sops} onChange={handleTextDataChange} /></div>
                                </fieldset>
                                <fieldset className="space-y-4 p-4 border rounded-lg">
                                    <legend className="text-lg font-semibold px-2">Customer Support &amp; Knowledge</legend>
                                    <div className="space-y-2"><Label htmlFor="faqs">Top FAQs customers usually ask</Label><Textarea id="faqs" value={textData.faqs} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="commonIssues">Common issues and how to fix or answer them</Label><Textarea id="commonIssues" value={textData.commonIssues} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="internalDocs">Any useful internal documents or help articles</Label><Textarea id="internalDocs" value={textData.internalDocs} onChange={handleTextDataChange} /></div>
                                </fieldset>
                                 <fieldset className="space-y-4 p-4 border rounded-lg">
                                    <legend className="text-lg font-semibold px-2">Key Documents / Links</legend>
                                    <div className="space-y-2"><Label htmlFor="manuals">Product manuals or guides</Label><Textarea id="manuals" value={textData.manuals} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="trainingMaterials">Internal or training materials</Label><Textarea id="trainingMaterials" value={textData.trainingMaterials} onChange={handleTextDataChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="importantUrls">Important URLs (company website, support page, etc.)</Label><Textarea id="importantUrls" value={textData.importantUrls} onChange={handleTextDataChange} /></div>
                                </fieldset>
                            </div>
                         </ScrollArea>
                        <DialogFooter className="pt-6">
                            <Button onClick={handleTextSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Document'}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                    <TabsContent value="file" className="pt-4 space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="file-name">Name (Optional)</Label>
                            <Input id="file-name" placeholder="Annual Report" value={fileName} onChange={e => setFileName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">File</Label>
                            <Input id="file-upload" type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} required />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleFileSubmit} disabled={isSubmitting || !file}>
                                {isSubmitting ? 'Uploading...' : 'Upload File'}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

    
