// resources/js/Pages/Connection/Tables.tsx
import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { useForm, router, usePage, Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table as UITable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Edit,
    Eye,
    Database,
    Settings,
    RefreshCw,
    Check,
    MoreVertical,
    Key,
    Grid3x3,
    FileText,
    Calendar,
    Hash,
    Mail,
    ChevronLeft,
    Search,
    AlertCircle,
    Copy,
    Columns,
    Globe,
    Shield,
    Loader2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type TableConfig = {
    id?: number;
    name: string;
    table_name: string;
    primary_key: string;
    fields: string[];
    editable_fields: string[];
    input_types: Record<string, string>;
    is_active: boolean;
    order: number;
    created_at?: string;
    updated_at?: string;
};

type ConnectionType = {
    id: number;
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    tables: TableConfig[];
    created_at: string;
    updated_at: string;
};

export default function ConnectionTables({ connection, actualTables, flash }: {
    connection: ConnectionType;
    actualTables: string[];
    flash?: any;
}) {
    const [showForm, setShowForm] = useState(false);
    const [selectedTableName, setSelectedTableName] = useState<string>("");
    const [columns, setColumns] = useState<string[]>([]);
    const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
    const [editingTable, setEditingTable] = useState<TableConfig | null>(null);
    const [loadingColumns, setLoadingColumns] = useState(false);
    const [selectedTab, setSelectedTab] = useState("configured");
    const [searchQuery, setSearchQuery] = useState("");

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        table_name: "",
        name: "",
        primary_key: "",
        fields: [] as string[],
        editable_fields: [] as string[],
        input_types: {} as Record<string, string>,
        is_active: true,
        order: connection.tables?.length || 0,
    });

    // Show toast on success/error
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Fetch columns when table is selected
    useEffect(() => {
        if (selectedTableName && selectedTableName !== editingTable?.table_name) {
            fetchColumns(selectedTableName);
        }
    }, [selectedTableName]);

    const fetchColumns = async (tableName: string) => {
    setLoadingColumns(true);

    try {
        const response = await fetch(`/api/connection/${connection.id}/tables/${tableName}/columns`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('API Response for edit:', result);
        console.log('Editing table input_types:', editingTable?.input_types);

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.columns && Array.isArray(result.columns)) {
            const columnNames: string[] = result.columns.filter((col: string) => col && col.trim() !== '');
            const typesMap: Record<string, string> = {};

            if (result.types && Array.isArray(result.types)) {
                columnNames.forEach((col: string, index: number) => {
                    typesMap[col] = result.types[index] || 'varchar';
                });
            } else {
                columnNames.forEach((col: string) => {
                    typesMap[col] = 'varchar';
                });
            }

            setColumns(columnNames);
            setColumnTypes(typesMap);

            // CRITICAL FIX: Preserve existing input_types when editing
            let finalInputTypes: Record<string, string> = {};

            if (editingTable?.input_types) {
                // Start with the saved input_types
                finalInputTypes = { ...editingTable.input_types };

                // Only add defaults for NEW fields that don't exist in saved config
                columnNames.forEach(col => {
                    if (!finalInputTypes[col]) {
                        const mysqlType = (typesMap[col] || 'varchar').toLowerCase();
                        let inputType = 'text';

                        if (mysqlType.includes('int') || mysqlType.includes('decimal') || mysqlType.includes('float') || mysqlType.includes('double')) {
                            inputType = 'number';
                        } else if (mysqlType.includes('date')) {
                            inputType = 'date';
                        } else if (mysqlType.includes('datetime') || mysqlType.includes('timestamp')) {
                            inputType = 'datetime-local';
                        } else if (mysqlType.includes('time')) {
                            inputType = 'time';
                        } else if (mysqlType.includes('text') || mysqlType.includes('blob')) {
                            inputType = 'textarea';
                        } else if (mysqlType.includes('enum')) {
                            inputType = 'select';
                        } else if (mysqlType.includes('set') || mysqlType === 'tinyint(1)' || mysqlType.includes('boolean')) {
                            inputType = 'checkbox';
                        }

                        finalInputTypes[col] = inputType;
                    }
                });
            } else {
                // Generate all defaults if not editing
                columnNames.forEach((col: string) => {
                    const mysqlType = (typesMap[col] || 'varchar').toLowerCase();
                    let inputType = 'text';

                    if (mysqlType.includes('int') || mysqlType.includes('decimal') || mysqlType.includes('float') || mysqlType.includes('double')) {
                        inputType = 'number';
                    } else if (mysqlType.includes('date')) {
                        inputType = 'date';
                    } else if (mysqlType.includes('datetime') || mysqlType.includes('timestamp')) {
                        inputType = 'datetime-local';
                    } else if (mysqlType.includes('time')) {
                        inputType = 'time';
                    } else if (mysqlType.includes('text') || mysqlType.includes('blob')) {
                        inputType = 'textarea';
                    } else if (mysqlType.includes('enum')) {
                        inputType = 'select';
                    } else if (mysqlType.includes('set') || mysqlType === 'tinyint(1)' || mysqlType.includes('boolean')) {
                        inputType = 'checkbox';
                    }

                    finalInputTypes[col] = inputType;
                });
            }

            const primaryKey = editingTable?.primary_key || columnNames[0] || 'id';

            console.log('Final input types to set:', finalInputTypes);

            setData({
                ...data,
                table_name: tableName,
                name: editingTable?.name || tableName,
                primary_key: editingTable?.primary_key || primaryKey,
                fields: editingTable?.fields || columnNames,
                editable_fields: editingTable?.editable_fields || columnNames.filter(f => f !== primaryKey),
                input_types: finalInputTypes, // Use the preserved/merged input types
            });
        } else {
            throw new Error('No columns found in response');
        }
    } catch (error: any) {
        console.error("Failed to fetch columns:", error);
        toast.error("Connection Error", {
            description: "Could not fetch table structure from database",
        });
    } finally {
        setLoadingColumns(false);
    }
};

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();

        if (!data.table_name) {
            toast.error("Please select a table from the database");
            return;
        }

        if (!data.name.trim()) {
            toast.error("Display name is required");
            return;
        }

        if (!data.primary_key) {
            toast.error("Primary key is required");
            return;
        }

        if (data.fields.length === 0) {
            toast.error("At least one field must be selected");
            return;
        }

        const url = `/connect/${connection.id}/tables`;
        const method = editingTable ? 'put' : 'post';

        router[method](url, {
            ...data,
            id: editingTable?.id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
                setSelectedTableName("");
                setEditingTable(null);
                setColumns([]);
                setColumnTypes({});
            },
            onError: () => {
                toast.error("Please check your form for errors");
            }
        });
    };

    const editTable = async (table: TableConfig) => {
    console.log('Editing table:', table);
    console.log('Table input_types:', table.input_types);

    setEditingTable(table);
    setShowForm(true);
    setSelectedTableName(table.table_name);

    // Set initial data IMMEDIATELY with saved configuration
    setData({
        table_name: table.table_name,
        name: table.name,
        primary_key: table.primary_key,
        fields: table.fields,
        editable_fields: table.editable_fields || [],
        input_types: table.input_types || {},
        is_active: table.is_active,
        order: table.order,
    });

    // Now fetch columns and merge with saved input_types
    await fetchColumnsForEdit(table.table_name, table.input_types || {});
};

// New function specifically for editing
const fetchColumnsForEdit = async (tableName: string, savedInputTypes: Record<string, string>) => {
    setLoadingColumns(true);

    try {
        const response = await fetch(`/api/connection/${connection.id}/tables/${tableName}/columns`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log('API Response for edit:', result);
        console.log('Saved input_types:', savedInputTypes);

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.columns && Array.isArray(result.columns)) {
            const columnNames: string[] = result.columns.filter((col: string) => col && col.trim() !== '');
            const typesMap: Record<string, string> = {};

            if (result.types && Array.isArray(result.types)) {
                columnNames.forEach((col: string, index: number) => {
                    typesMap[col] = result.types[index] || 'varchar';
                });
            } else {
                columnNames.forEach((col: string) => {
                    typesMap[col] = 'varchar';
                });
            }

            setColumns(columnNames);
            setColumnTypes(typesMap);

            // Merge saved input_types with defaults for new columns
            const finalInputTypes: Record<string, string> = { ...savedInputTypes };

            // Add defaults for NEW fields that don't exist in saved config
            columnNames.forEach(col => {
                if (!finalInputTypes[col]) {
                    const mysqlType = (typesMap[col] || 'varchar').toLowerCase();
                    let inputType = 'text';

                    if (mysqlType.includes('int') || mysqlType.includes('decimal') || mysqlType.includes('float') || mysqlType.includes('double')) {
                        inputType = 'number';
                    } else if (mysqlType.includes('date')) {
                        inputType = 'date';
                    } else if (mysqlType.includes('datetime') || mysqlType.includes('timestamp')) {
                        inputType = 'datetime-local';
                    } else if (mysqlType.includes('time')) {
                        inputType = 'time';
                    } else if (mysqlType.includes('text') || mysqlType.includes('blob')) {
                        inputType = 'textarea';
                    } else if (mysqlType.includes('enum')) {
                        inputType = 'select';
                    } else if (mysqlType.includes('set') || mysqlType === 'tinyint(1)' || mysqlType.includes('boolean')) {
                        inputType = 'checkbox';
                    }

                    finalInputTypes[col] = inputType;
                }
            });

            console.log('Final input types to set:', finalInputTypes);

            // Update form data with merged input_types
            setData(prev => ({
                ...prev,
                fields: columnNames,
                input_types: finalInputTypes,
            }));
        }
    } catch (error: any) {
        console.error("Failed to fetch columns:", error);
        toast.error("Connection Error", {
            description: "Could not fetch table structure from database",
        });
    } finally {
        setLoadingColumns(false);
    }
};


    const deleteTable = (tableId: number) => {
        router.delete(`/connect/${connection.id}/tables/${tableId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Table configuration deleted");
            },
            onError: () => {
                toast.error("Could not delete the table configuration");
            }
        });
    };

    const toggleEditable = (fieldName: string) => {
        const newEditable = data.editable_fields.includes(fieldName)
            ? data.editable_fields.filter(f => f !== fieldName)
            : [...data.editable_fields, fieldName];
        setData("editable_fields", newEditable);
    };

    const setInputType = (fieldName: string, type: string) => {
        setData("input_types", {
            ...data.input_types,
            [fieldName]: type
        });
    };

    const toggleField = (fieldName: string) => {
        const newFields = data.fields.includes(fieldName)
            ? data.fields.filter(f => f !== fieldName)
            : [...data.fields, fieldName];
        setData("fields", newFields);

        if (!newFields.includes(fieldName)) {
            const newEditable = data.editable_fields.filter(f => f !== fieldName);
            setData("editable_fields", newEditable);

            const newInputTypes = { ...data.input_types };
            delete newInputTypes[fieldName];
            setData("input_types", newInputTypes);
        }
    };

    const selectAllFields = () => {
        setData("fields", columns);
        setData("editable_fields", columns.filter(f => f !== data.primary_key));
    };

    const deselectAllFields = () => {
        setData("fields", [data.primary_key]);
        setData("editable_fields", []);
    };

    const getMysqlTypeIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('float')) {
            return <Hash className="w-4 h-4" />;
        } else if (lowerType.includes('date') || lowerType.includes('time')) {
            return <Calendar className="w-4 h-4" />;
        } else if (lowerType.includes('text') || lowerType.includes('blob')) {
            return <FileText className="w-4 h-4" />;
        } else if (lowerType.includes('enum') || lowerType.includes('set')) {
            return <Grid3x3 className="w-4 h-4" />;
        } else if (lowerType.includes('char') || lowerType.includes('varchar')) {
            return <Link className="w-4 h-4" />;
        }
        return <FileText className="w-4 h-4" />;
    };

    const getInputTypeOptions = () => [
        { value: 'text', label: 'Text', icon: <FileText className="w-4 h-4" /> },
        { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
        { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
        { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
        { value: 'datetime-local', label: 'Date Time', icon: <Calendar className="w-4 h-4" /> },
        { value: 'time', label: 'Time', icon: <Calendar className="w-4 h-4" /> },
        { value: 'textarea', label: 'Text Area', icon: <FileText className="w-4 h-4" /> },
        { value: 'select', label: 'Dropdown', icon: <Grid3x3 className="w-4 h-4" /> },
        { value: 'checkbox', label: 'Checkbox', icon: <Check className="w-4 h-4" /> },
        { value: 'password', label: 'Password', icon: <Shield className="w-4 h-4" /> },
        { value: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
    ];

    const filteredActualTables = actualTables.filter((table: string) =>
        table.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredConfiguredTables = connection.tables?.filter((table: TableConfig) =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.table_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="border-b bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/connect')}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Database className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Globe className="w-3 h-3 mr-1" />
                                                {connection.host}:{connection.port}
                                            </span>
                                            <span>•</span>
                                            <span className="font-medium">{connection.database}</span>
                                            <span>•</span>
                                            <span>{connection.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={() => router.reload({ preserveScroll: true })}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </Button>

                                <Dialog open={showForm} onOpenChange={setShowForm}>
                                    <DialogTrigger asChild>

                                    </DialogTrigger>
                                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Settings className="w-5 h-5" />
                                                {editingTable ? `Edit Table: ${editingTable.name}` : "Configure New Table"}
                                            </DialogTitle>
                                            <DialogDescription>
                                                Configure how this database table should be displayed and managed in the application
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Basic Information */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                                    <Database className="w-5 h-5" />
                                                    Basic Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="table_name">Database Table *</Label>
                                                        <Select
                                                            value={selectedTableName}
                                                            onValueChange={setSelectedTableName}
                                                            disabled={!!editingTable}
                                                        >
                                                            <SelectTrigger className={`${errors.table_name ? 'border-red-500' : ''}`}>
                                                                <SelectValue placeholder="Select a table from database">
                                                                    {selectedTableName ? selectedTableName : "Select a table"}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <div className="p-2 border-b">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <Input
                                                                            placeholder="Search tables..."
                                                                            value={searchQuery}
                                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                                            className="pl-9"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto">
                                                                    {filteredActualTables
                                                                        .filter(table => table && table.trim() !== '')
                                                                        .map((table: string) => {
                                                                            const isConfigured = connection.tables?.some((t: TableConfig) => t.table_name === table);
                                                                            return (
                                                                                <SelectItem key={table} value={table}>
                                                                                    <div className="flex items-center justify-between w-full">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Grid3x3 className="w-4 h-4" />
                                                                                            <span>{table}</span>
                                                                                        </div>
                                                                                        {isConfigured && (
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                Configured
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </SelectItem>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.table_name && (
                                                            <p className="text-red-500 text-sm">{errors.table_name}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="name">Display Name *</Label>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={e => setData("name", e.target.value)}
                                                            placeholder="e.g., Products Inventory"
                                                            className={errors.name ? 'border-red-500' : ''}
                                                            required
                                                        />
                                                        {errors.name && (
                                                            <p className="text-red-500 text-sm">{errors.name}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="primary_key" className="flex items-center gap-2">
                                                            <Key className="w-4 h-4" />
                                                            Primary Key *
                                                        </Label>
                                                        <Select
                                                            value={data.primary_key}
                                                            onValueChange={value => setData("primary_key", value)}
                                                            disabled={loadingColumns || columns.length === 0}
                                                        >
                                                            <SelectTrigger className={`${errors.primary_key ? 'border-red-500' : ''}`}>
                                                                <SelectValue placeholder={loadingColumns ? "Loading..." : columns.length === 0 ? "No columns" : "Select primary key"} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {columns
                                                                    .filter(col => col && col.trim() !== '')
                                                                    .map((col: string) => (
                                                                        <SelectItem key={col} value={col}>
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{col}</span>
                                                                                <Badge variant="outline" className="ml-2 text-xs font-mono">
                                                                                    {columnTypes[col] || 'varchar'}
                                                                                </Badge>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.primary_key && (
                                                            <p className="text-red-500 text-sm">{errors.primary_key}</p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label htmlFor="order">Display Order</Label>
                                                        <Input
                                                            id="order"
                                                            type="number"
                                                            value={data.order}
                                                            onChange={e => setData("order", parseInt(e.target.value) || 0)}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column Configuration */}
                                            {loadingColumns ? (
                                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                                                    <div className="text-center">
                                                        <p className="font-medium">Loading table structure...</p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Fetching columns from {selectedTableName}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : columns.length > 0 ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                                            <Columns className="w-5 h-5" />
                                                            Column Configuration
                                                            <Badge variant="outline" className="ml-2">
                                                                {columns.length} columns
                                                            </Badge>
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={selectAllFields}
                                                            >
                                                                Select All
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={deselectAllFields}
                                                            >
                                                                Deselect All
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="border rounded-lg overflow-hidden">
                                                        <div className="bg-gray-50 px-4 py-3 border-b">
                                                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                                                                <div className="col-span-1 text-center">Show</div>
                                                                <div className="col-span-3">Column</div>
                                                                <div className="col-span-2">Type</div>
                                                                <div className="col-span-2 text-center">Editable</div>
                                                                <div className="col-span-3">Input Type</div>
                                                                <div className="col-span-1">Properties</div>
                                                            </div>
                                                        </div>
                                                        <div className="max-h-96 overflow-y-auto">
                                                            {columns
                                                                .filter(col => col && col.trim() !== '')
                                                                .map((col: string) => {
                                                                    const columnType = columnTypes[col] || 'varchar';
                                                                    const isPrimary = col === data.primary_key;

                                                                    return (
                                                                        <div
                                                                            key={col}
                                                                            className={`px-4 py-3 border-b hover:bg-gray-50 ${isPrimary ? 'bg-yellow-50' : ''}`}
                                                                        >
                                                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                                                {/* Show/Hide */}
                                                                                <div className="col-span-1 text-center">
                                                                                    <Switch
                                                                                        checked={data.fields.includes(col)}
                                                                                        onCheckedChange={() => toggleField(col)}
                                                                                        disabled={isPrimary}
                                                                                    />
                                                                                </div>

                                                                                {/* Column Name */}
                                                                                <div className="col-span-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {getMysqlTypeIcon(columnType)}
                                                                                        <span className={`font-medium ${isPrimary ? 'text-yellow-700' : ''}`}>
                                                                                            {col}
                                                                                        </span>
                                                                                        {isPrimary && (
                                                                                            <Badge variant="secondary" className="text-xs">
                                                                                                <Key className="w-3 h-3 mr-1" />
                                                                                                PK
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Type */}
                                                                                <div className="col-span-2">
                                                                                    <Badge variant="outline" className="font-mono text-xs">
                                                                                        {columnType}
                                                                                    </Badge>
                                                                                </div>

                                                                                {/* Editable */}
                                                                                <div className="col-span-2 text-center">
                                                                                    <Switch
                                                                                        checked={data.editable_fields.includes(col)}
                                                                                        onCheckedChange={() => toggleEditable(col)}
                                                                                        disabled={!data.fields.includes(col) || isPrimary}
                                                                                    />
                                                                                </div>

                                                                                {/* Input Type */}
                                                                                <div className="col-span-3">
                                                                                    <Select
                                                                                        value={data.input_types[col] || 'text'}
                                                                                        onValueChange={value => setInputType(col, value)}
                                                                                        disabled={!data.editable_fields.includes(col)}
                                                                                    >
                                                                                        <SelectTrigger className="w-full">
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {getInputTypeOptions().map(option => (
                                                                                                <SelectItem key={option.value} value={option.value}>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {option.icon}
                                                                                                        {option.label}
                                                                                                    </div>
                                                                                                </SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </div>

                                                                                {/* Properties */}
                                                                                <div className="col-span-1">
                                                                                    <div className="flex justify-end">
                                                                                        {isPrimary && (
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                PK
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : selectedTableName && !loadingColumns ? (
                                                <div className="text-center py-8 border rounded-lg bg-gray-50">
                                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-600">No columns found for table "{selectedTableName}"</p>
                                                </div>
                                            ) : null}

                                            <DialogFooter className="gap-2 pt-4 border-t">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowForm(false);
                                                        reset();
                                                        setEditingTable(null);
                                                        setSelectedTableName("");
                                                        setColumns([]);
                                                        setColumnTypes({});
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={processing || loadingColumns}
                                                    className="gap-2"
                                                >
                                                    {processing ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : editingTable ? (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            Update Table
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4" />
                                                            Add Table
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="configured" className="gap-2">
                                <Settings className="w-4 h-4" />
                                Configured Tables
                                <Badge variant="secondary" className="ml-2">
                                    {connection.tables?.length || 0}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="available" className="gap-2">
                                <Database className="w-4 h-4" />
                                Available Tables
                                <Badge variant="secondary" className="ml-2">
                                    {actualTables.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Configured Tables Tab */}
                        <TabsContent value="configured" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>Configured Tables</CardTitle>
                                            <CardDescription>
                                                Tables that have been configured for use in the application
                                            </CardDescription>
                                        </div>
                                        <div className="w-full sm:w-64">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search tables..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {filteredConfiguredTables.length > 0 ? (
                                        <div className="rounded-md border">
                                            <UITable>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Display Name</TableHead>
                                                        <TableHead>Table Name</TableHead>
                                                        <TableHead>Primary Key</TableHead>
                                                        <TableHead>Fields</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredConfiguredTables.map((table: TableConfig) => (
                                                        <TableRow key={table.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Grid3x3 className="w-4 h-4 text-blue-600" />
                                                                    {table.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                                    {table.table_name}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Key className="w-4 h-4 text-yellow-600" />
                                                                    <span>{table.primary_key}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {table.fields.slice(0, 3).map((field: string) => (
                                                                        <Badge key={field} variant="secondary" className="text-xs">
                                                                            {field}
                                                                        </Badge>
                                                                    ))}
                                                                    {table.fields.length > 3 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{table.fields.length - 3} more
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={table.is_active ? "default" : "secondary"}>
                                                                    {table.is_active ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => editTable(table)}
                                                                    >
                                                                        <Edit className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        asChild
                                                                    >
                                                                        <Link href={`/product?conn=${connection.id}&table=${table.id}`}>
                                                                            <Eye className="w-3 h-3" />
                                                                        </Link>
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button size="sm" variant="destructive">
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Delete Table Configuration</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This will delete the table configuration but won't affect the actual database table.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => table.id && deleteTable(table.id)}
                                                                                    className="bg-red-600"
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </UITable>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <Database className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">No tables configured</h3>
                                            <Button onClick={() => setShowForm(true)} className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                Add Your First Table
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Available Tables Tab */}
                        <TabsContent value="available">
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>Available Database Tables</CardTitle>
                                            <CardDescription>
                                                All tables found in the database
                                            </CardDescription>
                                        </div>
                                        <div className="w-full sm:w-64">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search tables..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredActualTables
                                            .filter(table => table && table.trim() !== '')
                                            .map((tableName: string) => {
                                                const isConfigured = connection.tables?.some((t: TableConfig) => t.table_name === tableName);
                                                const configuredTable = connection.tables?.find((t: TableConfig) => t.table_name === tableName);

                                                return (
                                                    <Card key={tableName}>
                                                        <CardContent className="pt-6">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`p-2 rounded ${isConfigured ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                                        <Grid3x3 className={`w-5 h-5 ${isConfigured ? 'text-green-600' : 'text-gray-600'}`} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium">{tableName}</h4>
                                                                        {configuredTable && (
                                                                            <p className="text-sm text-gray-600">
                                                                                {configuredTable.name}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isConfigured ? (
                                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                                        <Check className="w-3 h-3 mr-1" />
                                                                        Configured
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline">Available</Badge>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 flex gap-2">
                                                                {isConfigured ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="flex-1"
                                                                            onClick={() => configuredTable && editTable(configuredTable)}
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            className="flex-1"
                                                                            asChild
                                                                        >
                                                                            <Link href={`/product?conn=${connection.id}&table=${configuredTable?.id}`}>
                                                                                View
                                                                            </Link>
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => {
                                                                            setSelectedTableName(tableName);
                                                                            setShowForm(true);
                                                                            setEditingTable(null);
                                                                        }}
                                                                    >
                                                                        Configure
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
