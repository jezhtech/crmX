import AppLayout from "@/components/layout/AppLayout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesSquare } from "lucide-react";

const ChatDashboardPage = () => {
  return (
    <AppLayout requiredRole="admin">
      <SEO title="Chat Dashboard | crmX" />
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Chat Dashboard</h1>
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader className="flex flex-row items-center justify-center">
            <MessagesSquare className="h-10 w-10 text-primary mr-4" />
            <CardTitle className="text-2xl">Chat Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-bold text-primary mb-4">Coming Soon!</h2>
              <p className="text-muted-foreground mb-6">
                Our advanced chat management dashboard is currently under development and will be available in the next update.
              </p>
              <p className="text-sm text-muted-foreground">
                This feature will allow you to train the AI assistant, manage conversations, and analyze chat performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChatDashboardPage; 