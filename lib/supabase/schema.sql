-- Nimbus Whiteboard — Supabase Schema
-- Run this when Supabase project is provisioned

CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Board',
  owner_id UUID REFERENCES auth.users(id),
  excalidraw_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  mermaid_cache TEXT,
  element_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE board_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  excalidraw_data JSONB NOT NULL,
  png_url TEXT,
  mermaid_output TEXT,
  trigger TEXT CHECK (trigger IN ('manual', 'auto', 'deploy')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deploy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id),
  snapshot_id UUID REFERENCES board_snapshots(id),
  status TEXT CHECK (status IN ('pending', 'scoring', 'approved', 'rejected', 'deployed')) DEFAULT 'pending',
  ni1_score JSONB,
  ni1_decision TEXT,
  mermaid_output TEXT,
  markdown_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own boards" ON boards
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE board_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own snapshots" ON board_snapshots
  FOR ALL USING (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

ALTER TABLE deploy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own deploys" ON deploy_requests
  FOR ALL USING (board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid()));

CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_boards_updated ON boards(updated_at DESC);
CREATE INDEX idx_snapshots_board ON board_snapshots(board_id, created_at DESC);
