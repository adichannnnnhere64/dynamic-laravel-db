import React from 'react';
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
    AlertCircle,
    Bell,
    Calendar,
    ChevronLeft,
    Clock,
    Database,
    Edit,
    Mail,
    RefreshCw,
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
    notification_emails: string[];
    notification_subject: string;
    notification_message: string;
    check_interval_minutes: number;
    last_checked_at: string | null;
    last_triggered_at: string | null;
    trigger_count: number;
    created_at: string;
    updated_at: string;
    connection_table: {
        id: number;
        name: string;
        table_name: string;
        connection: {
            id: number;
            name: string;
            database: string;
            host: string;
            port: number;
        };
    };
    logs: Array<{
        id: number;
        record_id: string;
        current_value: number | null;
        current_string_value: string | null;
        condition_met: boolean;
        details: string;
        notification_sent_to: string[] | null;
        sent_at: string | null;
        created_at: string;
    }>;
}

interface Props {
    observer: Observer;
}

export default function ValueObserversShow({ observer }: Props) {
    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    const getConditionText = () => {
        const conditions = {
            less_than: 'Less than',
            greater_than: 'Greater than',
            equals: 'Equals',
            not_equals: 'Not equals',
            contains: 'Contains',
            starts_with: 'Starts with',
            ends_with: 'Ends with',
        };

        const condition = conditions[observer.condition_type] || observer.condition_type;

        if (observer.threshold_value !== null) {
            return `${condition} ${observer.threshold_value}`;
        } else if (observer.string_value) {
            return `${condition} "${observer.string_value}"`;
        }

        return condition;
    };

    const testObserver = () => {
        if (confirm('Test this observer now? This will check current values immediately.')) {
            router.post(`/value-observers/${observer.id}/test`);
        }
    };

    return (
        <AppLayout>
            <Head title={observer.name} />

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
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Bell className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">{observer.name}</h1>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Badge variant={observer.is_active ? "default" : "secondary"}>
                                                {observer.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <span>•</span>
                                            <span>Triggers: {observer.trigger_count}</span>
                                            <span>•</span>
                                            <span>Last check: {formatTime(observer.last_checked_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={testObserver}
                                    className="gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Test Now
                                </Button>
                                <Button
                                    variant="outline"
                                    asChild
                                >
                                    <Link href={`/value-observers/${observer.id}/edit`} className="gap-2">
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Observer Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Observer Configuration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Observer Configuration</CardTitle>
                                    <CardDescription>
                                        What this observer is monitoring
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Database Connection</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Database className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{observer.connection_table.connection.name}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {observer.connection_table.connection.database} @
                                                    {observer.connection_table.connection.host}:
                                                    {observer.connection_table.connection.port}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Table</h4>
                                                <p className="font-medium mt-1">{observer.connection_table.name}</p>
                                                <code className="text-sm text-gray-600">{observer.connection_table.table_name}</code>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Field Being Watched</h4>
                                                <Badge variant="outline" className="mt-1">
                                                    {observer.field_to_watch}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Condition</h4>
                                                <Badge className="mt-1 bg-blue-100 text-blue-800">
                                                    {getConditionText()}
                                                </Badge>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Check Interval</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>Every {observer.check_interval_minutes} minutes</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Last Trigger</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{formatTime(observer.last_triggered_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notification Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Notification Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Recipients</h4>
                                            <div className="space-y-1">
                                                {observer.notification_emails.map((email, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span>{email}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Email Subject</h4>
                                            <p className="font-mono text-sm bg-gray-50 dark:bg-black p-2 rounded">
                                                {observer.notification_subject}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Email Message</h4>
                                            <div className="font-mono text-sm bg-gray-50 dark:bg-black p-3 rounded whitespace-pre-wrap">
                                                {observer.notification_message}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Stats & Actions */}
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {observer.trigger_count}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Triggers</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-xl font-bold">
                                                    {observer.logs.filter(log => log.condition_met).length}
                                                </div>
                                                <div className="text-sm text-gray-600">Conditions Met</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold">
                                                    {observer.logs.filter(log => log.notification_sent_to).length}
                                                </div>
                                                <div className="text-sm text-gray-600">Emails Sent</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <div className="text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Created</span>
                                                    <span>{new Date(observer.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-gray-600">Last Updated</span>
                                                    <span>{new Date(observer.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {observer.logs.length > 0 ? (
                                        <div className="space-y-3">
                                            {observer.logs.slice(0, 5).map(log => (
                                                <div
                                                    key={log.id}
                                                    className={`p-3 rounded border ${
                                                        log.condition_met
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-gray-50 dark:bg-black border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {log.condition_met ? (
                                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-gray-300" />
                                                            )}
                                                            <span className="text-sm font-medium">
                                                                Record {log.record_id}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(log.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 text-sm">
                                                        Value: {log.current_value || log.current_string_value || 'N/A'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            No activity yet
                                        </div>
                                    )}

                                    {observer.logs.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-3"
                                            asChild
                                        >
                                            <Link href={`/value-observers/${observer.id}/logs`}>
                                                View All Activity
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Button
                                            variant="destructive"
                                            className="w-full gap-2"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this observer? This action cannot be undone.')) {
                                                    router.delete(`/value-observers/${observer.id}`);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Observer
                                        </Button>
                                        <p className="text-xs text-gray-500">
                                            Deleting this observer will remove all configuration and logs.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
