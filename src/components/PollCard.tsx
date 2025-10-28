import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Poll {
  id: string;
  question: string;
  created_at: string;
}

interface PollOption {
  id: string;
  option_text: string;
  option_order: number;
}

interface Vote {
  option_id: string;
  user_id: string;
}

interface Like {
  user_id: string;
}

interface PollCardProps {
  poll: Poll;
  userId: string | undefined;
}

export const PollCard = ({ poll, userId }: PollCardProps) => {
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPollData();
    subscribeToChanges();
  }, [poll.id]);

  const fetchPollData = async () => {
    const [optionsData, votesData, likesData] = await Promise.all([
      supabase.from("poll_options").select("*").eq("poll_id", poll.id).order("option_order"),
      supabase.from("votes").select("option_id, user_id").eq("poll_id", poll.id),
      supabase.from("likes").select("user_id").eq("poll_id", poll.id),
    ]);

    if (optionsData.data) setOptions(optionsData.data);
    if (votesData.data) {
      setVotes(votesData.data);
      const myVote = votesData.data.find(v => v.user_id === userId);
      setUserVote(myVote?.option_id || null);
    }
    if (likesData.data) {
      setLikes(likesData.data);
      setUserLiked(likesData.data.some(l => l.user_id === userId));
    }
  };

  const subscribeToChanges = () => {
    const votesChannel = supabase
      .channel(`votes-${poll.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `poll_id=eq.${poll.id}` },
        () => fetchPollData()
      )
      .subscribe();

    const likesChannel = supabase
      .channel(`likes-${poll.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes", filter: `poll_id=eq.${poll.id}` },
        () => fetchPollData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const handleVote = async (optionId: string) => {
    if (!userId || loading) return;
    setLoading(true);

    try {
      if (userVote) {
        await supabase.from("votes").delete().eq("poll_id", poll.id).eq("user_id", userId);
        if (userVote === optionId) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("votes")
        .insert({ poll_id: poll.id, option_id: optionId, user_id: userId });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!userId || loading) return;
    setLoading(true);

    try {
      if (userLiked) {
        await supabase.from("likes").delete().eq("poll_id", poll.id).eq("user_id", userId);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ poll_id: poll.id, user_id: userId });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = votes.length;
  const getVoteCount = (optionId: string) => votes.filter(v => v.option_id === optionId).length;
  const getVotePercentage = (optionId: string) => 
    totalVotes === 0 ? 0 : (getVoteCount(optionId) / totalVotes) * 100;

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl">{poll.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option) => {
          const voteCount = getVoteCount(option.id);
          const percentage = getVotePercentage(option.id);
          const isSelected = userVote === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={loading}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex justify-between items-center">
                <span className="font-medium">{option.option_text}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{voteCount}</span>
                  <span className="text-sm font-semibold text-primary">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </button>
          );
        })}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{totalVotes} votes</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={cn(
              "gap-2 transition-all duration-300",
              userLiked && "text-primary animate-pulse-glow"
            )}
          >
            <Heart className={cn("h-4 w-4", userLiked && "fill-primary")} />
            <span>{likes.length}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
