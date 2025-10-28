import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Users, Plus, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
  likes: number;
  userVoted: string | null;
  userLiked: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: "1",
      question: "What's your favorite programming language?",
      options: [
        { id: "1a", text: "JavaScript", votes: 45 },
        { id: "1b", text: "Python", votes: 38 },
        { id: "1c", text: "TypeScript", votes: 52 },
        { id: "1d", text: "Go", votes: 21 },
      ],
      totalVotes: 156,
      likes: 24,
      userVoted: null,
      userLiked: false,
    },
    {
      id: "2",
      question: "Best time to code?",
      options: [
        { id: "2a", text: "Early Morning", votes: 34 },
        { id: "2b", text: "Afternoon", votes: 28 },
        { id: "2c", text: "Late Night", votes: 67 },
      ],
      totalVotes: 129,
      likes: 18,
      userVoted: null,
      userLiked: false,
    },
  ]);

  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        const wasVoted = poll.userVoted;
        const options = poll.options.map(opt => {
          if (wasVoted === opt.id && wasVoted !== optionId) {
            return { ...opt, votes: opt.votes - 1 };
          }
          if (opt.id === optionId) {
            if (wasVoted === optionId) {
              return { ...opt, votes: opt.votes - 1 };
            }
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        return {
          ...poll,
          options,
          totalVotes: wasVoted === optionId ? poll.totalVotes - 1 : wasVoted ? poll.totalVotes : poll.totalVotes + 1,
          userVoted: wasVoted === optionId ? null : optionId,
        };
      }
      return poll;
    }));

    toast({
      title: "Vote recorded!",
      description: "Your vote has been counted",
    });
  };

  const handleLike = (pollId: string) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          likes: poll.userLiked ? poll.likes - 1 : poll.likes + 1,
          userLiked: !poll.userLiked,
        };
      }
      return poll;
    }));
  };

  const addOption = () => {
    if (newOptions.length < 10) {
      setNewOptions([...newOptions, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const createPoll = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = newOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const newPoll: Poll = {
      id: Date.now().toString(),
      question: newQuestion,
      options: validOptions.map((text, idx) => ({
        id: `${Date.now()}-${idx}`,
        text,
        votes: 0,
      })),
      totalVotes: 0,
      likes: 0,
      userVoted: null,
      userLiked: false,
    };

    setPolls([newPoll, ...polls]);
    setNewQuestion("");
    setNewOptions(["", ""]);

    toast({
      title: "Success!",
      description: "Your poll has been created",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
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
          <Button variant="ghost" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

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

          <Card className="shadow-[var(--shadow-card)] border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createPoll} className="space-y-4">
                <div>
                  <Input
                    placeholder="What's your question?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  {newOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      {newOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  disabled={newOptions.length >= 10}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>

                <Button type="submit" className="w-full">
                  Create Poll
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Active Polls</h2>
            <div className="grid gap-6">
              {polls.map((poll) => (
                <Card
                  key={poll.id}
                  className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 animate-fade-in"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{poll.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = poll.totalVotes === 0 ? 0 : (option.votes / poll.totalVotes) * 100;
                      const isSelected = poll.userVoted === option.id;

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(poll.id, option.id)}
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
                            <span className="font-medium">{option.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{option.votes}</span>
                              <span className="text-sm font-semibold text-primary">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{poll.totalVotes} votes</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(poll.id)}
                        className={cn(
                          "gap-2 transition-all duration-300",
                          poll.userLiked && "text-primary animate-pulse-glow"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", poll.userLiked && "fill-primary")} />
                        <span>{poll.likes}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
