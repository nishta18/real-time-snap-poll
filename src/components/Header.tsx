import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

interface HeaderProps {
  onSignOut: () => void;
}

export const Header = ({ onSignOut }: HeaderProps) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            QuickPoll
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Real-time opinion polling
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
