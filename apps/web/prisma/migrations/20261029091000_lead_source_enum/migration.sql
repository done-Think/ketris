CREATE TYPE "OrigemLead" AS ENUM ('MARKETPLACE', 'WHATSAPP', 'INSTAGRAM', 'SITE', 'INDICACAO', 'OUTRA');

ALTER TABLE "leads" ALTER COLUMN "origem" TYPE "OrigemLead" USING (
  CASE lower(translate(trim("origem"), 'ãçÇÃ', 'acCA'))
    WHEN 'marketplace' THEN 'MARKETPLACE'
    WHEN 'whatsapp' THEN 'WHATSAPP'
    WHEN 'instagram' THEN 'INSTAGRAM'
    WHEN 'site' THEN 'SITE'
    WHEN 'indicacao' THEN 'INDICACAO'
    ELSE 'OUTRA'
  END
)::"OrigemLead";
