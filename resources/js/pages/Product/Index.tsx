import React, { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import AppLayout from "@/layouts/app-layout";

type Product = {
    [key: string]: any;
};

interface IndexProps {
    products: { data: Product[]; links: any[] };
    fields: string[];
    idField: string;
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
                    script.src =
                        "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
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

                    // Try to find the back camera (usually has "back" or "environment" in the label)
                    let selectedDeviceId = devices[0].deviceId;
                    const backCam = devices.find((d: any) =>
                        d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("environment")
                    );

                    if (backCam) {
                        selectedDeviceId = backCam.deviceId;
                    }

                    // Start scanner with the chosen camera
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

export default function Index({ products, fields, idField }: IndexProps) {
    const [showScanner, setShowScanner] = useState(false);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            "/product",
            { search: value },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleScanSuccess = (data: string) => {
        setShowScanner(false);
        setSearch(data);
        handleSearch(data);
    };

    const handleScanError = (err: Error) => {
        console.error("QR scan error:", err);
    };

    const handleDelete = (productId: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            setDeletingId(productId);
            router.delete("/product/delete", {
                data: { [idField]: productId },
                preserveScroll: true,
                onFinish: () => setDeletingId(null),
            });
        }
    };

    return (
        <>
            <AppLayout>
                <Head title="Products" />

                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <CardTitle>Products</CardTitle>

                        <div className="flex gap-2 w-full md:w-auto">
                            <Input
                                type="text"
                                placeholder={`Search by ${fields.join(", ")}`}
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button size="sm" onClick={() => setShowScanner(true)}>
                                Scan QR
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {fields.map((f) => (
                                        <TableHead key={f} className="capitalize">
                                            {f.replace(/_/g, " ")}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {products.data.length > 0 ? (
                                    products.data.map((p, i) => (
                                        <TableRow key={i}>
                                            {fields.map((f) => (
                                                <TableCell key={f}>{p[f]}</TableCell>
                                            ))}
                                            <TableCell className="text-center flex items-center justify-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        router.visit(`/product/search`, {
                                                            method: "post",
                                                            data: { [idField]: p[idField] },
                                                        })
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(p[idField])}
                                                    disabled={deletingId === p[idField]}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {deletingId === p[idField] ? "Deleting..." : "Delete"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={fields.length + 1}
                                            className="text-center text-gray-500"
                                        >
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {showScanner && (
                    <div className="fixed inset-0 bg-black z-50 flex flex-col">
                        <div className="flex justify-between items-center p-2">
                            <h2 className="text-white">Scan QR</h2>
                            <Button variant="ghost" onClick={() => setShowScanner(false)}>
                                <X className="w-6 h-6 text-white" />
                            </Button>
                        </div>

                        <div className="flex-1 relative">
                            <BarcodeScanner
                                active={showScanner}
                                onScan={handleScanSuccess}
                                onError={handleScanError}
                            />
                        </div>
                    </div>
                )}
            </AppLayout>
        </>
    );
}
