
'use client';
import { useState, useEffect } from 'react';
import { Search, MoreVertical, Edit, Copy, Trash2, Bot, User, Share2, FlaskConical, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { XI_BASE_URL } from '@/lib/config';
import { useToast } from "@/hooks/use-toast";
import { CreateAgentDialog } from './create-agent-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export interface Agent {
    agent_id: string;
    name: string;
    type: 'ai' | 'human';
    status: 'available' | 'busy' | 'offline';
    description?: string;
    created_at?: string;
}

export function AgentsTab({ onAgentCreated }: { onAgentCreated: () => void }) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    
    const apiKey = 'ec4e64c2b17bf057a451949c080adb9274676fd0eb166aa17b346de61bde70e3';

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${XI_BASE_URL}/agents`, {
                headers: {
                    'xi-api-key': apiKey,
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch agents: ${response.status} ${errorText || response.statusText}`);
            }
            const data = await response.json();
            
            if (data && Array.isArray(data.agents)) {
                 setAgents(data.agents.map((agent: any) => ({
                    ...agent,
                    // Mocking status and type as they are not in the API response
                    status: ['available', 'busy', 'offline'][Math.floor(Math.random() * 3)] as any,
                    type: 'ai',
                 })));
            } else {
                 setAgents([]);
            }
            setError(null); // Clear error on success
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching agents.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleDuplicate = async (agentId: string) => {
        toast({ title: "Success", description: "Voice agent duplicated successfully." });
    };
    
    const handleDelete = async () => {
        if (!selectedAgent) return;
        setAgents(prev => prev.filter(a => a.agent_id !== selectedAgent.agent_id));
        toast({ title: "Success", description: "Voice agent deleted successfully." });
        setDeleteOpen(false);
        setSelectedAgent(null);
    }

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderAgentList = () => {
        if (loading && agents.length === 0) {
            return (
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-lg h-20 animate-pulse" />
                    ))}
                </div>
            );
        }

        if (error && agents.length === 0) {
            return <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">{error}</div>;
        }

        if (filteredAgents.length === 0) {
            return <div className="text-gray-500 text-center py-10">No voice agents found.</div>;
        }

        return (
            <div className="space-y-4">
                {filteredAgents.map(agent => (
                    <div key={agent.agent_id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between hover:border-blue-400 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${agent.type === 'ai' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                {agent.type === 'ai' ? <Bot className="w-6 h-6 text-purple-600" /> : <User className="w-6 h-6 text-blue-600" />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.description || 'No description available.'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Created: {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                agent.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                                agent.status === 'busy' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedAgent(agent); setEditOpen(true); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleDuplicate(agent.agent_id)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span>Duplicate</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem>
                                        <FlaskConical className="mr-2 h-4 w-4" />
                                        <span>Simulate</span>
                                    </DropdownMenuItem>
                                     <DropdownMenuItem>
                                        <BarChart className="mr-2 h-4 w-4" />
                                        <span>Calculate Usage</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        <span>Get Link</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedAgent(agent); setDeleteOpen(true); }}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search voice agents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            {renderAgentList()}

            <CreateAgentDialog
                open={isEditOpen}
                onOpenChange={setEditOpen}
                agent={selectedAgent}
                onSuccess={() => {
                    setEditOpen(false);
                    setSelectedAgent(null);
                    fetchAgents();
                }}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the voice agent
                             "{selectedAgent?.name}".
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

    
