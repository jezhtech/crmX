import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  className?: string;
  size?: "small" | "medium" | "large";
}

const Logo = ({ variant = "full", className, size = "medium" }: LogoProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return variant === "full" ? "h-6" : "h-5";
      case "medium":
        return variant === "full" ? "h-8" : "h-7";
      case "large":
        return variant === "full" ? "h-10" : "h-9";
      default:
        return variant === "full" ? "h-8" : "h-7";
    }
  };
  
  const renderLogo = () => {
    if (variant === "icon") {
      return (
        <div className="flex items-center">
          <span className="text-[#1EAEDB] font-bold text-2xl">X</span>
        </div>
      );
    }
    
    if (variant === "text") {
      return (
        <div className="flex items-center">
          <span className="font-bold text-xl">crm</span>
          <span className="text-[#1EAEDB] font-bold text-xl">X</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/db786a6f-bab1-461e-9e6e-e417e9298194.png" 
          alt="crmX Logo" 
          className={getSizeClasses()}
        />
      </div>
    );
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      {renderLogo()}
      {variant === "full" && (
        <div className="ml-2 text-[9px] tracking-widest uppercase text-gray-500">
          code the future
        </div>
      )}
    </div>
  );
};

export default Logo;
