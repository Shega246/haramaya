import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit, Loader2, UserPlus, X, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ImageUpload';
import defaultAvatar from '@/assets/default-avatar.png';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  department: string;
  year: number;
  semester: number;
  semester_expiry_date: string;
  status: 'active' | 'expired' | 'blocked';
  blocked_reason?: string | null;
  blocked_at?: string | null;
}

export const StudentManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    department: '',
    year: 1,
    semester: 1,
    semester_expiry_date: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Student[];
    }
  });

  const addStudentMutation = useMutation({
    mutationFn: async (data: typeof formData & { photo_url?: string | null }) => {
      const { error } = await supabase.from('students').insert([{
        ...data,
        photo_url: data.photo_url || null,
        status: 'active'
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student added successfully' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData & { photo_url?: string | null } }) => {
      const { error } = await supabase.from('students').update({
        ...data,
        photo_url: data.photo_url || null
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student updated successfully' });
      setEditingStudent(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const unblockStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').update({
        status: 'active',
        blocked_at: null,
        blocked_reason: null,
        daily_cheating_count: 0
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast({ title: 'Success', description: 'Student unblocked successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      department: '',
      year: 1,
      semester: 1,
      semester_expiry_date: '',
    });
    setPhotoUrl(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setPhotoUrl(student.photo_url);
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      department: student.department,
      year: student.year,
      semester: student.semester,
      semester_expiry_date: student.semester_expiry_date,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataWithPhoto = { ...formData, photo_url: photoUrl };
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data: dataWithPhoto });
    } else {
      addStudentMutation.mutate(dataWithPhoto);
    }
  };

  const filteredStudents = students?.filter(s => 
    s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const departments = [
    'Computer Science',
    'Electrical Engineering',
    'Civil Engineering',
    'Agriculture',
    'Medicine',
    'Law',
    'Business Administration',
    'Economics',
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage registered students</p>
        </div>

        <Dialog open={isAddDialogOpen || !!editingStudent} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingStudent(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <div>
                  <Label className="block text-center mb-2">Student Photo</Label>
                  <ImageUpload
                    bucket="student-photos"
                    currentImage={photoUrl}
                    onUpload={(url) => setPhotoUrl(url)}
                    onRemove={() => setPhotoUrl(null)}
                    previewSize="md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value.toUpperCase()})}
                  placeholder="HU/2024/001"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({...formData, department: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map(y => (
                        <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    value={formData.semester.toString()}
                    onValueChange={(value) => setFormData({...formData, semester: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="semester_expiry_date">Semester Expiry Date</Label>
                <Input
                  id="semester_expiry_date"
                  type="date"
                  value={formData.semester_expiry_date}
                  onChange={(e) => setFormData({...formData, semester_expiry_date: e.target.value})}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingStudent(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addStudentMutation.isPending || updateStudentMutation.isPending}
                >
                  {(addStudentMutation.isPending || updateStudentMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingStudent ? 'Update' : 'Add'} Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <p className="text-muted-foreground">No students found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <Card key={student.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.photo_url || defaultAvatar} />
                    <AvatarFallback>{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {student.first_name} {student.last_name}
                      </h3>
                      <Badge variant={
                        student.status === 'active' ? 'default' : 
                        student.status === 'blocked' ? 'destructive' : 'secondary'
                      }>
                        {student.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{student.student_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.department}</p>
                    <p className="text-xs text-muted-foreground">
                      Year {student.year} • Semester {student.semester}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(student)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {student.status === 'blocked' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => unblockStudentMutation.mutate(student.id)}
                      disabled={unblockStudentMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteStudentMutation.mutate(student.id)}
                    disabled={deleteStudentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
