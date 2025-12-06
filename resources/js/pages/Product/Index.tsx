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
    const [isLoading, setIsLoading] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [lastScanTime, setLastScanTime] = useState<number>(0);
    const scanCooldown = 2000;

    useEffect(() => {
        let isMounted = true;
        let streamRef: MediaStream | null = null;

        const setupScanner = async () => {
            if (!active) {
                if (codeReaderRef.current) {
                    try {
                        codeReaderRef.current.reset();
                    } catch (e) {
                        console.error("Error resetting scanner:", e);
                    }
                }
                if (streamRef) {
                    streamRef.getTracks().forEach(track => track.stop());
                }
                setIsLoading(true);
                setCameraError(null);
                return;
            }

            try {
                setIsLoading(true);
                setCameraError(null);

                if (!(window as any).ZXing) {
                    const script = document.createElement("script");
                    script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
                    document.head.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = () => reject(new Error("Failed to load ZXing library"));
                        setTimeout(() => reject(new Error("ZXing library load timeout")), 10000);
                    });
                }

                if (!isMounted || !videoRef.current) return;

                const { BrowserMultiFormatReader } = (window as any).ZXing;
                codeReaderRef.current = new BrowserMultiFormatReader();

                const devices = await codeReaderRef.current.listVideoInputDevices();

                if (!devices || devices.length === 0) {
                    throw new Error("No camera devices found");
                }

                let selectedDeviceId = devices[0]?.deviceId;
                const backCam = devices.find((d: any) =>
                    d.label.toLowerCase().includes("back") ||
                    d.label.toLowerCase().includes("rear") ||
                    d.label.toLowerCase().includes("environment")
                );

                if (backCam) {
                    selectedDeviceId = backCam.deviceId;
                }

                if (!isMounted || !videoRef.current) return;

                await codeReaderRef.current.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result: any, err: any) => {
                        if (result && isMounted) {
                            const now = Date.now();
                            if (now - lastScanTime > scanCooldown) {
                                const scannedText = result.getText();
                                console.log("Scan successful:", scannedText);
                                setLastScanTime(now);
                                onScan(scannedText);
                            }
                        }
                        if (err && !(err.name === "NotFoundException")) {
                            console.error("Decode error:", err);
                        }
                    }
                );

                if (isMounted) {
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.error("Scanner setup error:", err);
                if (isMounted) {
                    setCameraError(err.message || "Failed to start camera");
                    setIsLoading(false);
                    onError(err);
                }
            }
        };

        setupScanner();

        return () => {
            isMounted = false;
            if (codeReaderRef.current) {
                try {
                    codeReaderRef.current.reset();
                } catch (e) {
                    console.error("Error during cleanup:", e);
                }
            }
            if (streamRef) {
                streamRef.getTracks().forEach(track => track.stop());
            }
        };
    }, [active, onScan, onError, lastScanTime]);

    return (
        <div className="relative w-full h-full bg-black">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-center text-white">
                        <Camera className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                        <p>Starting camera...</p>
                        <p className="text-xs text-gray-400 mt-2">Please allow camera access</p>
                    </div>
                </div>
            )}

            {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                    <div className="text-center text-white p-4">
                        <X className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <p className="font-semibold mb-2">Camera Error</p>
                        <p className="text-sm text-gray-300">{cameraError}</p>
                        <p className="text-xs text-gray-400 mt-2">
                            Please check camera permissions or use alternative methods
                        </p>
                    </div>
                </div>
            )}

            {!isLoading && !cameraError && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 border-4 border-white opacity-50 rounded-lg" />
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded">
                            Position barcode/QR code within the frame
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Mobile Camera Component for HTTP - Uses input type="file" with capture
const MobileCamera = ({
    onScan,
    onError,
}: {
    onScan: (data: string) => void;
    onError: (error: Error) => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCameraOpen = () => {
        setError(null);
        // This will trigger the mobile device's camera
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Invalid file type", {
                description: "Please take a photo with your camera"
            });
            return;
        }

        setIsScanning(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const imageUrl = event.target?.result as string;
            setCapturedImage(imageUrl);
            setShowCropper(true);
            setIsScanning(false);
        };

        reader.onerror = () => {
            setIsScanning(false);
            toast.error("Failed to read photo");
            setError("Failed to load image");
        };

        reader.readAsDataURL(file);
    };

    const handleCroppedImage = async (croppedImage: string) => {
        setIsScanning(true);
        setShowCropper(false);

        try {
            // Load ZXing library if not already loaded
            if (!(window as any).ZXing) {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("Failed to load ZXing library"));
                });
            }

            const { BrowserMultiFormatReader } = (window as any).ZXing;
            const codeReader = new BrowserMultiFormatReader();

            // Create image element from cropped image
            const img = new Image();
            img.src = croppedImage;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Decode from cropped image
            const result = await codeReader.decodeFromImageElement(img);

            if (result) {
                console.log("Cropped image scan successful:", result.getText());
                onScan(result.getText());
                toast.success("Barcode decoded successfully");
                // Clear the captured image after successful scan
                setCapturedImage(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                throw new Error("No barcode found in the cropped area");
            }
        } catch (err: any) {
            console.error("Cropped image scan error:", err);
            toast.error("Failed to scan cropped image", {
                description: err.message || "No barcode found. Try adjusting the crop area."
            });
            setError(err.message || "Scan failed");
            // Keep the cropper open so user can adjust
            setShowCropper(true);
            onError(err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setShowCropper(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setTimeout(() => {
            handleCameraOpen();
        }, 100);
    };

    const handleCancelCrop = () => {
        setCapturedImage(null);
        setShowCropper(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {showCropper && capturedImage ? (
                <ImageCropper
                    imageSrc={capturedImage}
                    onCrop={handleCroppedImage}
                    onCancel={handleCancelCrop}
                    onRetake={handleRetake}
                />
            ) : (
                <>
                    <div className="text-sm text-gray-600 mb-4 text-center">
                        Take a photo of the barcode, then crop to focus on just the barcode area.
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <X className="w-4 h-4" />
                                <p className="text-sm font-medium">Scan Error</p>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                        <div className="text-center">
                            <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-2">
                                Open your mobile camera to take a photo
                            </p>
                            <p className="text-xs text-gray-500 mb-6">
                                Works on HTTP connections. Crop the image to focus on barcode.
                            </p>
                            <Button
                                onClick={handleCameraOpen}
                                disabled={isScanning}
                                className="gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                {isScanning ? 'Loading...' : 'Open Mobile Camera'}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {/* Hidden file input that triggers mobile camera */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment" // This tells mobile to use back camera
                onChange={handleFileChange}
                className="hidden"
            />

            {isScanning && !showCropper && (
                <div className="text-center text-sm text-gray-600">
                    <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                    </div>
                </div>
            )}

            {!showCropper && (
                <div className="text-xs text-gray-500 text-center">
                    <p className="font-medium mb-1">Tips for better scanning:</p>
                    <ul className="space-y-1">
                        <li>• Ensure good lighting on the barcode</li>
                        <li>• Hold camera steady</li>
                        <li>• Fill most of the frame with barcode</li>
                        <li>• After taking photo, crop to just the barcode area</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

// Image Upload Scanner Component
const ImageScanner = ({
    onScan,
    onError,
}: {
    onScan: (data: string) => void;
    onError: (error: Error) => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Invalid file type", {
                description: "Please upload an image file"
            });
            return;
        }

        setIsScanning(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const imageUrl = event.target?.result as string;
            setPreviewUrl(imageUrl);
            setCapturedImage(imageUrl);
            setShowCropper(true);
            setIsScanning(false);
        };

        reader.onerror = () => {
            setIsScanning(false);
            toast.error("Failed to read file");
        };

        reader.readAsDataURL(file);
    };

    const handleCroppedImage = async (croppedImage: string) => {
        setIsScanning(true);
        setShowCropper(false);

        try {
            if (!(window as any).ZXing) {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = () => reject(new Error("Failed to load ZXing library"));
                });
            }

            const { BrowserMultiFormatReader } = (window as any).ZXing;
            const codeReader = new BrowserMultiFormatReader();

            const img = new Image();
            img.src = croppedImage;

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const result = await codeReader.decodeFromImageElement(img);

            if (result) {
                console.log("Uploaded image scan successful:", result.getText());
                onScan(result.getText());
                toast.success("Barcode decoded successfully");
                setPreviewUrl(null);
                setCapturedImage(null);
            } else {
                throw new Error("No barcode found in image");
            }
        } catch (err: any) {
            console.error("Uploaded image scan error:", err);
            toast.error("Failed to scan image", {
                description: err.message || "No barcode found in the image"
            });
            onError(err);
            // Keep the cropper open so user can adjust
            setShowCropper(true);
        } finally {
            setIsScanning(false);
        }
    };

    const handleClear = () => {
        setPreviewUrl(null);
        setCapturedImage(null);
        setShowCropper(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRetake = () => {
        setPreviewUrl(null);
        setCapturedImage(null);
        setShowCropper(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    };

    const handleCancelCrop = () => {
        setShowCropper(false);
    };

    return (
        <div className="space-y-4">
            {showCropper && capturedImage ? (
                <ImageCropper
                    imageSrc={capturedImage}
                    onCrop={handleCroppedImage}
                    onCancel={handleCancelCrop}
                    onRetake={handleRetake}
                />
            ) : (
                <>
                    <div className="text-sm text-gray-600 mb-4 text-center">
                        Upload an image, then crop to focus on just the barcode area.
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                        {previewUrl ? (
                            <div className="space-y-4">
                                <img
                                    src={previewUrl}
                                    alt="Uploaded barcode"
                                    className="max-h-64 mx-auto rounded"
                                />
                                <div className="flex justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={isScanning}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={() => setShowCropper(true)}
                                        disabled={isScanning}
                                    >
                                        Crop & Scan
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload an image containing a barcode or QR code
                                </p>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isScanning}
                                    className="gap-2"
                                >
                                    <Upload className="w-4 h-4" />
                                    Choose Image
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {isScanning && !showCropper && (
                <div className="text-center text-sm text-gray-600">
                    <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning image...
                    </div>
                </div>
            )}

            {!showCropper && (
                <div className="text-xs text-gray-500 text-center">
                    Supports JPG, PNG, and most common image formats. Crop to isolate barcode for better accuracy.
                </div>
            )}
        </div>
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
    const [scanMode, setScanMode] = useState<'camera' | 'mobile' | 'upload'>('camera');
    const [search, setSearch] = useState("");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [isHttps, setIsHttps] = useState(true);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsHttps(window.location.protocol === 'https:');
    }, []);

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
        console.log("Scanned code received:", code);

        setSearch(code);

        toast.success("Scanned successfully", {
            description: `Searching for: ${code}`
        });

        router.get('/product', {
            search: code,
            conn: activeConnection.id,
            table: activeTable.id
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log("Search completed for:", code);
            },
            onError: (error) => {
                console.error("Search error:", error);
                toast.error("Search failed", {
                    description: "Unable to perform search with scanned code"
                });
            }
        });

        setTimeout(() => {
            setShowScanner(false);
        }, 500);
    };

    const handleScannerOpen = () => {
        if (!isHttps) {
            setScanMode('mobile');
            toast.info("Using mobile camera mode", {
                description: "HTTP connections use mobile camera with cropping"
            });
        } else {
            setScanMode('camera');
        }

        setSearch("");
        setShowScanner(true);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (value.trim() !== '') {
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
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={handleScannerOpen}
                                            >
                                                <QrCode className="w-4 h-4" />
                                                Scan Barcode
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Scan Barcode/QR Code</DialogTitle>
                                                <DialogDescription>
                                                    Choose your preferred scanning method
                                                </DialogDescription>
                                            </DialogHeader>

                                            {/* Manual input option */}
                                            <div className="mb-4">
                                                <label className="text-sm font-medium mb-2 block">Or enter barcode manually:</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter barcode/QR code"
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                    />
                                                    <Button
                                                        onClick={() => {
                                                            if (search.trim()) {
                                                                handleScan(search);
                                                            }
                                                        }}
                                                        disabled={!search.trim()}
                                                    >
                                                        Search
                                                    </Button>
                                                </div>
                                            </div>

                                            <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as 'camera' | 'mobile' | 'upload')}>
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="camera" disabled={!isHttps}>
                                                        <Camera className="w-4 h-4 mr-2" />
                                                        Live Scanner
                                                        {!isHttps && (
                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                HTTPS Only
                                                            </Badge>
                                                        )}
                                                    </TabsTrigger>
                                                    <TabsTrigger value="mobile">
                                                        <Smartphone className="w-4 h-4 mr-2" />
                                                        Mobile Camera
                                                    </TabsTrigger>
                                                    <TabsTrigger value="upload">
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload Image
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="camera" className="mt-4">
                                                    {isHttps ? (
                                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                            <BarcodeScanner
                                                                onScan={handleScan}
                                                                onError={(error) => {
                                                                    toast.error("Scanner Error", {
                                                                        description: error.message
                                                                    });
                                                                }}
                                                                active={showScanner && scanMode === 'camera'}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <div className="text-center p-4">
                                                                <CameraOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                                <p className="text-sm text-gray-600 mb-2">Live scanner requires HTTPS</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Please use "Mobile Camera" or "Upload Image" tabs
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="mobile" className="mt-4">
                                                    <MobileCamera
                                                        onScan={handleScan}
                                                        onError={(error) => {
                                                            console.error("Mobile camera error:", error);
                                                            toast.error("Camera Error", {
                                                                description: error.message
                                                            });
                                                        }}
                                                    />
                                                </TabsContent>

                                                <TabsContent value="upload" className="mt-4">
                                                    <ImageScanner
                                                        onScan={handleScan}
                                                        onError={(error) => {
                                                            console.error("Image scan error:", error);
                                                        }}
                                                    />
                                                </TabsContent>
                                            </Tabs>

                                            <div className="flex justify-between items-center pt-4 border-t">
                                                <div className="text-sm text-gray-500">
                                                    {search && (
                                                        <span>
                                                            Search for: <strong className="font-mono">{search}</strong>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSearch("");
                                                            setShowScanner(false);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (search.trim()) {
                                                                handleScan(search);
                                                            } else {
                                                                setShowScanner(false);
                                                            }
                                                        }}
                                                    >
                                                        {search.trim() ? 'Search' : 'Close'}
                                                    </Button>
                                                </div>
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
