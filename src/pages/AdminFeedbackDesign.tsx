import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackStats {
  total: number;
  love: number;
  mixed: number;
  dislike: number;
  percentages: {
    love: number;
    mixed: number;
    dislike: number;
  };
}

interface FeedbackItem {
  id: string;
  choice: 'LOVE' | 'MIXED' | 'DISLIKE';
  comment: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string;
}

export default function AdminFeedbackDesign() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Load stats
      const { data: statsData, error: statsError } = await supabase.functions.invoke(
        'design-feedback/stats'
      );

      if (statsError) throw statsError;
      setStats(statsData);

      // Load feedback list
      const { data: listData, error: listError } = await supabase.functions.invoke(
        'design-feedback/list'
      );

      if (listError) throw listError;
      setFeedbackList(listData.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportToCSV = () => {
    if (!feedbackList.length) return;

    const headers = ['Date', 'Choix', 'Commentaire', 'Utilisateur', 'Session ID'];
    const csvContent = [
      headers.join(','),
      ...feedbackList.map(item => [
        new Date(item.created_at).toLocaleDateString('fr-FR'),
        item.choice,
        `"${item.comment || ''}"`,
        item.user_id || 'anonyme',
        item.session_id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback-design-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChoiceBadge = (choice: string) => {
    switch (choice) {
      case 'LOVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">💚 J'adore</Badge>;
      case 'MIXED':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">😐 À peaufiner</Badge>;
      case 'DISLIKE':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🙅 Autre chose</Badge>;
      default:
        return <Badge>{choice}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFA] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFA] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#2F4B4E]">
            Feedback Design
          </h1>
          <div className="flex gap-3">
            <Button
              onClick={loadData}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={exportToCSV}
              disabled={!feedbackList.length}
              className="flex items-center gap-2 bg-[#2F4B4E] hover:bg-[#405F62]"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#93A3A5]">Total votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#2F4B4E]">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#93A3A5]">💚 J'adore</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.percentages.love}%
                </div>
                <div className="text-sm text-[#93A3A5]">{stats.love} votes</div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#93A3A5]">😐 À peaufiner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.percentages.mixed}%
                </div>
                <div className="text-sm text-[#93A3A5]">{stats.mixed} votes</div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#93A3A5]">🙅 Autre chose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.percentages.dislike}%
                </div>
                <div className="text-sm text-[#93A3A5]">{stats.dislike} votes</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Table */}
        <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-[#2F4B4E]">Détail des réponses</CardTitle>
          </CardHeader>
          <CardContent>
            {feedbackList.length === 0 ? (
              <div className="text-center py-8 text-[#93A3A5]">
                Aucun feedback pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-sm font-medium text-[#93A3A5]">Date</th>
                      <th className="text-left py-3 text-sm font-medium text-[#93A3A5]">Choix</th>
                      <th className="text-left py-3 text-sm font-medium text-[#93A3A5]">Commentaire</th>
                      <th className="text-left py-3 text-sm font-medium text-[#93A3A5]">Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackList.map((feedback) => (
                      <tr key={feedback.id} className="border-b border-gray-50 hover:bg-[#F8FAFA]">
                        <td className="py-4 text-sm text-[#2F4B4E]">
                          {new Date(feedback.created_at).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(feedback.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="py-4">
                          {getChoiceBadge(feedback.choice)}
                        </td>
                        <td className="py-4 text-sm text-[#2F4B4E] max-w-xs">
                          {feedback.comment ? (
                            <span className="line-clamp-2">{feedback.comment}</span>
                          ) : (
                            <span className="text-[#93A3A5] italic">Aucun commentaire</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-[#93A3A5]">
                          {feedback.user_id ? (
                            <span className="font-mono text-xs">{feedback.user_id.slice(0, 8)}...</span>
                          ) : (
                            <span>anonyme</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}