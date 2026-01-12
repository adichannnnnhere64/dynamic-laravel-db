import React, { useEffect, useRef, useState, useCallback } from "react";
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
    Slider
} from "@/components/ui/slider";
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
    Camera,
    Image as ImageIcon,
    Crop,
    RotateCcw,
    Smartphone,
    CameraOff,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { toast } from "sonner";

import { Link } from '@inertiajs/react'
import BarcodeScanner from "@/components/barcode-scanner";

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

// Image Cropper Component for Mobile Camera
const ImageCropper = ({
    imageSrc,
    onCrop,
    onCancel,
    onRetake,
}: {
    imageSrc: string;
    onCrop: (croppedImage: string) => void;
    onCancel: () => void;
    onRetake: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [crop, setCrop] = useState({ x: 100, y: 100, width: 300, height: 200 });
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImageSize({ width: img.width, height: img.height });

            // Initialize crop area to center (suitable for barcodes)
            const cropWidth = Math.min(img.width * 0.7, 400);
            const cropHeight = Math.min(img.height * 0.5, 300);

            setCrop({
                x: (img.width - cropWidth) / 2,
                y: (img.height - cropHeight) / 2,
                width: cropWidth,
                height: cropHeight
            });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    const drawImage = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imgRef.current;

        if (!canvas || !ctx || !img) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size to container size
        const container = containerRef.current;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        // Calculate scaled dimensions to fit container
        const containerRatio = canvas.width / canvas.height;
        const imageRatio = img.width / img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imageRatio > containerRatio) {
            // Image is wider than container
            drawWidth = canvas.width;
            drawHeight = canvas.width / imageRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            // Image is taller than container
            drawHeight = canvas.height;
            drawWidth = canvas.height * imageRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        // Apply scale
        drawWidth *= scale;
        drawHeight *= scale;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = (canvas.height - drawHeight) / 2;

        // Draw scaled image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Draw crop area
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

        // Draw crop area corners
        ctx.fillStyle = '#3b82f6';
        const cornerSize = 12;

        // Top-left
        ctx.fillRect(crop.x - cornerSize/2, crop.y - cornerSize/2, cornerSize, cornerSize);
        // Top-right
        ctx.fillRect(crop.x + crop.width - cornerSize/2, crop.y - cornerSize/2, cornerSize, cornerSize);
        // Bottom-left
        ctx.fillRect(crop.x - cornerSize/2, crop.y + crop.height - cornerSize/2, cornerSize, cornerSize);
        // Bottom-right
        ctx.fillRect(crop.x + crop.width - cornerSize/2, crop.y + crop.height - cornerSize/2, cornerSize, cornerSize);

        // Draw instruction text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(crop.x, crop.y - 30, crop.width, 25);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Drag to position | Pinch to resize', crop.x + crop.width/2, crop.y - 10);

    }, [crop, scale]);

    useEffect(() => {
        drawImage();
    }, [drawImage]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if click is inside crop area
        if (x >= crop.x && x <= crop.x + crop.width &&
            y >= crop.y && y <= crop.y + crop.height) {
            setIsDragging(true);
            setDragStart({ x: x - crop.x, y: y - crop.y });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left - dragStart.x;
        const y = e.clientY - rect.top - dragStart.y;

        // Keep crop area within canvas bounds
        const maxX = canvasRef.current!.width - crop.width;
        const maxY = canvasRef.current!.height - crop.height;

        setCrop(prev => ({
            ...prev,
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY))
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x >= crop.x && x <= crop.x + crop.width &&
            y >= crop.y && y <= crop.y + crop.height) {
            setIsDragging(true);
            setDragStart({ x: x - crop.x, y: y - crop.y });
            e.preventDefault();
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const touch = e.touches[0];
        const x = touch.clientX - rect.left - dragStart.x;
        const y = touch.clientY - rect.top - dragStart.y;

        const maxX = canvasRef.current!.width - crop.width;
        const maxY = canvasRef.current!.height - crop.height;

        setCrop(prev => ({
            ...prev,
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY))
        }));

        e.preventDefault();
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleCrop = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = imgRef.current;

        if (!ctx || !img) return;

        // Set crop canvas size to crop area size
        canvas.width = crop.width;
        canvas.height = crop.height;

        // Draw the cropped portion
        ctx.drawImage(
            img,
            crop.x, crop.y, crop.width, crop.height, // Source: crop area
            0, 0, crop.width, crop.height           // Destination: full canvas
        );

        // Convert to data URL with good quality
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        onCrop(croppedImage);
    };

    const handleResetCrop = () => {
        if (!imgRef.current) return;

        const cropWidth = Math.min(imgRef.current.width * 0.7, 400);
        const cropHeight = Math.min(imgRef.current.height * 0.5, 300);

        setCrop({
            x: (imgRef.current.width - cropWidth) / 2,
            y: (imgRef.current.height - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight
        });
        setScale(1);
    };

    const adjustCropSize = (delta: number) => {
        const minSize = 100;
        const maxSize = Math.min(imageSize.width, imageSize.height) * 0.9;

        setCrop(prev => ({
            ...prev,
            width: Math.max(minSize, Math.min(prev.width + delta, maxSize)),
            height: Math.max(minSize, Math.min(prev.height + delta, maxSize)),
            x: Math.max(0, prev.x - delta/2),
            y: Math.max(0, prev.y - delta/2)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-2">
                Adjust the crop area to focus on the barcode. Drag to move, use controls to resize.
            </div>

            <div
                ref={containerRef}
                className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-900"
                style={{ height: '400px', touchAction: 'none' }}
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Zoom</label>
                        <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
                    </div>
                    <Slider
                        value={[scale]}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onValueChange={([value]) => setScale(value)}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Crop Size</label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustCropSize(-20)}
                                disabled={crop.width <= 100}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustCropSize(20)}
                                disabled={crop.width >= Math.min(imageSize.width, imageSize.height) * 0.9}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500">Width: {Math.round(crop.width)}px</span>
                            <Slider
                                value={[crop.width]}
                                min={100}
                                max={Math.min(imageSize.width, 800)}
                                step={10}
                                onValueChange={([value]) => setCrop(prev => ({ ...prev, width: value }))}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500">Height: {Math.round(crop.height)}px</span>
                            <Slider
                                value={[crop.height]}
                                min={50}
                                max={Math.min(imageSize.height, 600)}
                                step={10}
                                onValueChange={([value]) => setCrop(prev => ({ ...prev, height: value }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={handleResetCrop}
                        className="flex-1 gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onRetake}
                        className="flex-1 gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        Retake
                    </Button>
                    <Button
                        onClick={handleCrop}
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Crop className="w-4 h-4" />
                        Crop & Scan
                    </Button>
                </div>

                <div className="text-xs text-gray-500 text-center pt-2">
                    Tip: Make the crop area just big enough to fit the barcode
                </div>
            </div>
        </div>
    );
};

// Fixed Barcode Scanner Component for HTTPS (Live Scanning)
// Mobile Camera Component for HTTP - Uses input type="file" with capture


// Image Upload Scanner Component
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
    const [search, setSearch] = useState("");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const switchConnection = (connId: string) => {
        router.get('/product', {
            conn: connId,
            table: connections.find(c => c.id.toString() === connId)?.tables?.[0]?.id || null
        }, { preserveState: true });
    };

    const [scannedCode, setScannedCode] = useState<string | null>(null);

    useEffect(() => {
        handleSearchChange(scannedCode)
    }, [scannedCode, setScannedCode])


    const switchTable = (tableId: string) => {
        router.get('/product', {
            conn: activeConnection.id,
            table: tableId
        }, { preserveState: true });
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (value?.trim() !== '') {
                router.get('/product', {
                    search: value,
                    conn: activeConnection.id,
                    table: activeTable.id
                }, {
                    preserveState: true,
                    preserveScroll: true
                });
            } else {
                router.get('/product', {
                    conn: activeConnection.id,
                    table: activeTable.id
                }, {
                    preserveState: true,
                    preserveScroll: true
                });
            }
        }, 500);
    };

    const clearSearch = () => {
        setSearch("");
        router.get('/product', {
            conn: activeConnection.id,
            table: activeTable.id
        }, {
            preserveState: true,
            preserveScroll: true
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

        router.delete('/product/bulk-delete', {
            data: {
                table_id: activeTable.id,
                connection_id: activeConnection.id,
                rows: selectedRows
            }
        });

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

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

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
                                                {products?.data?.length} records
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
                                    <BarcodeScanner onResult={(code) => setScannedCode(code)} />
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
                                <div className="flex-1 relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder={`Search in ${fields.join(", ")}`}
                                            value={search}
                                            onChange={e => handleSearchChange(e.target.value)}
                                            className="pl-10 pr-10"
                                        />
                                        {search && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearSearch}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
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
                                                    checked={selectedRows.length === products?.data?.length && products?.data?.length > 0}
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
                                        {products?.data?.length > 0 ? (
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
