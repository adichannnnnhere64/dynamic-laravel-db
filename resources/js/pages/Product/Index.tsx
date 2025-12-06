import React, { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table as UITable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Input
} from "@/components/ui/input";
import {
    Button
} from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Badge
} from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Filter,
    Download,
    Upload,
    MoreVertical,
    RefreshCw,
    ChevronLeft,
    Database,
    Grid3x3,
    QrCode,
    Copy,
    Check,
    X,
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

import { Link } from '@inertiajs/react'

type Product = {
    [key: string]: any;
};

interface IndexProps {
    products: { data: Product[]; links: any[] };
    fields: string[];
    idField: string;
    connections: any[];
    activeConnection: any;
    activeTable: any;
    editableFields: string[];
    inputTypes: Record<string, string>;
}

const BarcodeScanner = ({
    onScan,
    onError,
    active,
}: {
    onScan: (data: string) => void;
    onError: (error: Error) => void;
    active: boolean;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        const setupScanner = async () => {
            try {
                if (!(window as any).ZXing) {
                    const script = document.createElement("script");
                    script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
                    document.head.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });
                }

                if (!isMounted || !videoRef.current) return;
                const { BrowserMultiFormatReader } = (window as any).ZXing;

                codeReaderRef.current = new BrowserMultiFormatReader();

                if (active) {
                    const devices = await codeReaderRef.current.listVideoInputDevices();

                    let selectedDeviceId = devices[0]?.deviceId;
                    const backCam = devices.find((d: any) =>
                        d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("environment")
                    );

                    if (backCam) {
                        selectedDeviceId = backCam.deviceId;
                    }

                    await codeReaderRef.current.decodeFromVideoDevice(
                        selectedDeviceId,
                        videoRef.current,
                        (result: any, err: any) => {
                            if (result) {
                                onScan(result.getText());
                            }
                            if (err && !(err.name === "NotFoundException")) {
                                onError(err);
                            }
                        }
                    );
                }
            } catch (err: any) {
                onError(err);
            }
        };

        setupScanner();

        return () => {
            isMounted = false;
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, [active, onScan, onError]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
        />
    );
};

export default function Index({
    products,
    connections,
    activeConnection,
    activeTable,
    fields,
    idField,
    editableFields,
    inputTypes
}: IndexProps) {
    const [showScanner, setShowScanner] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);

    const switchConnection = (connId: string) => {
        router.get('/product', {
            conn: connId,
            table: connections.find(c => c.id.toString() === connId)?.tables?.[0]?.id || null
        }, { preserveState: true });
    };

    const switchTable = (tableId: string) => {
        router.get('/product', {
            conn: activeConnection.id,
            table: tableId
        }, { preserveState: true });
    };

    const handleScan = (code: string) => {
        setSearch(code);
        router.get('/product', {
            search: code,
            conn: activeConnection.id,
            table: activeTable.id
        }, { preserveState: true });
        setShowScanner(false);
        toast.success("Scanned successfully", {
            description: `Searching for: ${code}`
        });
    };

    const goToEdit = (product: Product) => {
        router.post('/product/search', {
            table_id: activeTable.id,
            connection_id: activeConnection.id,
            [idField]: product[idField]
        });
    };

    const handleDelete = (product: Product) => {
        const idValue = product[idField];
        router.delete('/product/delete', {
            data: {
                table_id: activeTable.id,
                connection_id: activeConnection.id,
                [idField]: idValue
            },
            onSuccess: () => {
                toast.success("Product deleted", {
                    description: `${idField}: ${idValue} has been removed`
                });
            }
        });
    };

    const handleBulkDelete = () => {
        if (selectedRows.length === 0) {
            toast.error("No items selected");
            return;
        }

        if (!confirm(`Delete ${selectedRows.length} selected items?`)) return;

        // selectedRows.forEach(id => {
            router.delete('/product/bulk-delete', {
                data: {
                    table_id: activeTable.id,
                    connection_id: activeConnection.id,
                    rows: selectedRows
                }
            });
        // });

        setSelectedRows([]);
        toast.success("Bulk deletion completed", {
            description: `${selectedRows.length} items deleted`
        });
    };

    const toggleRowSelection = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    const selectAllRows = () => {
        if (selectedRows.length === products.data.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(products.data.map(p => p[idField]));
        }
    };

    const refreshData = () => {
        router.reload({
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success("Data refreshed");
            }
        });
    };

    return (
        <AppLayout>
            <Head title={`${activeTable.name} - Products`} />

            <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Header */}
                <div className="border-b bg-white dark:bg-black">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.history.back()}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Grid3x3 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">{activeTable.name}</h1>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Database className="w-3 h-3 mr-1" />
                                                {activeConnection.name}
                                            </span>
                                            <span>•</span>
                                            <span>{activeTable.table_name}</span>
                                            <span>•</span>
                                            <Badge variant="outline" className="text-xs">
                                                {products.data.length} records
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Select value={activeConnection.id.toString()} onValueChange={switchConnection}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue>{activeConnection.name}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connections.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4" />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={activeTable.id.toString()} onValueChange={switchTable}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue>{activeTable.name}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeConnection.tables.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Grid3x3 className="w-4 h-4" />
                                                    {t.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    onClick={refreshData}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Product Records</CardTitle>
                                    <CardDescription>
                                        Manage {activeTable.name} table in {activeConnection.database}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedRows.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            className="gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Selected ({selectedRows.length})
                                        </Button>
                                    )}
                                    <Dialog open={showScanner} onOpenChange={setShowScanner}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="gap-2">
                                                <QrCode className="w-4 h-4" />
                                                Scan QR
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Scan QR/Barcode</DialogTitle>
                                                <DialogDescription>
                                                    Point your camera at a QR code or barcode to scan
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                <BarcodeScanner
                                                    onScan={handleScan}
                                                    onError={(error) => {
                                                        toast.error("Scanner Error", {
                                                            description: error.message
                                                        });
                                                        setShowScanner(false);
                                                    }}
                                                    active={showScanner}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center pt-4">
                                                <div className="text-sm text-gray-500">
                                                    Scanned value: {search}
                                                </div>
                                                <Button onClick={() => setShowScanner(false)}>
                                                    Close
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Button asChild>
                                        <Link href={`/product/create?conn=${activeConnection.id}&table=${activeTable.id}`} className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add New
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder={`Search in ${fields.join(", ")}`}
                                            value={search}
                                            onChange={e => {
                                                setSearch(e.target.value);
                                                router.get('/product', {
                                                    search: e.target.value,
                                                    conn: activeConnection.id,
                                                    table: activeTable.id
                                                }, { preserveState: true });
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {/* <Button */}
                                    {/*     variant="outline" */}
                                    {/*     onClick={() => setShowFilters(!showFilters)} */}
                                    {/*     className="gap-2" */}
                                    {/* > */}
                                    {/*     <Filter className="w-4 h-4" /> */}
                                    {/*     Filter */}
                                    {/* </Button> */}
                                    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                                        <DialogTrigger asChild>
                                            {/* <Button variant="outline" className="gap-2"> */}
                                            {/*     <Download className="w-4 h-4" /> */}
                                            {/*     Export */}
                                            {/* </Button> */}
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Export Data</DialogTitle>
                                                <DialogDescription>
                                                    Export {activeTable.name} table data
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button variant="outline">
                                                        CSV
                                                    </Button>
                                                    <Button variant="outline">
                                                        Excel
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <UITable>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.length === products.data.length && products.data.length > 0}
                                                    onChange={selectAllRows}
                                                    className="rounded"
                                                />
                                            </TableHead>
                                            {fields.map(f => (
                                                <TableHead key={f} className="font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        {f}
                                                        {f === idField && (
                                                            <Badge variant="outline" className="text-xs">
                                                                ID
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.data.length > 0 ? (
                                            products.data.map((product, index) => (
                                                <TableRow key={index} className="hover:bg-gray-50 dark:bg-black group">
                                                    <TableCell>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.includes(product[idField])}
                                                            onChange={() => toggleRowSelection(product[idField])}
                                                            className="rounded"
                                                        />
                                                    </TableCell>
                                                    {fields.map(f => (
                                                        <TableCell key={f}>
                                                            <div className="max-w-xs truncate" title={String(product[f] || '')}>
                                                                {String(product[f] || '')}
                                                            </div>
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => goToEdit(product)}
                                                                className="gap-1"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                                Edit
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="gap-1"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        Delete
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete this record? This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDelete(product)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" variant="ghost">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => goToEdit(product)}>
                                                                        <Edit className="w-4 h-4 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(product[idField]);
                                                                            toast.success("Copied to clipboard", {
                                                                                description: `${idField}: ${product[idField]}`
                                                                            });
                                                                        }}
                                                                    >
                                                                        <Copy className="w-4 h-4 mr-2" />
                                                                        Copy ID
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <DropdownMenuItem className="text-red-600">
                                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </AlertDialogTrigger>
                                                                    </AlertDialog>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={fields.length + 2} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Grid3x3 className="w-12 h-12 text-gray-400 mb-4" />
                                                        <h3 className="text-lg font-semibold mb-2">No products found</h3>
                                                        <p className="text-gray-600 mb-4">
                                                            {search ? 'No results match your search.' : 'Start by adding your first product.'}
                                                        </p>
                                                        <Button asChild>
                                                            <Link href={`/product/create?conn=${activeConnection.id}&table=${activeTable.id}`}>
                                                                <Plus className="w-4 h-4 mr-2" />
                                                                Add Product
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </UITable>
                            </div>

                            {/* Pagination */}
                            {products.links && products.links.length > 3 && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-gray-600">
                                        Showing {products.data.length} of many records
                                    </div>
                                    <div className="flex gap-1">
                                        {products.links.map((link: any, index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={`px-3 py-1 rounded ${
                                                    link.active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 hover:bg-gray-200'
                                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={!link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Table Info Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Database className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{activeConnection.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {activeConnection.database} @ {activeConnection.host}:{activeConnection.port}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <div className="flex items-center gap-4">
                                        <span>
                                            Table: <strong>{activeTable.table_name}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Fields: <Badge variant="outline">{fields.length}</Badge>
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Editable: <Badge variant="outline">{editableFields.length}</Badge>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
