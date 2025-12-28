'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useIoTStore } from "@/hooks/useIoTStore";
import { Plus, Edit, Trash2, BookOpen, Building2, Hash } from "lucide-react";
import { toast } from "sonner";

export default function ProgramStudiPage() {
  const { prodi, addProdi, updateProdi, removeProdi } = useIoTStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProdi, setEditingProdi] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({
    isOpen: false,
    id: null,
    name: null,
  });
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    faculty: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProdi) {
        // Update existing
        await updateProdi(editingProdi, formData);
        toast.success("Program Studi berhasil diupdate!");
        setEditingProdi(null);
      } else {
        // Add new
        await addProdi(formData);
        toast.success("Program Studi berhasil ditambahkan!");
      }

      setFormData({ code: "", name: "", faculty: "" });
      setShowAddModal(false);
    } catch (error) {
      toast.error("Gagal menyimpan Program Studi!");
    }
  };

  const handleEdit = (id: string) => {
    const prodiToEdit = prodi.find(p => p.id === id);
    if (prodiToEdit) {
      setFormData({
        code: prodiToEdit.code,
        name: prodiToEdit.name,
        faculty: prodiToEdit.faculty || "",
      });
      setEditingProdi(id);
      setShowAddModal(true);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await removeProdi(deleteDialog.id);
      toast.success(`${deleteDialog.name} berhasil dihapus`);
      setDeleteDialog({ isOpen: false, id: null, name: null });
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus Program Studi");
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProdi(null);
    setFormData({ code: "", name: "", faculty: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500 mt-1">
            Kelola Program Studi dan konfigurasi sistem
          </p>
        </div>
      </div>

      {/* Program Studi Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Program Studi
              </CardTitle>
              <CardDescription>
                Kelola daftar Program Studi untuk Mahasiswa
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-black hover:bg-gray-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Prodi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {prodi.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium">Belum ada Program Studi</p>
              <p className="text-sm mt-1">
                Klik "Tambah Prodi" untuk menambahkan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prodi.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center text-white font-bold">
                      {p.code}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <div className="flex gap-4 mt-1">
                        {p.faculty && (
                          <span className="text-sm text-gray-600">
                            <strong>Fakultas:</strong> {p.faculty}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">
                          <strong>Mahasiswa:</strong> {p._count?.students || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{p.code}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(p.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>
                {editingProdi ? "Edit Program Studi" : "Tambah Program Studi"}
              </CardTitle>
              <CardDescription>
                {editingProdi
                  ? "Update informasi Program Studi"
                  : "Tambahkan Program Studi baru"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4" />
                    Kode Prodi
                  </label>
                  <Input
                    placeholder="Contoh: TI, SI, IF"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kode singkat (maksimal 10 karakter)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    Nama Program Studi
                  </label>
                  <Input
                    placeholder="Contoh: Teknik Informatika"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4" />
                    Fakultas (Opsional)
                  </label>
                  <Input
                    placeholder="Contoh: Fakultas Teknik"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-black hover:bg-gray-800"
                  >
                    {editingProdi ? "Update" : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Program Studi digunakan untuk mengelompokkan Mahasiswa</p>
          <p>• Setiap Mahasiswa dapat memiliki satu Program Studi</p>
          <p>• Program Studi tidak dapat dihapus jika masih ada Mahasiswa</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: null })}
        onConfirm={confirmDelete}
        title="Hapus Program Studi"
        description={`Apakah Anda yakin ingin menghapus Program Studi ${deleteDialog.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
