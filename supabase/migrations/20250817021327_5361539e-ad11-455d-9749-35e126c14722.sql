-- Corriger le problème de sécurité: Function Search Path Mutable
-- Mettre à jour la fonction has_role pour fixer le search_path

CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ura.role_id = ur.id
        WHERE ura.user_id = user_id_param
        AND ur.role_name = role_name_param
    );
END;
$$;