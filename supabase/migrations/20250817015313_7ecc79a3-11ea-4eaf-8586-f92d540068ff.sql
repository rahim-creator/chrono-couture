-- Ajouter rahimnemouchi@live.fr en tant qu'admin
-- Cette migration cherche l'utilisateur par email et lui attribue le rôle admin

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Chercher l'utilisateur par email dans auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'rahimnemouchi@live.fr';
    
    -- Si l'utilisateur existe, lui attribuer le rôle admin
    IF target_user_id IS NOT NULL THEN
        -- Supprimer le rôle existant s'il y en a un pour éviter les doublons
        DELETE FROM public.user_roles 
        WHERE user_id = target_user_id AND role = 'admin';
        
        -- Ajouter le rôle admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin');
        
        RAISE NOTICE 'Rôle admin attribué à rahimnemouchi@live.fr (user_id: %)', target_user_id;
    ELSE
        RAISE NOTICE 'Utilisateur rahimnemouchi@live.fr non trouvé dans auth.users. Il doit d''abord s''inscrire sur l''application.';
    END IF;
END $$;