-- DLC Manager — Migration complète (v1 + v2)

-- ─── Table spaces (créée avant products pour les FK) ──────────────────────────
CREATE TABLE IF NOT EXISTS spaces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'autre',
  access_pin       TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spaces_select" ON spaces;
DROP POLICY IF EXISTS "spaces_write"  ON spaces;
CREATE POLICY "spaces_select" ON spaces FOR SELECT USING (true);
CREATE POLICY "spaces_write"  ON spaces FOR ALL
  USING (establishment_id = auth.uid())
  WITH CHECK (establishment_id = auth.uid());

-- ─── Table lots (créée avant products pour les FK) ────────────────────────────
CREATE TABLE IF NOT EXISTS lots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id           UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  establishment_id   UUID NOT NULL,
  product_name       TEXT NOT NULL,
  barcode            TEXT,
  quantity_initial   INTEGER NOT NULL DEFAULT 1,
  quantity_remaining INTEGER NOT NULL DEFAULT 1,
  dlc                DATE NOT NULL,
  status             TEXT NOT NULL DEFAULT 'open',
  closed_at          TIMESTAMPTZ,
  closed_by          UUID,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lots_all" ON lots;
CREATE POLICY "lots_all" ON lots FOR ALL
  USING (establishment_id = auth.uid())
  WITH CHECK (establishment_id = auth.uid());

-- ─── Table products ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  dlc              DATE NOT NULL,
  qty              TEXT NOT NULL DEFAULT '1',
  unit             TEXT NOT NULL DEFAULT 'unités',
  barcode          TEXT,
  brand            TEXT,
  added_at         TIMESTAMPTZ DEFAULT now(),
  space_id         UUID REFERENCES spaces(id),
  establishment_id UUID,
  category         TEXT,
  lot_id           UUID REFERENCES lots(id),
  status           TEXT NOT NULL DEFAULT 'active',
  scanned_at       TIMESTAMPTZ
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_all" ON products;
CREATE POLICY "products_all" ON products FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Table action_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id         UUID,
  user_id          UUID,
  establishment_id UUID NOT NULL,
  action           TEXT NOT NULL,
  product_id       UUID,
  lot_id           UUID,
  details          JSONB,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_all" ON action_logs;
CREATE POLICY "logs_all" ON action_logs FOR ALL
  USING (establishment_id = auth.uid())
  WITH CHECK (establishment_id = auth.uid());
