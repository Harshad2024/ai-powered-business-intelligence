import { Bell, LogOut, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/services/api";
import { toast } from "sonner";

export function TopNavbar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "User";

  const handleLogout = () => {
    authApi.logout();
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger />
        <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate">
          AI-Powered Business Intelligence
        </h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-2 h-9 px-3">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">{userName}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-9 w-9"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
