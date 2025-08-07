import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/bienvenue", label: "Bienvenue" },
  { to: "/", label: "Accueil" },
  { to: "/garde-robe", label: "Ma garde-robe" },
  { to: "/ajout", label: "Ajouter" },
  { to: "/recommandations", label: "Recommandations" },
  { to: "/historique", label: "Historique" },
  { to: "/profil", label: "Profil" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-tr from-[hsl(var(--brand))] to-[hsl(var(--brand-2))]" aria-hidden />
          DressMe
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="hero" size="sm">
            <Link to="/recommandations">Proposer une tenue</Link>
          </Button>
          <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t">
          <nav className="container py-2 grid">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm",
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;