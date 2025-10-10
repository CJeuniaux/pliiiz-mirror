import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Eye, ChevronLeft, Trash2, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RequestItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  type: "sent" | "received";
  date: string;
}

export function KitRequestsScreen() {
  const navigate = useNavigate();

  // Simplified mock data matching wireframe
  const mockRequests = [
    { id: 1, checked: true, name: "Marie Dubois" },
    { id: 2, checked: true, name: "Thomas Martin" },
    { id: 3, checked: false, name: "Sophie Laurent" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with Back and Delete */}
      <div className="px-4 py-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="h-4 bg-primary rounded-full w-24"></div>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Requests List */}
      <div className="px-4 flex-1">
        {mockRequests.map((request) => (
          <Card key={request.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="mt-1">
                  <Checkbox 
                    checked={request.checked}
                    className="w-5 h-5 rounded-full border-2 border-primary data-[state=checked]:bg-primary"
                  />
                </div>
                
                {/* Avatar placeholder */}
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="h-4 bg-primary rounded-full w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded-full w-1/2"></div>
                  </div>
                  <div className="h-3 bg-primary rounded-full w-1/3 mb-3"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{request.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom sections */}
      <div className="px-4 mb-6">
        <div className="h-4 bg-primary rounded-full w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="aspect-square bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="px-4 pb-8 flex gap-3">
        <Button variant="outline" className="flex-1">
          Action 1
        </Button>
        <Button variant="kit" className="flex-1">
          Action 2
        </Button>
      </div>

      {/* Add Request Button */}
      <div className="px-4 pb-8">
        <Button 
          variant="kit" 
          size="lg" 
          className="w-full h-14"
          onClick={() => navigate('/requests/new')}
        >
          Nouvelle demande
        </Button>
      </div>
    </div>
  );
}