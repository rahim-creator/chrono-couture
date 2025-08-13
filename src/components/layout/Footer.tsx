import { Link } from "react-router-dom";  
  
const Footer = () => {  
  return (  
    <footer className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50">  
      <div className="container py-8">  
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">  
          <div className="flex items-center gap-2">  
            <span className="inline-block h-6 w-6 rounded bg-gradient-to-tr from-[hsl(var(--brand))] to-[hsl(var(--brand-2))]" aria-hidden />  
            <span className="font-semibold">DressMe</span>  
          </div>  
            
          <nav className="flex flex-wrap justify-center gap-6 text-sm" aria-label="Navigation légale">  
            <Link   
              to="/mentions-legales"   
              className="text-muted-foreground hover:text-foreground transition-colors"  
            >  
              Mentions légales  
            </Link>  
            <Link   
              to="/politique-confidentialite"   
              className="text-muted-foreground hover:text-foreground transition-colors"  
            >  
              Politique de confidentialité  
            </Link>  
            <Link   
              to="/politique-cookies"   
              className="text-muted-foreground hover:text-foreground transition-colors"  
            >  
              Politique de cookies  
            </Link>  
          </nav>  
            
          <div className="text-xs text-muted-foreground">  
            © 2024 DressMe. Tous droits réservés.  
          </div>  
        </div>  
      </div>  
    </footer>  
  );  
};  
  
export default Footer;