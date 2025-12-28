'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useIoTStore } from "@/hooks/useIoTStore";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { Plus, Scan, Search, Trash2, IdCard, GraduationCap, Hash, BookOpen, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

export default function StudentsPage() {
  const { students, addStudent, removeStudent, checkUid, prodi } = useIoTStore();
  const serialConnection = useSerialConnection();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUID, setScannedUID] = useState("");
  const [showProdiDropdown, setShowProdiDropdown] = useState(false);
  const [prodiSearchQuery, setProdiSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({
    isOpen: false,
    id: null,
    name: null,
  });
  const [formData, setFormData] = useState({
    uid: "",
    name: "",
    class: "",
    nis: "",
    prodiId: "",
  });

  // Filtered prodi based on search
  const filteredProdi = prodi.filter(p =>
    p.name.toLowerCase().includes(prodiSearchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(prodiSearchQuery.toLowerCase())
  );

  // Get selected prodi name
  const selectedProdi = prodi.find(p => p.id === formData.prodiId);

  // Listen untuk scan KTP
  useEffect(() => {
    if (!isScanning) return;

    console.log('👂 Students page: Listening for scan result...');

    const handleScanResult = async (message: any) => {
      console.log('📨 Students page received:', message);

      // Listen for CARD_SCANNED type with UID (from Arduino scan)
      if (message.type === 'CARD_SCANNED' && message.data?.uid) {
        const uid = message.data.uid;
        console.log('✅ Found UID from CARD_SCANNED:', uid);
        setScannedUID(uid);
        setFormData(prev => ({ ...prev, uid }));
        setIsScanning(false);

        // Check if UID already registered
        const existing = await checkUid(uid);
        if (existing) {
          toast.error(`KTP ini sudah terdaftar untuk ${existing.name}!`);
        } else {
          toast.success("KTP berhasil di-scan! Silakan lengkapi data.");
        }
      }
      // Fallback for INFO type with UID
      else if (message.type === 'INFO' && message.data?.uid) {
        const uid = message.data.uid;
        console.log('✅ Found UID from INFO:', uid);
        setScannedUID(uid);
        setFormData(prev => ({ ...prev, uid }));
        setIsScanning(false);

        const existing = await checkUid(uid);
        if (!existing) {
          toast.success("KTP berhasil di-scan! Silakan lengkapi data.");
        }
      }
    };

    // Subscribe to both Serial and WiFi
    const unsubscribeSerial = serialConnection.serialService.subscribe(handleScanResult);
    const unsubscribeWifi = serialConnection.websocketService.onMessage(handleScanResult);

    return () => {
      console.log('🔌 Students page: Cleaning up listeners');
      unsubscribeSerial();
      unsubscribeWifi();
    };
  }, [isScanning, serialConnection, checkUid]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanKTP = async () => {
    if (!serialConnection.isConnected) {
      toast.error("Perangkat belum terhubung!");
      return;
    }

    setIsScanning(true);
    toast.info("Tempelkan KTP pada reader...");

    // Request scan dari Arduino - works for both Serial and WiFi
    serialConnection.sendCommand('SCAN');

    // Auto stop scanning after 30 seconds
    setTimeout(() => {
      if (isScanning) {
        setIsScanning(false);
        toast.warning("Scan timeout. Coba lagi.");
      }
    }, 30000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.uid) {
      toast.error("Silakan scan KTP terlebih dahulu!");
      return;
    }

    if (!formData.name || !formData.class || !formData.nis) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      // Check UID one more time
      const existing = await checkUid(formData.uid);
      if (existing) {
        toast.error("KTP ini sudah terdaftar!");
        return;
      }

      // Add to database
      await addStudent({
        id: Date.now().toString(),
        name: formData.name,
        class: formData.class,
        nis: formData.nis,
        uid: formData.uid,
        prodiId: formData.prodiId || null,
        createdAt: new Date(),
      });

      // Send to Arduino (optional, for sync) - works for both Serial and WiFi
      if (serialConnection.isConnected) {
        serialConnection.sendCommand(`ADD_Mahasiswa,${formData.name},${formData.class},${formData.nis},${formData.uid}`);
      }

      toast.success(`${formData.name} berhasil ditambahkan!`);

      // Reset form
      setFormData({ uid: "", name: "", class: "", nis: "", prodiId: "" });
      setScannedUID("");
      setShowAddModal(false);
      setProdiSearchQuery("");
    } catch (error) {
      toast.error("Gagal menambahkan Mahasiswa!");
      console.error(error);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await removeStudent(deleteDialog.id);
      toast.success(`${deleteDialog.name} berhasil dihapus`);
      setDeleteDialog({ isOpen: false, id: null, name: null });
    } catch (error) {
      toast.error("Gagal menghapus Mahasiswa");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Mahasiswa</h1>
          <p className="text-gray-500 mt-1">
            Kelola data Mahasiswa dengan KTP
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-black hover:bg-gray-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Mahasiswa
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Cari nama, kelas, atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Mahasiswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              KTP Terdaftar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {students.filter(s => s.uid).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hasil Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mahasiswa</CardTitle>
          <CardDescription>
            {filteredStudents.length} Mahasiswa ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium">Belum ada Mahasiswa</p>
              <p className="text-sm mt-1">
                Klik tombol "Tambah Mahasiswa" untuk memulai
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          <strong>Kelas:</strong> {student.class}
                        </span>
                        <span className="text-sm text-gray-600">
                          <strong>NIS:</strong> {student.nis}
                        </span>
                      </div>
                      {student.prodi && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {student.prodi.code}
                          </Badge>
                          <span className="text-sm text-gray-600">{student.prodi.name}</span>
                        </div>
                      )}
                      {student.uid && (
                        <code className="text-xs text-gray-500 mt-1 block">
                          KTP: {student.uid}
                        </code>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.uid ? (
                      <Badge variant="success">KTP Terdaftar</Badge>
                    ) : (
                      <Badge variant="danger">Belum Scan KTP</Badge>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(student.id, student.name)}
                      className="bg-red-500 hover:bg-red-600"
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Tambah Mahasiswa Baru</CardTitle>
              <CardDescription>
                Scan KTP Mahasiswa dan lengkapi data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Scan KTP Section */}
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                  {scannedUID ? (
                    <div className="space-y-3">
                      <div className="h-16 w-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                        <IdCard className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-600">KTP Berhasil Di-scan!</p>
                        <code className="text-sm text-gray-600 mt-1 block">
                          {scannedUID}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Scan className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {isScanning ? "Menunggu KTP..." : "Scan KTP Mahasiswa"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {isScanning
                            ? "Tempelkan KTP pada reader RFID"
                            : "Klik tombol di bawah untuk memulai scan"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleScanKTP}
                        disabled={!serialConnection.isConnected || isScanning}
                        className="mt-2"
                      >
                        {isScanning ? (
                          <>
                            <Scan className="mr-2 h-4 w-4 animate-pulse" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-4 w-4" />
                            Scan KTP
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <GraduationCap className="h-4 w-4" />
                      Nama Lengkap
                    </label>
                    <Input
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <IdCard className="h-4 w-4" />
                      Kelas
                    </label>
                    <Input
                      placeholder="Contoh: 3A, TI-21, etc"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <Hash className="h-4 w-4" />
                      NIS / NPM
                    </label>
                    <Input
                      placeholder="Nomor Induk Mahasiswa/Mahasiswa"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      required
                    />
                  </div>

                  {/* Program Studi Searchable Select */}
                  <div className="relative">
                    <label className="text-sm font-medium flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4" />
                      Program Studi <span className="text-gray-400 text-xs">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowProdiDropdown(!showProdiDropdown)}
                        className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <span className={selectedProdi ? "text-gray-900" : "text-gray-400"}>
                          {selectedProdi ? (
                            <span className="flex items-center gap-2">
                              <Badge variant="outline">{selectedProdi.code}</Badge>
                              {selectedProdi.name}
                            </span>
                          ) : (
                            "Pilih Program Studi"
                          )}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>

                      {/* Dropdown */}
                      {showProdiDropdown && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                          {/* Search Input */}
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Cari program studi..."
                                value={prodiSearchQuery}
                                onChange={(e) => setProdiSearchQuery(e.target.value)}
                                className="pl-8"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="max-h-60 overflow-y-auto">
                            {/* Clear Selection Option */}
                            {formData.prodiId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, prodiId: "" });
                                  setShowProdiDropdown(false);
                                  setProdiSearchQuery("");
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 border-b"
                              >
                                × Hapus Pilihan
                              </button>
                            )}

                            {filteredProdi.length === 0 ? (
                              <div className="px-3 py-6 text-center text-sm text-gray-500">
                                {prodi.length === 0
                                  ? "Belum ada program studi. Tambahkan di halaman Program Studi."
                                  : "Tidak ada hasil"}
                              </div>
                            ) : (
                              filteredProdi.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, prodiId: p.id });
                                    setShowProdiDropdown(false);
                                    setProdiSearchQuery("");
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {p.code}
                                    </Badge>
                                    <span className="text-sm">{p.name}</span>
                                  </div>
                                  {formData.prodiId === p.id && (
                                    <Check className="h-4 w-4 text-black" />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-black hover:bg-gray-800"
                    disabled={!scannedUID || isScanning}
                  >
                    Simpan Mahasiswa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ uid: "", name: "", class: "", nis: "", prodiId: "" });
                      setScannedUID("");
                      setIsScanning(false);
                      setProdiSearchQuery("");
                      setShowProdiDropdown(false);
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: null })}
        onConfirm={confirmDelete}
        title="Hapus Mahasiswa"
        description={`Apakah Anda yakin ingin menghapus mahasiswa ${deleteDialog.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
