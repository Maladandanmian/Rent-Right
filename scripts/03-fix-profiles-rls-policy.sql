-- Fix RLS policy for profiles table to allow user registration
-- Add missing INSERT policy for profiles

CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Also add policies for tenancies, rent_payments, maintenance_requests, and documents
-- that were missing from the original schema

-- Tenancies policies
CREATE POLICY "Landlords can view tenancies for own properties" ON public.tenancies FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        JOIN public.properties p ON u.property_id = p.id 
        WHERE u.id = tenancies.unit_id 
        AND p.landlord_id = auth.uid()
    )
);
CREATE POLICY "Tenants can view own tenancies" ON public.tenancies FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Landlords can manage tenancies for own properties" ON public.tenancies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        JOIN public.properties p ON u.property_id = p.id 
        WHERE u.id = tenancies.unit_id 
        AND p.landlord_id = auth.uid()
    )
);

-- Rent payments policies
CREATE POLICY "Landlords can view rent payments for own properties" ON public.rent_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        JOIN public.units u ON t.unit_id = u.id
        JOIN public.properties p ON u.property_id = p.id
        WHERE t.id = rent_payments.tenancy_id 
        AND p.landlord_id = auth.uid()
    )
);
CREATE POLICY "Tenants can view own rent payments" ON public.rent_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = rent_payments.tenancy_id 
        AND t.tenant_id = auth.uid()
    )
);
CREATE POLICY "Tenants can update own rent payments" ON public.rent_payments FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = rent_payments.tenancy_id 
        AND t.tenant_id = auth.uid()
    )
);

-- Maintenance requests policies
CREATE POLICY "Landlords can view maintenance requests for own properties" ON public.maintenance_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        JOIN public.properties p ON u.property_id = p.id 
        WHERE u.id = maintenance_requests.unit_id 
        AND p.landlord_id = auth.uid()
    )
);
CREATE POLICY "Tenants can manage own maintenance requests" ON public.maintenance_requests FOR ALL USING (tenant_id = auth.uid());
CREATE POLICY "Landlords can update maintenance requests for own properties" ON public.maintenance_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.units u 
        JOIN public.properties p ON u.property_id = p.id 
        WHERE u.id = maintenance_requests.unit_id 
        AND p.landlord_id = auth.uid()
    )
);

-- Documents policies
CREATE POLICY "Users can view documents for own tenancies/properties" ON public.documents FOR SELECT USING (
    (tenancy_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.tenancies t
        WHERE t.id = documents.tenancy_id 
        AND t.tenant_id = auth.uid()
    )) OR
    (property_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = documents.property_id 
        AND p.landlord_id = auth.uid()
    ))
);
CREATE POLICY "Users can upload documents for own tenancies/properties" ON public.documents FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND (
        (tenancy_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.tenancies t
            WHERE t.id = documents.tenancy_id 
            AND t.tenant_id = auth.uid()
        )) OR
        (property_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id = documents.property_id 
            AND p.landlord_id = auth.uid()
        ))
    )
);
