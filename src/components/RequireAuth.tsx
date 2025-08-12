import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [loading, setLoading] = React.useState(true);
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);
  const location = useLocation();

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(!!session?.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null; // Keep it minimal; the page layout remains stable
  if (!isAuthed) return <Navigate to="/auth" replace state={{ from: location }} />;
  return children;
};

export default RequireAuth;
