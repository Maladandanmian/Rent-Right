-- Add unit details fields to units table
-- This migration adds room assignments and appliances to the units table

ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS room_assignments TEXT[], -- Array of room types
ADD COLUMN IF NOT EXISTS appliances TEXT[]; -- Array of appliances

-- Add comment to explain the new columns
COMMENT ON COLUMN public.units.room_assignments IS 'Array of room types in the unit (e.g., master_bedroom, kitchen, maid_room)';
COMMENT ON COLUMN public.units.appliances IS 'Array of appliances included in the unit (e.g., air_conditioner, refrigerator, washing_machine)';
