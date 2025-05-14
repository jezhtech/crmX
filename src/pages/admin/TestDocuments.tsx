import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

const TestDocuments = () => {
  console.log("TestDocuments component is being rendered");
  
  return (
    <AppLayout requiredRole="admin">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Document Page</h1>
        <p>This is a test page to verify routing works!</p>
      </div>
    </AppLayout>
  );
};

export default TestDocuments; 