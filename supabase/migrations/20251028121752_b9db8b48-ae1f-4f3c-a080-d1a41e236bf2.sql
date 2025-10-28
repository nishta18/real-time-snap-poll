-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone can view polls"
  ON public.polls FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls"
  ON public.polls FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own polls"
  ON public.polls FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for poll_options
CREATE POLICY "Anyone can view poll options"
  ON public.poll_options FOR SELECT
  USING (true);

CREATE POLICY "Poll creators can add options"
  ON public.poll_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE id = poll_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like polls"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike polls"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_likes_poll_id ON public.likes(poll_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);