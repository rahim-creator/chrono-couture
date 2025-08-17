-- Compléter le système d'administration avec la structure demandée

-- Créer la table des assignations de rôles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Mettre à jour les rôles existants pour avoir toutes les descriptions
INSERT INTO public.user_roles (role_name, description)
VALUES 
    ('admin', 'Administrateur système avec accès complet'),
    ('moderator', 'Modérateur avec accès limité'),
    ('user', 'Utilisateur standard')
ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description;

-- Créer la fonction has_role avec la signature demandée
CREATE OR REPLACE FUNCTION public.has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Activer Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_role_assignments_select" ON public.user_role_assignments;
DROP POLICY IF EXISTS "admins_can_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_assignments" ON public.user_role_assignments;

-- Créer les nouvelles politiques RLS
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "user_role_assignments_select" ON public.user_role_assignments 
FOR SELECT USING (true);

-- Politique pour que les admins puissent gérer les rôles
CREATE POLICY "admins_can_manage_roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_can_manage_assignments" ON public.user_role_assignments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Assigner le rôle admin à rahimnemouchi@live.fr
WITH user_info AS (
    SELECT id as user_id FROM auth.users WHERE email = 'rahimnemouchi@live.fr'
),
admin_role AS (
    SELECT id as role_id FROM public.user_roles WHERE role_name = 'admin'
)
INSERT INTO public.user_role_assignments (user_id, role_id)
SELECT user_id, role_id
FROM user_info, admin_role
WHERE user_info.user_id IS NOT NULL AND admin_role.role_id IS NOT NULL
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Mettre à jour les métadonnées utilisateur
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "is_admin": true}'::jsonb
WHERE email = 'rahimnemouchi@live.fr';

-- Requête de vérification finale
SELECT 'Migration terminée avec succès' as status;