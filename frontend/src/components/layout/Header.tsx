import { Link, useLocation } from "react-router-dom";
import { Book, Users, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/texts", icon: Book, label: "Texts" },
    { path: "/persons", icon: Users, label: "Persons" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center gradient-primary">
              <Book className="w-6 h-6 text-white" />
          </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">OpenPecha</h1>
              <p className="text-xs text-muted-foreground">Text Cataloger</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth",
                    isActive
                      ? "gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
