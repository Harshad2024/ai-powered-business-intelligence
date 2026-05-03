import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <BrainCircuit className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-6xl sm:text-7xl font-extrabold text-foreground mb-2">404</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="text-xs bg-muted px-2 py-1 rounded">{location.pathname}</code> doesn't exist.
        </p>
        <Link to="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
