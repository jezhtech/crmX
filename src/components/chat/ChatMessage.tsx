import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/services/chatAssistant";
import { Avatar } from "@/components/ui/avatar";
import Logo from "@/components/branding/Logo";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  
  return (
    <div 
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div 
        className={cn(
          "flex gap-3 max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {isUser ? (
          <Avatar className="h-8 w-8 bg-primary">
            <span className="text-xs font-semibold text-white">
              {message.userName?.substring(0, 2).toUpperCase() || "U"}
            </span>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full overflow-hidden bg-[#1EAEDB] flex items-center justify-center">
            <Logo variant="icon" size="small" className="text-white" />
          </div>
        )}
        
        <div 
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 