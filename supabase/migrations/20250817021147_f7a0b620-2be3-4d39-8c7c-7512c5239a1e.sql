-- Migration vers le nouveau système d'administration avec tables de rôles séparées

-- Sauvegarder les données existantes avant la migration
CREATE TEMP TABLE temp_existing_roles AS 
SELECT user_id, role::text as role_name FROM public.user_roles;

-- Supprimer l'ancienne structure
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Créer la nouvelle table des rôles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer la table des assignations de rôles
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Insérer les rôles par défaut
INSERT INTO public.user_roles (role_name, description)
VALUES 
    ('admin', 'Administrateur système avec accès complet'),
    ('moderator', 'Modérateur avec accès limité'),
    ('user', 'Utilisateur standard')
ON CONFLICT (role_name) DO NOTHING;

-- Migrer les données existantes
INSERT INTO public.user_role_assignments (user_id, role_id)
SELECT 
    ter.user_id,
    ur.id
FROM temp_existing_roles ter
JOIN public.user_roles ur ON ur.role_name = ter.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Créer la fonction has_role mise à jour
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

-- Créer les politiques RLS
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
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Mettre à jour les métadonnées utilisateur
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "is_admin": true}'::jsonb
WHERE email = 'rahimnemouchi@live.fr';

-- Requête de vérification
SELECT 'Migration terminée - Vérification:' as status;

SELECT
    u.email,
    ur.role_name,
    ura.created_at as assigned_at,
    public.has_role(u.id, 'admin') as is_admin_function,
    u.raw_user_meta_data->'role' as user_role_meta
FROM auth.users u
LEFT JOIN public.user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN public.user_roles ur ON ura.role_id = ur.id
WHERE u.email = 'rahimnemouchi@live.fr';