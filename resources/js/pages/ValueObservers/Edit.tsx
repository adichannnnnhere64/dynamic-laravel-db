import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Label
} from '@/components/ui/label';
import {
    Input
} from '@/components/ui/input';
import {
    Textarea
} from '@/components/ui/textarea';
import {
    Button
} from '@/components/ui/button';
import {
    Badge
} from '@/components/ui/badge';
import {
    Separator
} from '@/components/ui/separator';
import {
    Switch
} from '@/components/ui/switch';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    AlertCircle,
    Bell,
    ChevronLeft,
    Database,
    Grid3x3,
    Mail,
    MessageSquare,
    Plus,
    Save,
    TestTube,
    X
} from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface Props {
    observer: any;
    connections: any[];
    selectedConnection: any;
    selectedTable: any;
    fields: string[];
}

export default function ValueObserversEdit({
    observer,
    connections,
    selectedConnection,
    selectedTable,
    fields
}: Props) {
    const [connectionId, setConnectionId] = useState(selectedConnection?.id?.toString() || '');
    const [tableId, setTableId] = useState(selectedTable?.id?.toString() || '');
    const [availableTables, setAvailableTables] = useState<any[]>([]);
    const [availableFields, setAvailableFields] = useState<string[]>(fields || []);
    const [loadingFields, setLoadingFields] = useState(false);
    const [notificationTab, setNotificationTab] = useState(
        observer.telegram_bot_token && observer.telegram_chat_ids?.length > 0 ? 'telegram' : 'email'
    );

    const { data, setData, put, processing, errors } = useForm({
        name: observer.name || '',
        field_to_watch: observer.field_to_watch || '',
        condition_type: observer.condition_type || 'less_than',
        threshold_value: observer.threshold_value || '',
        string_value: observer.string_value || '',
        is_active: observer.is_active ?? true,
        notification_emails: observer.notification_emails || [''],
        telegram_chat_ids: observer.telegram_chat_ids || [''],
        telegram_bot_token: observer.telegram_bot_token || '',
        notification_subject: observer.notification_subject || 'Database Alert: {observer_name}',
        notification_message: observer.notification_message || 'The condition "{condition}" has been met for field "{field}" in table "{table_name}". Current value: {current_value}',
        check_interval_minutes: observer.check_interval_minutes || 60,
    });

    useEffect(() => {
        if (selectedConnection) {
            setConnectionId(selectedConnection.id.toString());

            const connection = connections.find(c => c.id === selectedConnection.id);
            if (connection?.tables) {
                setAvailableTables(connection.tables);
            }

            setTableId(selectedTable?.id?.toString() || '');
            setAvailableFields(fields || []);
        }
    }, [selectedConnection, selectedTable, connections, fields]);

    useEffect(() => {
        if (tableId) {
            const table = availableTables.find(t => t.id.toString() === tableId);
            if (table?.fields) {
                setAvailableFields(table.fields);
            }
        }
    }, [tableId, availableTables]);

    const loadTableFields = async (tableId: string) => {
        try {
            setLoadingFields(true);
            const response = await fetch(`/value-observers/table-fields/${tableId}`);
            const data = await response.json();
            setAvailableFields(data.fields || []);
        } catch (error) {
            console.error('Failed to load table fields:', error);
            toast.error('Failed to load table fields');
        } finally {
            setLoadingFields(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty values
        const validEmails = data.notification_emails.filter(email => email && email.trim() !== '');
        const validTelegramIds = data.telegram_chat_ids.filter(id => id && id.trim() !== '');

        const hasEmailNotifications = validEmails.length > 0;
        const hasTelegramNotifications = validTelegramIds.length > 0 && data.telegram_bot_token.trim() !== '';

        if (!hasEmailNotifications && !hasTelegramNotifications) {
            toast.error('Configuration Error', {
                description: 'Please provide at least one notification method (email or Telegram)'
            });
            return;
        }

        // Prepare cleaned data
        const formData = {
            ...data,
            notification_emails: validEmails,
            telegram_chat_ids: validTelegramIds,
            telegram_bot_token: data.telegram_bot_token.trim() || null,
            threshold_value: data.threshold_value || null,
            string_value: data.string_value || null,
        };

        put(`/value-observers/${observer.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Value Observer Updated', {
                    description: 'Your observer has been updated successfully'
                });
            },
            onError: (errors) => {
                if (errors.notification_method) {
                    toast.error('Configuration Error', {
                        description: errors.notification_method
                    });
                } else {
                    toast.error('Update Failed', {
                        description: 'Please check the form for errors'
                    });
                }
            }
        });
    };

    const handleTestNotification = () => {
        router.post(`/value-observers/${observer.id}/test-notification`, {}, {
            preserveScroll: true,
            onSuccess: (response) => {
                const results = response.props.results;
                let message = 'Test completed: ';

                if (results.email?.success) {
                    message += `Email sent to ${results.email.recipients?.length || 0} recipient(s). `;
                }

                if (results.telegram?.success) {
                    const successCount = Object.values(results.telegram.results || {}).filter((r: any) => r.success).length;
                    message += `Telegram message sent to ${successCount} chat(s).`;
                }

                toast.success('Notification Test Complete', {
                    description: message
                });
            },
            onError: () => {
                toast.error('Test Failed', {
                    description: 'Unable to test notifications'
                });
            }
        });
    };

    const handleTestObserver = () => {
        router.post(`/value-observers/${observer.id}/test`, {}, {
            preserveScroll: true,
            onSuccess: (response) => {
                toast.success('Test Completed', {
                    description: `Checked ${response.props.total_records} records, ${response.props.condition_met_count} met the condition`
                });
            },
            onError: () => {
                toast.error('Test Failed', {
                    description: 'Unable to test the observer'
                });
            }
        });
    };

    const addEmailField = () => {
        setData('notification_emails', [...data.notification_emails, '']);
    };

    const removeEmailField = (index: number) => {
        if (data.notification_emails.length > 1) {
            const newEmails = data.notification_emails.filter((_, i) => i !== index);
            setData('notification_emails', newEmails);
        }
    };

    const updateEmail = (index: number, value: string) => {
        const newEmails = [...data.notification_emails];
        newEmails[index] = value;
        setData('notification_emails', newEmails);
    };

    const addTelegramIdField = () => {
        setData('telegram_chat_ids', [...data.telegram_chat_ids, '']);
    };

    const removeTelegramIdField = (index: number) => {
        if (data.telegram_chat_ids.length > 1) {
            const newIds = data.telegram_chat_ids.filter((_, i) => i !== index);
            setData('telegram_chat_ids', newIds);
        }
    };

    const updateTelegramId = (index: number, value: string) => {
        const newIds = [...data.telegram_chat_ids];
        newIds[index] = value;
        setData('telegram_chat_ids', newIds);
    };

    const conditionTypes = [
        { value: 'less_than', label: 'Less than', description: 'Value is less than threshold' },
        { value: 'greater_than', label: 'Greater than', description: 'Value is greater than threshold' },
        { value: 'equals', label: 'Equals', description: 'Value equals threshold' },
        { value: 'not_equals', label: 'Not equals', description: 'Value does not equal threshold' },
        { value: 'contains', label: 'Contains', description: 'Value contains text' },
        { value: 'starts_with', label: 'Starts with', description: 'Value starts with text' },
        { value: 'ends_with', label: 'Ends with', description: 'Value ends with text' },
    ];

    const getConditionInput = () => {
        switch (data.condition_type) {
            case 'less_than':
            case 'greater_than':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="threshold_value">Threshold Value</Label>
                        <Input
                            id="threshold_value"
                            type="number"
                            step="any"
                            value={data.threshold_value || ''}
                            onChange={e => setData('threshold_value', e.target.value || null)}
                            placeholder="Enter threshold value"
                        />
                        {errors.threshold_value && (
                            <p className="text-sm text-red-600">{errors.threshold_value}</p>
                        )}
                    </div>
                );

            case 'equals':
            case 'not_equals':
            case 'contains':
            case 'starts_with':
            case 'ends_with':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="string_value">Text Value</Label>
                        <Input
                            id="string_value"
                            value={data.string_value || ''}
                            onChange={e => setData('string_value', e.target.value || null)}
                            placeholder="Enter text to compare"
                        />
                        {errors.string_value && (
                            <p className="text-sm text-red-600">{errors.string_value}</p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const getStatusBadge = () => {
        if (observer.is_active) {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-gray-50 dark:bg-black text-gray-700 border-gray-200">
                Inactive
            </Badge>
        );
    };

    const formatLastChecked = () => {
        if (!observer.last_checked_at) {
            return 'Never';
        }
        return new Date(observer.last_checked_at).toLocaleString();
    };

    // Helper function to check if Telegram notifications are configured
    const hasTelegramNotifications = () => {
        return observer.telegram_bot_token && observer.telegram_chat_ids?.length > 0;
    };

    return (
        <AppLayout>
            <Head title={`Edit ${observer.name}`} />

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
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl font-bold text-white">Edit Value Observer</h1>
                                            {getStatusBadge()}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Update your monitoring configuration
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Observer Stats */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{observer.trigger_count}</div>
                                <div className="text-sm text-gray-500">Total Alerts Triggered</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {observer.last_checked_at ? '✓' : '—'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Last checked: {formatLastChecked()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {observer.last_triggered_at ? '⚠️' : '✓'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {observer.last_triggered_at
                                        ? `Last alert: ${new Date(observer.last_triggered_at).toLocaleString()}`
                                        : 'No alerts triggered'
                                    }
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {hasTelegramNotifications() ? '✓' : '—'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Telegram {hasTelegramNotifications() ? 'Enabled' : 'Disabled'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Form */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Observer Configuration</CardTitle>
                            <CardDescription>
                                Update what to monitor and when to alert
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Database Info (Read-only) */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Database & Table
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Database Connection</Label>
                                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-black">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{selectedConnection?.name}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Cannot be changed after creation
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Table</Label>
                                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-black">
                                                <div className="flex items-center gap-2">
                                                    <Grid3x3 className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">{selectedTable?.name}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Cannot be changed after creation
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Step 2: Configure What to Watch */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        What to Watch
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Observer Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder="e.g., Low Stock Alert"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="field_to_watch">Field to Watch</Label>
                                            <Select
                                                value={data.field_to_watch}
                                                onValueChange={value => setData('field_to_watch', value)}
                                                disabled={loadingFields || availableFields.length === 0}
                                            >
                                                <SelectTrigger>
                                                    {loadingFields ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                            Loading fields...
                                                        </div>
                                                    ) : (
                                                        <SelectValue placeholder={
                                                            availableFields.length === 0
                                                                ? "No fields available"
                                                                : "Select a field"
                                                        } />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableFields
                                                        .filter(f => f && f.trim() !== '')
                                                        .map(field => (
                                                            <SelectItem key={field} value={field}>
                                                                {field}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            {availableFields.length === 0 && !loadingFields && (
                                                <p className="text-sm text-yellow-600">
                                                    No fields found for this table
                                                </p>
                                            )}
                                            {errors.field_to_watch && (
                                                <p className="text-sm text-red-600">{errors.field_to_watch}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="condition_type">Condition Type</Label>
                                            <Select
                                                value={data.condition_type}
                                                onValueChange={value => setData('condition_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {conditionTypes.map(condition => (
                                                        <SelectItem key={condition.value} value={condition.value}>
                                                            <div>
                                                                <div className="font-medium">{condition.label}</div>
                                                                <div className="text-xs text-gray-500">{condition.description}</div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.condition_type && (
                                                <p className="text-sm text-red-600">{errors.condition_type}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Condition Value</Label>
                                            {getConditionInput()}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Step 3: Notification Settings */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Notification Settings
                                    </h3>

                                    <Tabs value={notificationTab} onValueChange={setNotificationTab}>
                                        <TabsList className="grid grid-cols-2 mb-6">
                                            <TabsTrigger value="email" className="gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email Notifications
                                            </TabsTrigger>
                                            <TabsTrigger value="telegram" className="gap-2">
                                                <MessageSquare className="w-4 h-4" />
                                                Telegram Notifications
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="email" className="space-y-6">
                                            <div>
                                                <Label>Email Recipients</Label>
                                                <div className="space-y-3 mt-2">
                                                    {data.notification_emails.map((email, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                type="email"
                                                                value={email}
                                                                onChange={e => updateEmail(index, e.target.value)}
                                                                placeholder="email@example.com"
                                                            />
                                                            {data.notification_emails.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => removeEmailField(index)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addEmailField}
                                                    className="mt-2"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Another Email
                                                </Button>
                                                {errors.notification_emails && (
                                                    <p className="text-sm text-red-600">{errors.notification_emails}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notification_subject">Email Subject</Label>
                                                <Input
                                                    id="notification_subject"
                                                    value={data.notification_subject}
                                                    onChange={e => setData('notification_subject', e.target.value)}
                                                    placeholder="Alert: {observer_name}"
                                                    required
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Available variables: {'{observer_name}'}, {'{table_name}'}, {'{field}'}, {'{condition}'}
                                                </p>
                                                {errors.notification_subject && (
                                                    <p className="text-sm text-red-600">{errors.notification_subject}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="notification_message">Email Message</Label>
                                                <Textarea
                                                    id="notification_message"
                                                    value={data.notification_message}
                                                    onChange={e => setData('notification_message', e.target.value)}
                                                    rows={4}
                                                    required
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Available variables: {'{observer_name}'}, {'{table_name}'}, {'{field}'}, {'{condition}'}, {'{current_value}'}, {'{record_id}'}
                                                </p>
                                                {errors.notification_message && (
                                                    <p className="text-sm text-red-600">{errors.notification_message}</p>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="telegram" className="space-y-6">
                                            <div>
                                                <Label htmlFor="telegram_bot_token">Telegram Bot Token</Label>
                                                <Input
                                                    id="telegram_bot_token"
                                                    type="password"
                                                    value={data.telegram_bot_token}
                                                    onChange={e => setData('telegram_bot_token', e.target.value)}
                                                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Get your bot token from @BotFather on Telegram
                                                </p>
                                                {errors.telegram_bot_token && (
                                                    <p className="text-sm text-red-600">{errors.telegram_bot_token}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>Telegram Chat IDs</Label>
                                                <div className="space-y-3 mt-2">
                                                    {data.telegram_chat_ids.map((chatId, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                value={chatId}
                                                                onChange={e => updateTelegramId(index, e.target.value)}
                                                                placeholder="123456789"
                                                            />
                                                            {data.telegram_chat_ids.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => removeTelegramIdField(index)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addTelegramIdField}
                                                    className="mt-2"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Another Chat ID
                                                </Button>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Users need to start a chat with your bot first, then share their chat ID
                                                </p>
                                                {errors.telegram_chat_ids && (
                                                    <p className="text-sm text-red-600">{errors.telegram_chat_ids}</p>
                                                )}
                                            </div>

                                            <Card className="dark:bg-black bg-blue-50 border-blue-200">
                                                <CardContent className="pt-6">
                                                    <h4 className="font-semibold dark:text-white text-blue-800 mb-2">Telegram Message Preview</h4>
                                                    <p className="text-sm text-blue-700 dark:text-white mb-2">
                                                        Alerts will be sent in this format:
                                                    </p>
                                                    <div className="text-sm dark:bg-black bg-white p-3 rounded border">
                                                        <p>⚠️ <strong>Database Value Alert</strong></p>
                                                        <p>🔍 <strong>Observer:</strong> {data.name || 'Observer Name'}</p>
                                                        <p>📊 <strong>Table:</strong> {selectedTable?.name || 'Table Name'}</p>
                                                        <p>🎯 <strong>Field:</strong> {data.field_to_watch || 'field_name'}</p>
                                                        <p>📝 <strong>Condition:</strong> {data.condition_type?.replace('_', ' ')} {data.threshold_value || data.string_value}</p>
                                                        <p>📈 <strong>Current Value:</strong> [value]</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>

                                    {/* Error display for notification method validation */}
                                    {errors.notification_method && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                            <div className="flex items-center gap-2 text-red-800">
                                                <AlertCircle className="w-5 h-5" />
                                                <p className="text-sm font-medium">Notification Error</p>
                                            </div>
                                            <p className="text-sm text-red-700 mt-1">
                                                {errors.notification_method}
                                            </p>
                                        </div>
                                    )}

                                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                                        <div className="flex items-center gap-2 text-yellow-800">
                                            <AlertCircle className="w-5 h-5" />
                                            <p className="text-sm font-medium">Notification Method</p>
                                        </div>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            You can configure both email and Telegram notifications, or just one.
                                            At least one notification method is required.
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Step 4: Schedule & Activation */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Step 4: Schedule & Activation</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="check_interval_minutes">Check Interval (minutes)</Label>
                                            <Select
                                                value={data.check_interval_minutes.toString()}
                                                onValueChange={value => setData('check_interval_minutes', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Every minute</SelectItem>
                                                    <SelectItem value="2">Every 2 minutes</SelectItem>
                                                    <SelectItem value="3">Every 3 minutes</SelectItem>
                                                    <SelectItem value="15">Every 15 minutes</SelectItem>
                                                    <SelectItem value="30">Every 30 minutes</SelectItem>
                                                    <SelectItem value="60">Every hour</SelectItem>
                                                    <SelectItem value="180">Every 3 hours</SelectItem>
                                                    <SelectItem value="360">Every 6 hours</SelectItem>
                                                    <SelectItem value="720">Every 12 hours</SelectItem>
                                                    <SelectItem value="1440">Every day</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.check_interval_minutes && (
                                                <p className="text-sm text-red-600">{errors.check_interval_minutes}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="is_active">Observer Status</Label>
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">Active</div>
                                                    <div className="text-sm text-gray-500">
                                                        {data.is_active ? 'Observer is active and will check' : 'Observer is paused'}
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={data.is_active}
                                                    onCheckedChange={checked => setData('is_active', checked)}
                                                />
                                            </div>
                                            {errors.is_active && (
                                                <p className="text-sm text-red-600">{errors.is_active}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <CardFooter className="px-0 pb-0 pt-6">
                                    <div className="flex justify-between w-full">
                                        <div className="flex gap-2">
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
                                                type="button"
                                                variant="outline"
                                                onClick={handleTestObserver}
                                                disabled={processing}
                                                className="gap-2"
                                            >
                                                <TestTube className="w-4 h-4" />
                                                Test Observer
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleTestNotification}
                                                disabled={processing}
                                                className="gap-2"
                                            >
                                                <Bell className="w-4 h-4" />
                                                Test Notification
                                            </Button>
                                        </div>
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
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Help Info */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Observer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium">Current Configuration</h4>
                                    <div className="text-sm text-gray-600 space-y-2">
                                        <div className="flex justify-between">
                                            <span>Created:</span>
                                            <span>{new Date(observer.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Last Updated:</span>
                                            <span>{new Date(observer.updated_at).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Database:</span>
                                            <span>{selectedConnection?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Table:</span>
                                            <span>{selectedTable?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Field to Watch:</span>
                                            <span>{observer.field_to_watch}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Condition:</span>
                                            <span>{observer.condition_type?.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Check Interval:</span>
                                            <span>Every {observer.check_interval_minutes} minutes</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Email Notifications:</span>
                                            <span>{observer.notification_emails?.length || 0} recipient(s)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Telegram Notifications:</span>
                                            <span>{observer.telegram_chat_ids?.length || 0} chat(s)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Telegram Bot:</span>
                                            <span>{observer.telegram_bot_token ? 'Configured' : 'Not configured'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium">Testing</h4>
                                    <p className="text-sm text-gray-600">
                                        Use the "Test Observer" button to immediately check the current observer configuration
                                        against up to 10 records. Use the "Test Notification" button to send test notifications
                                        to all configured channels.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
