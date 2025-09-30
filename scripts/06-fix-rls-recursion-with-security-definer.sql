-- Fix infinite recursion in RLS policies using SECURITY DEFINER functions
-- This completely eliminates circular dependencies by using functions that bypass RLS

-- Drop all existing policies on units table
DROP POLICY IF EXISTS "Landlords can view own units" ON public.units;
DROP POLICY IF EXISTS "Landlords can insert units" ON public.units;
DROP POLICY IF EXISTS "Landlords can update own units" ON public.units;
DROP POLICY IF EXISTS "Landlords can delete own units" ON public.units;
DROP POLICY IF EXISTS "Tenants can view own unit" ON public.units;

-- Create a SECURITY DEFINER function to check if user is tenant of a unit
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_tenant_of_unit(unit_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.tenancies 
        WHERE unit_id = unit_id_param 
        AND tenant_id = auth.uid() 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate units policies using direct landlord_id check and SECURITY DEFINER function
CREATE POLICY "Landlords can view own units" ON public.units FOR SELECT 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can insert units" ON public.units FOR INSERT 
WITH CHECK (landlord_id = auth.uid());

CREATE POLICY "Landlords can update own units" ON public.units FOR UPDATE 
USING (landlord_id = auth.uid());

CREATE POLICY "Landlords can delete own units" ON public.units FOR DELETE 
USING (landlord_id = auth.uid());

-- Use SECURITY DEFINER function for tenant access (no recursion)
CREATE POLICY "Tenants can view own unit" ON public.units FOR SELECT 
USING (public.is_tenant_of_unit(id));

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_tenant_of_unit(UUID) TO authenticated;
