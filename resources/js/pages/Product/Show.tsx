import React, { useState } from "react";
import { useForm, Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Save,
    X,
    ChevronLeft,
    Database,
    Grid3x3,
    Key,
    CheckCircle,
    AlertCircle,
    Copy,
    RefreshCw,
    Eye,
    History
} from "lucide-react";
import { toast } from "sonner";

type Props = {
    product: Record<string, any>;
    table: {
        id: number;
        name: string;
        table_name: string;
        primary_key: string;
        editable_fields: string[];
        input_types: Record<string, string>;
    };
    connection: {
        id: number;
        name: string;
        database: string;
        host: string;
        port: number;
    };
    connections: Array<{
        id: number;
        name: string;
        tables: Array<{
            id: number;
            name: string;
        }>;
    }>;
};

export default function ProductShow({
    product,
    table,
    connection,
    connections
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        table_id: table.id,
        connection_id: connection.id,
        [table.primary_key]: product[table.primary_key] ?? "",
        ...Object.fromEntries(
            table.editable_fields.map((field) => [field, product[field] ?? ""])
        ),
    });

    const [connectionId, setConnectionId] = useState(connection.id.toString());

    const switchConnection = (connId: string) => {
        setConnectionId(connId);
        const selectedConn = connections.find(c => c.id.toString() === connId);
        if (selectedConn) {
            router.visit('/product', {
                data: { conn: connId }
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/product/update', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Product Updated", {
                    description: "Changes have been saved successfully"
                });
            },
            onError: () => {
                toast.error("Update Failed", {
                    description: "Please check the form for errors"
                });
            }
        });
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard", {
            description: `${label}: ${text}`
        });
    };

    const getInputComponent = (field: string, isPrimaryKey: boolean = false) => {
        const inputType = table.input_types[field] || 'text';
        const value = data[field] ?? "";

        const commonProps = {
            id: field,
            value: value,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setData(field, e.target.value),
            placeholder: `Enter ${field}`,
            disabled: processing || isPrimaryKey,
            className: "w-full mt-2",
            readOnly: isPrimaryKey,
        };

        switch (inputType) {
            case 'textarea':
                return <Textarea {...commonProps} />;

            case 'number':
                return <Input type="number" {...commonProps} />;

            case 'email':
                return <Input type="email" {...commonProps} />;

            case 'date':
                return <Input type="date" {...commonProps} />;

            case 'datetime-local':
                return <Input type="datetime-local" {...commonProps} />;

            case 'time':
                return <Input type="time" {...commonProps} />;

            default:
                return <Input type="text" {...commonProps} />;
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit ${table.primary_key}: ${product[table.primary_key]}`} />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="border-b bg-white">
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
                                        <Eye className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Database className="w-3 h-3 mr-1" />
                                                {connection.name}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center">
                                                <Grid3x3 className="w-3 h-3 mr-1" />
                                                {table.name}
                                            </span>
                                            <span>•</span>
                                            <Badge variant="outline" className="text-xs">
                                                {table.primary_key}: {product[table.primary_key]}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Select value={connectionId} onValueChange={switchConnection}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue>{connection.name}</SelectValue>
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

                                <Button
                                    variant="outline"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader>
                            {/* <CardTitle>Edit Product Details</CardTitle> */}
                            {/* <CardDescription> */}
                            {/*     Update product information in {table.table_name} table */}
                            {/* </CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Hidden fields */}
                                <input type="hidden" name="table_id" value={table.id} />
                                <input type="hidden" name="connection_id" value={connection.id} />

                                {/* Database Info & Primary Key */}
                                {/* <div className="space-y-4"> */}
                                {/*     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"> */}
                                {/*         <div className="flex items-center justify-between"> */}
                                {/*             <div> */}
                                {/*                 <h3 className="font-medium text-blue-800">Record Information</h3> */}
                                {/*                 <p className="text-sm text-blue-600"> */}
                                {/*                     {connection.database} • {table.table_name} */}
                                {/*                 </p> */}
                                {/*             </div> */}
                                {/*             <div className="flex items-center gap-2"> */}
                                {/*                 <Badge variant="outline" className="bg-white"> */}
                                {/*                     <Key className="w-3 h-3 mr-1" /> */}
                                {/*                     {table.primary_key} */}
                                {/*                 </Badge> */}
                                {/*                 <Button */}
                                {/*                     type="button" */}
                                {/*                     variant="ghost" */}
                                {/*                     size="sm" */}
                                {/*                     onClick={() => copyToClipboard( */}
                                {/*                         product[table.primary_key], */}
                                {/*                         table.primary_key */}
                                {/*                     )} */}
                                {/*                     className="h-6" */}
                                {/*                 > */}
                                {/*                     <Copy className="w-3 h-3" /> */}
                                {/*                 </Button> */}
                                {/*             </div> */}
                                {/*         </div> */}
                                {/*     </div> */}
                                {/**/}
                                {/*     {/* Primary Key Display } */}
                                {/*     <div className="grid grid-cols-4 items-center gap-4"> */}
                                {/*         <Label htmlFor={table.primary_key} className="text-right font-medium"> */}
                                {/*             {table.primary_key} */}
                                {/*         </Label> */}
                                {/*         <div className="col-span-3"> */}
                                {/*             <div className="flex items-center gap-2"> */}
                                {/*                 <Input */}
                                {/*                     id={table.primary_key} */}
                                {/*                     value={data[table.primary_key] ?? ""} */}
                                {/*                     className="font-mono bg-gray-50" */}
                                {/*                     readOnly */}
                                {/*                 /> */}
                                {/*                 <Button */}
                                {/*                     type="button" */}
                                {/*                     variant="outline" */}
                                {/*                     size="sm" */}
                                {/*                     onClick={() => copyToClipboard( */}
                                {/*                         data[table.primary_key], */}
                                {/*                         table.primary_key */}
                                {/*                     )} */}
                                {/*                     className="whitespace-nowrap" */}
                                {/*                 > */}
                                {/*                     <Copy className="w-3 h-3 mr-1" /> */}
                                {/*                     Copy */}
                                {/*                 </Button> */}
                                {/*             </div> */}
                                {/*             <p className="text-xs text-gray-500 mt-1"> */}
                                {/*                 Primary key cannot be modified */}
                                {/*             </p> */}
                                {/*         </div> */}
                                {/*     </div> */}
                                {/* </div> */}

                                {/* <Separator /> */}

                                {/* Editable Fields */}
                                {table.editable_fields.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <h3 className="text-lg font-semibold">Details</h3>
                                            </div>
                                            <Badge variant="outline">
                                                {table.editable_fields.length} editable fields
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {table.editable_fields.map((field) => (
                                                <div key={field} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor={field} className="font-medium">
                                                            {field}
                                                        </Label>
                                                        {table.input_types[field] && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {table.input_types[field]}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {getInputComponent(field)}
                                                    {errors[field] && (
                                                        <div className="flex items-center gap-2 text-sm text-red-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {errors[field]}
                                                        </div>
                                                    )}
                                                    {product[field] !== data[field] && (
                                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                                            <History className="w-3 h-3" />
                                                            <span className="font-medium">Original:</span>
                                                            <span className="truncate">{product[field] || '(empty)'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border rounded-lg bg-gray-50">
                                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">No editable fields configured for this table</p>
                                    </div>
                                )}

                                <CardFooter className="px-0 pb-0 pt-6">
                                    <div className="flex justify-between w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                            disabled={processing}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => reset()}
                                                disabled={processing}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Reset
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="gap-2"
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Database</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Database className="w-4 h-4 text-gray-500" />
                                        <span className="font-mono text-sm">{connection.database}</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Table</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Grid3x3 className="w-4 h-4 text-gray-500" />
                                        <span className="font-mono text-sm">{table.table_name}</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Connection</div>
                                    <div className="text-sm text-gray-600">
                                        {connection.host}:{connection.port}
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
