import React, { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    connections: any[];
    activeConnection: any;
    activeTable: any; // Add this prop
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

export default function Index({
    products,
    connections,
    activeConnection,
    activeTable, // Add this
    fields,
    idField,
    editableFields,
    inputTypes
}: IndexProps) {
    const [showScanner, setShowScanner] = useState(false);
    const [search, setSearch] = useState("");

    const switchConnection = (connId: string) => {
        router.get('/product', {
            conn: connId,
            // When switching connection, keep the table if it exists in new connection
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
    };

    const goToEdit = (id: string) => {
        router.post('/product/search', {
            table_id: activeTable.id,
            connection_id: activeConnection.id,
            [idField]: id
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Delete this item?")) return;
        router.delete('/product/delete', {
            data: {
                table_id: activeTable.id,
                connection_id: activeConnection.id,
                [idField]: id
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Products" />

            <div className="max-w-7xl mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Select value={activeConnection.id.toString()} onValueChange={switchConnection}>
                            <SelectTrigger className="w-64">
                                <SelectValue>{activeConnection.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {connections.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={activeTable.id.toString()} onValueChange={switchTable}>
                            <SelectTrigger className="w-64">
                                <SelectValue>{activeTable.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {activeConnection.tables.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.name} ({t.table_name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Search + Scanner */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input
                        className="flex-1"
                        placeholder={`Search by ${fields.join(", ")}`}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            router.get('/product', {
                                search: e.target.value,
                                conn: activeConnection.id,
                                table: activeTable.id
                            }, { preserveState: true });
                        }}
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => setShowScanner(true)}>Scan QR</Button>
                        <Button asChild>
                            <a href={`/product/create?conn=${activeConnection.id}&table=${activeTable.id}`}>
                                + Add New
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {fields.map(f => <th key={f} className="px-4 py-3 text-left">{f}</th>)}
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((p, i) => (
                                <tr key={i} className="border-t hover:bg-gray-50">
                                    {fields.map(f => <td key={f} className="px-4 py-3">{p[f]}</td>)}
                                    <td className="px-4 py-3 space-x-2">
                                        <Button
                                            size="sm"
                                            onClick={() => goToEdit(p[idField])}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(p[idField])}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.links && products.links.length > 3 && (
                    <div className="mt-4 flex justify-center">
                        <div className="flex gap-1">
                            {products.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => router.get(link.url || '#', {}, { preserveState: true })}
                                    className={`px-3 py-1 rounded ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Table Info */}
                <div className="mt-4 text-sm text-gray-600">
                    Showing {products.data.length} records from table <strong>{activeTable.table_name}</strong>
                </div>

                {showScanner && (
                    <div className="fixed inset-0 bg-black z-50 flex flex-col">
                        <div className="p-4 bg-black text-white flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Scan QR Code</h2>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="text-2xl hover:text-gray-300"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <BarcodeScanner
                                onScan={handleScan}
                                onError={(error) => {
                                    console.error('Scanner error:', error);
                                    alert('Scanner error: ' + error.message);
                                    setShowScanner(false);
                                }}
                                active={showScanner}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
