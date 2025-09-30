-- Fix infinite recursion in RLS policies
-- The issue: units policy references properties table, creating circular dependency when joining

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Landlords can manage units in own properties" ON public.units;
DROP POLICY IF EXISTS "Tenants can view own unit" ON public.units;
DROP POLICY IF EXISTS "Landlords can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON public.properties;

-- Add landlord_id to units table for direct access control (denormalized for performance)
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also add landlord_id to tenancies and maintenance_requests to fully eliminate recursion
ALTER TABLE public.tenancies ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_units_landlord_id ON public.units(landlord_id);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tenancies_landlord_id ON public.tenancies(landlord_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_landlord_id ON public.maintenance_requests(landlord_id);

-- Update existing units to have landlord_id from their properties
UPDATE public.units u
SET landlord_id = p.landlord_id
FROM public.properties p
WHERE u.property_id = p.id AND u.landlord_id IS NULL;

-- Update tenancies and maintenance_requests with landlord_id
UPDATE public.tenancies t
SET landlord_id = u.landlord_id
FROM public.units u
WHERE t.unit_id = u.id AND t.landlord_id IS NULL;

UPDATE public.maintenance_requests mr
SET landlord_id = u.landlord_id
FROM public.units u
WHERE mr.unit_id = u.id AND mr.landlord_id IS NULL;

-- Create trigger to automatically set landlord_id when inserting units
CREATE OR REPLACE FUNCTION set_unit_landlord_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT landlord_id INTO NEW.landlord_id
    FROM public.properties
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_unit_landlord_id ON public.units;
CREATE TRIGGER trigger_set_unit_landlord_id
    BEFORE INSERT ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION set_unit_landlord_id();

-- Add triggers for tenancies and maintenance_requests
CREATE OR REPLACE FUNCTION set_tenancy_landlord_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT landlord_id INTO NEW.landlord_id
    FROM public.units
    WHERE id = NEW.unit_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_tenancy_landlord_id ON public.tenancies;
CREATE TRIGGER trigger_set_tenancy_landlord_id
    BEFORE INSERT ON public.tenancies
    FOR EACH ROW
    EXECUTE FUNCTION set_tenancy_landlord_id();

CREATE OR REPLACE FUNCTION set_maintenance_request_landlord_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT landlord_id INTO NEW.landlord_id
    FROM public.units
    WHERE id = NEW.unit_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_maintenance_request_landlord_id ON public.maintenance_requests;
CREATE TRIGGER trigger_set_maintenance_request_landlord_id
    BEFORE INSERT ON public.maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_maintenance_request_landlord_id();

-- Recreate properties policies (simplified, no recursion)
CREATE POLICY "Landlords can view own properties" ON public.properties FOR SELECT 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert own properties" ON public.properties FOR INSERT 
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update own properties" ON public.properties FOR UPDATE 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete own properties" ON public.properties FOR DELETE 
USING (landlord_id = auth.uid());

-- Recreate units policies (no circular dependency)
CREATE POLICY "Landlords can view own units" ON public.units FOR SELECT 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert units" ON public.units FOR INSERT 
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update own units" ON public.units FOR UPDATE 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete own units" ON public.units FOR DELETE 
USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can view own unit" ON public.units FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t 
        WHERE t.unit_id = units.id 
        AND t.tenant_id = auth.uid() 
        AND t.status = 'active'
    )
);

-- Simplify tenancies policies to use landlord_id directly (no recursion)
-- Fix tenancies policies to avoid recursion
DROP POLICY IF EXISTS "Landlords can manage tenancies" ON public.tenancies;
DROP POLICY IF EXISTS "Tenants can view own tenancy" ON public.tenancies;

CREATE POLICY "Landlords can view tenancies" ON public.tenancies FOR SELECT 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert tenancies" ON public.tenancies FOR INSERT 
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update tenancies" ON public.tenancies FOR UPDATE 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete tenancies" ON public.tenancies FOR DELETE 
USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can view own tenancy" ON public.tenancies FOR SELECT 
USING (tenant_id = auth.uid());

-- Simplify maintenance requests policies to use landlord_id directly (no recursion)
-- Fix maintenance requests policies
DROP POLICY IF EXISTS "Landlords can manage maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can manage own maintenance requests" ON public.maintenance_requests;

CREATE POLICY "Landlords can view maintenance requests" ON public.maintenance_requests FOR SELECT 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can update maintenance requests" ON public.maintenance_requests FOR UPDATE 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete maintenance requests" ON public.maintenance_requests FOR DELETE 
USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can view own maintenance requests" ON public.maintenance_requests FOR SELECT 
USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert maintenance requests" ON public.maintenance_requests FOR INSERT 
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update own maintenance requests" ON public.maintenance_requests FOR UPDATE 
USING (tenant_id = auth.uid());

-- Simplify rent payments policies to use landlord_id from tenancies directly
-- Fix rent payments policies
DROP POLICY IF EXISTS "Landlords can manage rent payments" ON public.rent_payments;
DROP POLICY IF EXISTS "Tenants can view own rent payments" ON public.rent_payments;

CREATE POLICY "Landlords can view rent payments" ON public.rent_payments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = rent_payments.tenancy_id 
        AND t.landlord_id = auth.uid()
    )
);

CREATE POLICY "Landlords can insert rent payments" ON public.rent_payments FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = rent_payments.tenancy_id 
        AND t.landlord_id = auth.uid()
    )
);

CREATE POLICY "Landlords can update rent payments" ON public.rent_payments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = rent_payments.tenancy_id 
        AND t.landlord_id = auth.uid()
    )
);

CREATE POLICY "Tenants can view own rent payments" ON public.rent_payments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t 
        WHERE t.id = rent_payments.tenancy_id 
        AND t.tenant_id = auth.uid()
    )
);
