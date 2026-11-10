ALTER TABLE "properties" ADD COLUMN "negotiationConditions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "properties" ADD CONSTRAINT "properties_negotiation_conditions_valid"
CHECK ("negotiationConditions" <@ ARRAY[
  'ACCEPTS_FINANCING', 'REQUIRES_DOWN_PAYMENT', 'CASH_ONLY', 'ACCEPTS_EXCHANGE',
  'SALE_NEGOTIABLE', 'AGREE_WITH_OWNER', 'RENT_NEGOTIABLE', 'REQUIRES_DEPOSIT'
]::TEXT[]);

ALTER TABLE "properties" ADD CONSTRAINT "properties_negotiation_conditions_compatible"
CHECK (NOT ("negotiationConditions" @> ARRAY['CASH_ONLY', 'ACCEPTS_FINANCING']::TEXT[]));
