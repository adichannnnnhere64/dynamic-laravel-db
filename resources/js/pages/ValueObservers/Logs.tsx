import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    Check,
    Clock,
    Database,
    Eye,
    Mail,
    MessageSquare,
    Send,
    X
} from 'lucide-react';

interface Log {
    id: number;
    value_observer_id: number;
    record_id: string;
    current_value: number | null;
    current_string_value: string | null;
    condition_met: boolean;
    details: string | null;
    notification_sent_to: string[] | null;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

interface ConnectionTable {
    id: number;
    name: string;
    table_name: string;
    connection: {
        id: number;
        name: string;
    };
}

interface Observer {
    id: number;
    name: string;
    field_to_watch: string;
    condition_type: string;
    is_active: boolean;
    connection_table_id: number;
    connection_table: ConnectionTable;
    has_telegram_notifications: boolean;
    has_email_notifications: boolean;
    has_any_notifications: boolean;
}

interface Props {
    observer: Observer;
    logs: {
        data: Log[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number;
            to: number;
        };
    };
}

export default function ValueObserverLogs({ observer, logs }: Props) {
    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;

        return formatDateTime(dateString);
    };

    const getConditionBadge = (conditionMet: boolean) => {
        if (conditionMet) {
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Condition Met
                </Badge>
            );
        }
        return (
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                <X className="w-3 h-3 mr-1" />
                No Match
            </Badge>
        );
    };

    const getNotificationBadge = (sentAt: string | null, sentTo: any) => {
        try {
            // Handle null/undefined sentTo
            if (!sentAt || !sentTo) {
                return (
                    <Badge variant="outline" className="text-gray-500">
                        Not Sent
                    </Badge>
                );
            }

            // Parse sentTo if needed
            let notifications: string[] = [];

            if (typeof sentTo === 'string') {
                try {
                    notifications = JSON.parse(sentTo);
                } catch (e) {
                    // If it's not JSON, try to split by comma
                    notifications = sentTo.split(',').map((item: string) => item.trim()).filter(Boolean);
                }
            } else if (Array.isArray(sentTo)) {
                notifications = sentTo;
            } else {
                // If it's not an array or string, return default
                return (
                    <Badge variant="outline" className="text-gray-500">
                        Not Sent
                    </Badge>
                );
            }

            // Ensure we have an array with items
            if (!Array.isArray(notifications) || notifications.length === 0) {
                return (
                    <Badge variant="outline" className="text-gray-500">
                        Not Sent
                    </Badge>
                );
            }

            // Count email and Telegram notifications
            const emailCount = notifications.filter((item: string) => {
                return item && typeof item === 'string' && item.includes('@');
            }).length;

            const telegramCount = notifications.filter((item: string) => {
                return item && typeof item === 'string' && !item.includes('@') && /^\d+$/.test(item);
            }).length;

            return (
                <div className="flex flex-col gap-1">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Send className="w-3 h-3 mr-1" />
                        Sent {formatTimeAgo(sentAt)}
                    </Badge>
                    {emailCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3" />
                            {emailCount} email{emailCount !== 1 ? 's' : ''}
                        </div>
                    )}
                    {telegramCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <MessageSquare className="w-3 h-3" />
                            {telegramCount} Telegram{telegramCount !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            );
        } catch (error) {
            console.error('Error rendering notification badge:', error);
            return (
                <Badge variant="outline" className="text-gray-500">
                    Error
                </Badge>
            );
        }
    };

    const getValueDisplay = (log: Log) => {
        if (log.current_value !== null) {
            return (
                <div className="font-mono text-sm">
                    {log.current_value}
                </div>
            );
        }
        if (log.current_string_value) {
            return (
                <div className="max-w-xs truncate text-sm" title={log.current_string_value}>
                    "{log.current_string_value}"
                </div>
            );
        }
        return <span className="text-gray-400 text-sm">N/A</span>;
    };

    const getConditionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            less_than: 'Less than',
            greater_than: 'Greater than',
            equals: 'Equals',
            not_equals: 'Not equals',
            contains: 'Contains',
            starts_with: 'Starts with',
            ends_with: 'Ends with',
            date_near_expiry: 'Date near expiry',
            date_expired: 'Date expired',
            date_future: 'Future date',
            date_past: 'Past date',
        };

        return labels[type] || type.replace('_', ' ');
    };

    return (
        <AppLayout>
            <Head title={`${observer.name} - Logs`} />

            <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Header */}
                <div className="border-b bg-white dark:bg-black">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="gap-2"
                                >
                                    <Link href={`/value-observers/${observer.id}`}>
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Observer
                                    </Link>
                                </Button>
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white">
                                            {observer.name} - Logs
                                        </h1>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Monitoring <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{observer.field_to_watch}</code> on{' '}
                                            <span className="font-medium">{observer.connection_table.table_name}</span> •{' '}
                                            <span className="text-purple-600 dark:text-purple-400">{getConditionTypeLabel(observer.condition_type)}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant={observer.is_active ? "default" : "secondary"}>
                                    {observer.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {observer.has_email_notifications && (
                                    <Badge variant="outline" className="border-blue-500 text-blue-500">
                                        <Mail className="w-3 h-3 mr-1" />
                                        Email
                                    </Badge>
                                )}
                                {observer.has_telegram_notifications && (
                                    <Badge variant="outline" className="border-green-500 text-green-500">
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        Telegram
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Card */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {logs.meta?.total}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Logs
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {logs.data.filter(log => log.condition_met).length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Conditions Met
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {logs.data.filter(log => log.notification_sent_to && log.sent_at).length}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Notifications Sent
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        <Database className="w-5 h-5 inline mr-2" />
                                        {observer.connection_table.connection.name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Connection
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {observer.connection_table.name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Table
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logs Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Logs</CardTitle>
                            <CardDescription>
                                Showing {logs.meta?.from} to {logs.meta?.to} of {logs?.meta?.total} logs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {logs.data.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Time</TableHead>
                                                <TableHead>Record ID</TableHead>
                                                <TableHead>Value</TableHead>
                                                <TableHead>Condition</TableHead>
                                                <TableHead>Notification</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.data.map(log => (
                                                <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <div className="font-medium text-sm">
                                                                {formatDateTime(log.created_at)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatTimeAgo(log.created_at)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                            {log.record_id}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getValueDisplay(log)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getConditionBadge(log.condition_met)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getNotificationBadge(log.sent_at, log.notification_sent_to)}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        {log.details ? (
                                                            <div
                                                                className="text-sm text-gray-600 dark:text-gray-400 truncate"
                                                                title={log.details}
                                                            >
                                                                {log.details}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">No details</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        No activity has been recorded for this observer yet
                                    </p>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <Link href={`/value-observers/${observer.id}`}>
                                            <Eye className="w-4 h-4" />
                                            View Observer Details
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>

                        {/* Pagination */}
                        {logs.meta?.last_page > 1 && (
                            <CardFooter>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={logs.links[0]?.url || '#'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (logs.links[0]?.url) {
                                                        router.get(logs.links[0].url);
                                                    }
                                                }}
                                                className={!logs.links[0]?.url ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {logs.links.slice(1, -1).map((link, index) => (
                                            <PaginationItem key={index}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (link.url) {
                                                            router.get(link.url);
                                                        }
                                                    }}
                                                    isActive={link.active}
                                                >
                                                    {link.label}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href={logs.links[logs.links.length - 1]?.url || '#'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (logs.links[logs.links.length - 1]?.url) {
                                                        router.get(logs.links[logs.links.length - 1].url);
                                                    }
                                                }}
                                                className={!logs.links[logs.links.length - 1]?.url ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
