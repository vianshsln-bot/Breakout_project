
'use client';
import { useState, useRef } from 'react';
import { Bot, Book, Phone, Settings, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentsTab } from './_components/agents-tab';
import { KnowledgeBaseTab } from './_components/knowledge-base-tab';
import { CreateAgentDialog } from './_components/create-agent-dialog';
import { PhoneNumbersTab } from './_components/phone-numbers-tab';
import { WorkspaceSettingsTab } from './_components/workspace-settings-tab';

export default function AgentsPage() {
    const [isCreateAgentOpen, setCreateAgentOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('agents');
    
    // We use a ref to store a function that can imperatively trigger a refresh
    const refreshAgentsRef = useRef<() => void | null>(null);

    const handleSuccess = () => {
        // This could be used to refresh data across tabs if needed
        if (activeTab === 'agents' && refreshAgentsRef.current) {
            refreshAgentsRef.current();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">ElevenLabs Agent & Knowledge Hub</h1>
                    <p className="text-gray-500 mt-1">Manage voice agents, knowledge bases, and system configurations for ElevenLabs.</p>
                </div>
                {activeTab === 'agents' && (
                    <Button onClick={() => setCreateAgentOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Voice Agent
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="agents">
                        <Bot className="mr-2 h-4 w-4" />
                        Voice Agents
                    </TabsTrigger>
                    <TabsTrigger value="knowledge-base">
                        <Book className="mr-2 h-4 w-4" />
                        Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="phone-numbers">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone Numbers
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Workspace Settings
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="agents">
                    <AgentsTab onAgentCreated={handleSuccess} />
                </TabsContent>
                <TabsContent value="knowledge-base">
                    <KnowledgeBaseTab />
                </TabsContent>
                 <TabsContent value="phone-numbers">
                    <PhoneNumbersTab />
                </TabsContent>
                 <TabsContent value="settings">
                     <WorkspaceSettingsTab />
                </TabsContent>
            </Tabs>
            
            <CreateAgentDialog open={isCreateAgentOpen} onOpenChange={setCreateAgentOpen} onSuccess={handleSuccess} />
        </div>
    );
}
