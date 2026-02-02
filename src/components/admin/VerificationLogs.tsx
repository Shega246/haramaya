import React, { useState } from 'react';
import { Search, Loader2, History, Calendar, User, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface VerificationLog {
  id: string;
  student_id: string;
  student_id_text: string;
  student_name: string;
  meal_category: 'breakfast' | 'lunch' | 'dinner';
  verification_date: string;
  verification_time: string;
  verification_result: boolean;
  result_reason: string;
  ticker_id: string;
  verification_method: string;
  cheating_count: number;
  created_at: string;
}

export const VerificationLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['verificationLogs', dateFilter, categoryFilter, resultFilter],
    queryFn: async () => {
      let query = supabase
        .from('verification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (dateFilter) {
        query = query.eq('verification_date', dateFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('meal_category', categoryFilter as 'breakfast' | 'lunch' | 'dinner');
      }

      if (resultFilter !== 'all') {
        query = query.eq('verification_result', resultFilter === 'yes');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as VerificationLog[];
    }
  });

  const filteredLogs = logs?.filter(log => 
    log.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.student_id_text?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getResultBadgeVariant = (result: boolean, reason: string) => {
    if (result) return 'default';
    if (reason === 'duplicate') return 'destructive';
    return 'secondary';
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'valid': return 'Valid';
      case 'duplicate': return 'Duplicate (Cheating)';
      case 'expired': return 'Expired';
      case 'blocked': return 'Blocked';
      case 'time_invalid': return 'Invalid Time';
      case 'not_found': return 'Not Found';
      default: return reason;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    if (!filteredLogs.length) return;

    const headers = ['Date', 'Time', 'Student Name', 'Student ID', 'Meal', 'Result', 'Reason', 'Method'];
    const rows = filteredLogs.map(log => [
      log.verification_date,
      new Date(log.created_at).toLocaleTimeString(),
      log.student_name,
      log.student_id_text,
      log.meal_category,
      log.verification_result ? 'YES' : 'NO',
      log.result_reason,
      log.verification_method
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Logs</h1>
          <p className="text-muted-foreground">Complete gate verification history</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Meal Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="yes">YES (Approved)</SelectItem>
                <SelectItem value="no">NO (Denied)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No verification logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Card key={log.id} className={`hover:shadow-soft transition-shadow ${
              log.result_reason === 'duplicate' ? 'border-destructive/50 bg-destructive/5' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      log.verification_result 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {log.student_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.student_id_text}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {log.meal_category}
                    </Badge>
                    <Badge 
                      variant={getResultBadgeVariant(log.verification_result, log.result_reason)}
                      className="font-bold"
                    >
                      {log.verification_result ? 'YES' : 'NO'}
                    </Badge>
                    <Badge variant="secondary">
                      {getReasonLabel(log.result_reason)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {log.verification_method}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(log.created_at)}
                  </div>
                </div>

                {log.cheating_count > 0 && (
                  <div className="mt-2 pt-2 border-t border-destructive/30">
                    <Badge variant="destructive">
                      Cheating Attempt #{log.cheating_count}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination info */}
      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredLogs.length} logs (max 200)
      </p>
    </div>
  );
};
