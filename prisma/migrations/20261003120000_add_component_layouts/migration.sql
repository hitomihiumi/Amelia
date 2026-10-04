-- Components V2 layouts: whole messages built from containers, sections, text, media and rows.
ALTER TABLE "Guild" ADD COLUMN "componentsLayouts" JSONB NOT NULL DEFAULT '[]';
