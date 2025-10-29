
'use client';
import { useState, useEffect } from 'react';
import { Theme } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { CreateThemeDialog } from './_components/create-theme-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const { toast } = useToast();

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/themes/`);
      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`HTTP error! Status: ${response.status} - ${errorText || response.statusText}`);
      }
      const data: Theme[] = await response.json();
      setThemes(data);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching themes.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleDelete = async () => {
    if (!selectedTheme) return;

    try {
      const response = await fetch(`${API_BASE_URL}/themes/${selectedTheme.theme_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete theme: ${response.status} ${errorText || response.statusText}`);
      }

      toast({
        title: "Success",
        description: `Theme "${selectedTheme.name}" has been deleted.`
      });
      fetchThemes();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: (error as Error).message || "Could not delete the theme."
      });
    } finally {
      setDeleteOpen(false);
      setSelectedTheme(null);
    }
  };

  const renderThemes = () => {
    if (loading && themes.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm h-64 animate-pulse" />
          ))}
        </div>
      );
    }

    if (error && themes.length === 0) {
      return (
        <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center">
          <p className="font-bold">Failed to load theme data.</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div key={theme.theme_id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
               <div className="absolute top-2 right-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedTheme(theme); setDeleteOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
               </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900">{theme.name}</h3>

              <p className="text-sm text-gray-600 my-3 h-20 overflow-hidden">{theme.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-gray-900">{theme.duration_minutes ?? '-'} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min/Max Players</span>
                  <span className="font-bold text-gray-900">{theme.booking_limit_min ?? '-'}/{theme.booking_limit_max ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Themes & Packages</h1>
          <p className="text-gray-500 mt-1">Manage event packages and pricing</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create Theme
        </button>
      </div>
      {renderThemes()}
      <CreateThemeDialog
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchThemes}
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the theme "{selectedTheme?.name}".
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
