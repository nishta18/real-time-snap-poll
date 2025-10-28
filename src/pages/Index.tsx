import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Header } from "@/components/Header";
import { CreatePollForm } from "@/components/CreatePollForm";
import { PollCard } from "@/components/PollCard";
import { User } from "@supabase/supabase-js";

interface Poll {
  id: string;
  question: string;
  created_at: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPolls();
      subscribeToPolls();
    }
  }, [user]);

  const fetchPolls = async () => {
    const { data } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPolls(data);
  };

  const subscribeToPolls = () => {
    const channel = supabase
      .channel("polls")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => fetchPolls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Header onSignOut={() => setUser(null)} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create & Vote on Polls
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time polling platform for quick opinions
            </p>
          </div>

          <CreatePollForm onPollCreated={fetchPolls} />

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Active Polls</h2>
            {polls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No polls yet. Create the first one!
              </div>
            ) : (
              <div className="grid gap-6">
                {polls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} userId={user?.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
