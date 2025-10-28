import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreatePollFormProps {
  onPollCreated: () => void;
}

export const CreatePollForm = ({ onPollCreated }: CreatePollFormProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({ question, created_by: user.id })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionsData = validOptions.map((option, index) => ({
        poll_id: poll.id,
        option_text: option,
        option_order: index,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;

      toast({
        title: "Success!",
        description: "Your poll has been created",
      });
      
      setQuestion("");
      setOptions(["", ""]);
      onPollCreated();
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

  return (
    <Card className="shadow-[var(--shadow-card)] border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="What's your question?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                {options.length > 2 && (
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
            disabled={options.length >= 10}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Poll"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
