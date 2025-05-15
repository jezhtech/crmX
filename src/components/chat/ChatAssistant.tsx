import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/branding/Logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronUp, MessagesSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatAssistant = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  const renderDesktopChat = () => (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 shadow-lg transition-all duration-300",
      isMinimized ? "h-14 w-14" : "w-80"
    )}>
      {isMinimized ? (
        // Minimized chat bubble
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setIsMinimized(false)} 
                className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
              >
                <MessagesSquare className="h-6 w-6 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open chat assistant</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        // Full chat window
        <Card className="border-primary/20 h-[500px] flex flex-col">
          <CardHeader className="px-4 py-2 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center">
              <Logo variant="icon" size="small" className="mr-2" />
              <CardTitle className="text-md font-medium">crmX Assistant</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(true)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <div className="text-center px-4">
              <MessagesSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-primary mb-2">Coming Soon!</h2>
              <p className="text-sm text-muted-foreground">
                Our AI-powered chat assistant is currently under development and will be available in the next update.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="p-4 text-center border-t">
            <p className="text-xs text-muted-foreground w-full">
              The chat assistant will allow you to get instant help and information about using crmX.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
  
  const renderMobileChat = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
          >
            <MessagesSquare className="h-6 w-6 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full p-0">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Logo variant="icon" size="small" className="mr-2" />
              <CardTitle className="text-md font-medium">crmX Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
            <div className="text-center px-4">
              <MessagesSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-primary mb-2">Coming Soon!</h2>
              <p className="text-sm text-muted-foreground">
                Our AI-powered chat assistant is currently under development and will be available in the next update.
              </p>
            </div>
          </div>
          
          <div className="p-4 text-center border-t">
            <p className="text-xs text-muted-foreground">
              The chat assistant will allow you to get instant help and information about using crmX.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return isMobile ? renderMobileChat() : renderDesktopChat();
};

export default ChatAssistant; 