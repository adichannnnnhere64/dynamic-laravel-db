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
    Plus,
    Save,
    X,
    ChevronLeft,
    Database,
    Grid3x3,
    Key,
    CheckCircle,
    AlertCircle,
    Info
} from "lucide-react";
import { toast } from "sonner";

type Props = {
    connections: Array<{
        id: number;
        name: string;
        tables: Array<{
            id: number;
            name: string;
            table_name: string;
            primary_key: string;
            fields: string[];
            editable_fields: string[];
            input_types: Record<string, string>;
        }>;
    }>;
    connection: {
        id: number;
        name: string;
        database: string;
        host: string;
        port: number;
    };
    table: {
        id: number;
        name: string;
        table_name: string;
        primary_key: string;
        fields: string[];
        editable_fields: string[];
        input_types: Record<string, string>;
        // Add this to know if primary key is auto-increment
        primary_key_auto_increment?: boolean;
    };
};

export default function ProductCreate({
    connections,
    connection,
    table
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        table_id: table.id,
        connection_id: connection.id,
        [table.primary_key]: "",
        ...Object.fromEntries(table.editable_fields.map((field) => [field, ""])),
    });

    const [connectionId, setConnectionId] = useState(connection.id.toString());
    const [tableId, setTableId] = useState(table.id.toString());

    // Check if primary key is auto-increment (you'll need to pass this from backend)
    const isAutoIncrement = table.primary_key_auto_increment || false;

    const switchConnection = (connId: string) => {
        setConnectionId(connId);
        const selectedConn = connections.find(c => c.id.toString() === connId);
        if (selectedConn?.tables?.length > 0) {
            const firstTable = selectedConn.tables[0];
            setTableId(firstTable.id.toString());
            router.get('/product/create', {
                conn: connId,
                table: firstTable.id
            }, { preserveState: true });
        }
    };

    const switchTable = (tblId: string) => {
        setTableId(tblId);
        router.get('/product/create', {
            conn: connectionId,
            table: tblId
        }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/product/store', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Product Created", {
                    description: "New product has been added successfully"
                });
                reset();
            },
            onError: () => {
                toast.error("Creation Failed", {
                    description: "Please check the form for errors"
                });
            }
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
            placeholder: isPrimaryKey && isAutoIncrement ? "Auto-generated" : `Enter ${field}`,
            disabled: processing || (isPrimaryKey && isAutoIncrement),
            className: "w-full mt-2",
            required: isPrimaryKey && !isAutoIncrement, // Only required if not auto-increment
            readOnly: isPrimaryKey && isAutoIncrement,
        };

        switch (inputType) {
            case 'textarea':
                return <Textarea  {...commonProps} />;

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
            <Head title="Create" />

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
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Plus className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Create</h1>
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

                                <Select value={tableId} onValueChange={switchTable}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue>{table.name}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connections.find(c => c.id.toString() === connectionId)?.tables.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Grid3x3 className="w-4 h-4" />
                                                    {t.name}
                                                </div>
                                            </SelectItem>
                                        )) || []}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader>
                            {/* <CardTitle>Product Information</CardTitle> */}
                            {/* <CardDescription> */}
                            {/*     Add a new product to {table.table_name} table */}
                            {/* </CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-2">
                                {/* Hidden fields */}
                                <input type="hidden" name="table_id" value={table.id} />
                                <input type="hidden" name="connection_id" value={connection.id} />

                                {/* Database Info */}
                                {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"> */}
                                {/*     <div className="flex items-center justify-between"> */}
                                {/*         <div> */}
                                {/*             <h3 className="font-medium text-blue-800">Database Information</h3> */}
                                {/*             <p className="text-sm text-blue-600"> */}
                                {/*                 {connection.database} @ {connection.host}:{connection.port} */}
                                {/*             </p> */}
                                {/*         </div> */}
                                {/*         <Badge variant="outline" className="bg-white"> */}
                                {/*             {table.table_name} */}
                                {/*         </Badge> */}
                                {/*     </div> */}
                                {/* </div> */}

                                {/* Primary Key Section */}
                                {/* <div className="space-y-4"> */}
                                    {/* <div className="flex items-center gap-2"> */}
                                        {/* <Key className="w-5 h-5 text-yellow-600" /> */}
                                        {/* <h3 className="text-lg font-semibold">Primary Key</h3> */}
                                        {/* <Badge variant="secondary" className="ml-2"> */}
                                        {/*     {isAutoIncrement ? "Auto-increment" : "Manual"} */}
                                        {/* </Badge> */}
                                    {/* </div> */}

                                    {/* Info message for auto-increment */}
                                    {/* {isAutoIncrement && ( */}
                                    {/*     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"> */}
                                    {/*         <div className="flex items-start gap-3"> */}
                                    {/*             <Info className="w-5 h-5 text-yellow-600 mt-0.5" /> */}
                                    {/*             <div> */}
                                    {/*                 <p className="text-sm text-yellow-800"> */}
                                    {/*                     The primary key <strong>{table.primary_key}</strong> is auto-increment. */}
                                    {/*                     Leave this field empty to let the database generate it automatically. */}
                                    {/*                 </p> */}
                                    {/*             </div> */}
                                    {/*         </div> */}
                                    {/*     </div> */}
                                    {/* )} */}
                                    {/**/}

                                    {/* <div className="grid grid-cols-4 items-center gap-4"> */}
                                        {/* <Label htmlFor={table.primary_key} className="text-right font-medium"> */}
                                        {/*     {table.primary_key} */}
                                        {/*     {!isAutoIncrement && ( */}
                                        {/*         <span className="text-red-500 ml-1">*</span> */}
                                        {/*     )} */}
                                        {/* </Label> */}
                                        {/* <div className="col-span-3 space-y-2"> */}
                                        {/*     {getInputComponent(table.primary_key, true)} */}
                                        {/*     {errors[table.primary_key] && ( */}
                                        {/*         <div className="flex items-center gap-2 text-sm text-red-600"> */}
                                        {/*             <AlertCircle className="w-4 h-4" /> */}
                                        {/*             {errors[table.primary_key]} */}
                                        {/*         </div> */}
                                        {/*     )} */}
                                        {/*     <p className="text-xs text-gray-500"> */}
                                        {/*         {isAutoIncrement */}
                                        {/*             ? "Will be auto-generated if left empty" */}
                                        {/*             : "Unique identifier for this record (required)"} */}
                                        {/*     </p> */}
                                        {/* </div> */}
                                    {/* </div> */}
                                {/* </div> */}

                                {/* <Separator /> */}

                                {/* Editable Fields Section */}
                                {table.editable_fields.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {/* <CheckCircle className="w-5 h-5 text-green-600" /> */}
                                                <h3 className="text-lg font-semibold">Details</h3>
                                            </div>
                                            <Badge variant="outline">
                                                {table.editable_fields.length} fields
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {table.editable_fields.map((field) => (
                                                <div key={field} className="space-y-2">
                                                    <Label htmlFor={field} className="font-medium">

                                                    <div className="flex items-center justify-between">
                                                        {field}
                                                        {table.input_types[field] && (
                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                {table.input_types[field]}
                                                            </Badge>
                                                        )}
                                                        </div>
                                                    </Label>
                                                    {getInputComponent(field)}
                                                    {errors[field] && (
                                                        <div className="flex items-center gap-2 text-sm text-red-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {errors[field]}
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
                                        <p className="text-sm text-gray-500 mt-1">
                                            Configure editable fields in table settings
                                        </p>
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
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Create Product
                                                </>
                                            )}
                                        </Button>
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
