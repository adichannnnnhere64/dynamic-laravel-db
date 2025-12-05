import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Badge
} from '@/components/ui/badge';
import {
    Button
} from '@/components/ui/button';
import {
    Input
} from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    AlertCircle,
    Bell,
    Check,
    Clock,
    Database,
    Eye,
    Filter,
    Plus,
    RefreshCw,
    Search,
    Settings,
    Trash2
} from 'lucide-react';

interface Observer {
    id: number;
    name: string;
    field_to_watch: string;
    condition_type: string;
    threshold_value: number | null;
    string_value: string | null;
    is_active: boolean;
    check_interval_minutes: number;
    last_checked_at: string | null;
    last_triggered_at: string | null;
    trigger_count: number;
    connection_table: {
        id: number;
        name: string;
        table_name: string;
        connection: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    observers: {
        data: Observer[];
        links: any[];
    };
    connections: any[];
    filters: {
        search?: string;
        connection_id?: string;
    };
}

export default function ValueObserversIndex({ observers, connections, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [connectionId, setConnectionId] = useState(filters.connection_id || '');

    const handleSearch = () => {
        router.get('/value-observers', {
            search: search || null,
            connection_id: connectionId || null,
        }, { preserveState: true });
    };

    const getConditionBadge = (observer: Observer) => {
        const conditions = {
            less_than: { label: 'Less than', color: 'bg-red-100 text-red-800' },
            greater_than: { label: 'Greater than', color: 'bg-green-100 text-green-800' },
            equals: { label: 'Equals', color: 'bg-blue-100 text-blue-800' },
            not_equals: { label: 'Not equals', color: 'bg-yellow-100 text-yellow-800' },
            contains: { label: 'Contains', color: 'bg-purple-100 text-purple-800' },
            starts_with: { label: 'Starts with', color: 'bg-pink-100 text-pink-800' },
            ends_with: { label: 'Ends with', color: 'bg-indigo-100 text-indigo-800' },
        };

        const condition = conditions[observer.condition_type] || { label: observer.condition_type, color: 'bg-gray-100 text-gray-800' };

        return (
            <Badge className={condition.color}>
                {condition.label}
                {observer.threshold_value !== null && ` ${observer.threshold_value}`}
                {observer.string_value && ` "${observer.string_value}"`}
            </Badge>
        );
    };

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    };

    return (
        <AppLayout>
            <Head title="Value Observers" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="border-b bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Bell className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Value Observers</h1>
                                        <p className="text-sm text-gray-600">
                                            Monitor database values and get alerts
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button asChild>
                                <Link href="/value-observers/create" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create Observer
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Search observers..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
<div className="w-full sm:w-64">
    <Select value={connectionId} onValueChange={setConnectionId}>
        <SelectTrigger>
            <SelectValue placeholder="All connections" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">All connections</SelectItem> {/* Changed from empty string */}
            {connections
                .filter(conn => conn && conn.id && conn.name && conn.name.trim() !== '')
                .map(conn => (
                    <SelectItem key={conn.id} value={conn.id.toString()}>
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            {conn.name}
                        </div>
                    </SelectItem>
                ))
            }
        </SelectContent>
    </Select>
</div>

                                <div className="flex gap-2">
                                    <Button onClick={handleSearch} variant="outline" className="gap-2">
                                        <Filter className="w-4 h-4" />
                                        Apply
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSearch('');
                                            setConnectionId('');
                                            router.get('/value-observers');
                                        }}
                                        variant="ghost"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observers Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Observers</CardTitle>
                            <CardDescription>
                                {observers.data.length} observer{observers.data.length !== 1 ? 's' : ''} configured
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {observers.data.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Table & Field</TableHead>
                                                <TableHead>Condition</TableHead>
                                                <TableHead>Check Interval</TableHead>
                                                <TableHead>Last Check</TableHead>
                                                <TableHead>Triggers</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {observers.data.map(observer => (
                                                <TableRow key={observer.id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                        <Badge variant={observer.is_active ? "default" : "secondary"}>
                                                            {observer.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Bell className="w-4 h-4 text-purple-600" />
                                                            {observer.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {observer.connection_table.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Field: <code>{observer.field_to_watch}</code>
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {observer.connection_table.connection.name}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getConditionBadge(observer)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            {observer.check_interval_minutes} min
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {formatTimeAgo(observer.last_checked_at)}
                                                        </div>
                                                        {observer.last_triggered_at && (
                                                            <div className="text-xs text-red-600">
                                                                Last alert: {formatTimeAgo(observer.last_triggered_at)}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {observer.trigger_count} time{observer.trigger_count !== 1 ? 's' : ''}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link href={`/value-observers/${observer.id}`}>
                                                                    <Eye className="w-3 h-3" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link href={`/value-observers/${observer.id}/edit`}>
                                                                    <Settings className="w-3 h-3" />
                                                                </Link>
                                                            </Button>

                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No observers configured</h3>
                                    <p className="text-gray-600 mb-6">
                                        Create your first value observer to monitor database fields
                                    </p>
                                    <Button asChild>
                                        <Link href="/value-observers/create" className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Create Observer
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
