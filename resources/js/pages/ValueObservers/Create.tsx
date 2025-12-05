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
    AlertCircle,
    Bell,
    ChevronLeft,
    Database,
    Grid3x3,
    Mail,
    Plus,
    Save,
    X
} from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface Props {
    connections: any[];
    selectedConnection: any;
    selectedTable: any;
    fields: string[];
}

export default function ValueObserversCreate({
    connections,
    selectedConnection,
    selectedTable,
    fields
}: Props) {
    const [connectionId, setConnectionId] = useState(selectedConnection?.id?.toString() || '');
    const [tableId, setTableId] = useState(selectedTable?.id?.toString() || '');
    const [availableTables, setAvailableTables] = useState<any[]>([]);
    const [availableFields, setAvailableFields] = useState<string[]>(fields || []);

    const { data, setData, post, processing, errors } = useForm({
        connection_table_id: tableId ? parseInt(tableId) : '',
        name: '',
        field_to_watch: '',
        condition_type: 'less_than',
        threshold_value: '',
        string_value: '',
        is_active: true,
        notification_emails: [''],
        notification_subject: 'Database Alert: {observer_name}',
        notification_message: 'The condition "{condition}" has been met for field "{field}" in table "{table_name}". Current value: {current_value}',
        check_interval_minutes: 60,
    });

    // Update available tables when connection changes
    useEffect(() => {
        if (connectionId) {
            const connection = connections.find(c => c.id.toString() === connectionId);
            setAvailableTables(connection?.tables || []);

            // Reset table selection
            setTableId('');
            setData('connection_table_id', '');
            setAvailableFields([]);
        }
    }, [connectionId]);

    // Update fields when table changes
    useEffect(() => {
        if (tableId) {
            const table = availableTables.find(t => t.id.toString() === tableId);
            setAvailableFields(table?.fields || []);
            setData('connection_table_id', parseInt(tableId));

            // Auto-select first field
            if (table?.fields?.length > 0 && !data.field_to_watch) {
                setData('field_to_watch', table.fields[0]);
            }
        }
    }, [tableId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out empty emails
        const validEmails = data.notification_emails.filter(email => email && email.trim() !== '');
        if (validEmails.length === 0) {
            toast.error('At least one notification email is required');
            return;
        }

        post('/value-observers', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Value Observer Created', {
                    description: 'Your observer has been created successfully'
                });
            },
            onError: () => {
                toast.error('Creation Failed', {
                    description: 'Please check the form for errors'
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
                            value={data.threshold_value}
                            onChange={e => setData('threshold_value', e.target.value)}
                            placeholder="Enter threshold value"
                            required
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
                            value={data.string_value}
                            onChange={e => setData('string_value', e.target.value)}
                            placeholder="Enter text to compare"
                            required
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

    return (
        <AppLayout>
            <Head title="Create Value Observer" />

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
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Bell className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Create Value Observer</h1>
                                        <p className="text-sm text-gray-600">
                                            Monitor database values and get alerts
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Observer Configuration</CardTitle>
                            <CardDescription>
                                Configure what to monitor and when to alert
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Step 1: Select Database & Table */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Step 1: Select Database & Table
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="connection">Database Connection</Label>
                                            <Select value={connectionId} onValueChange={setConnectionId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a connection" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {connections
                                                        .filter(c => c && c.id && c.name)
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

                                        <div className="space-y-2">
                                            <Label htmlFor="table">Table</Label>
                                            <Select
                                                value={tableId}
                                                onValueChange={setTableId}
                                                disabled={!connectionId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={connectionId ? "Select a table" : "Select connection first"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableTables
                                                        .filter(t => t && t.id && t.name)
                                                        .map(table => (
                                                            <SelectItem key={table.id} value={table.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <Grid3x3 className="w-4 h-4" />
                                                                    {table.name}
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        {table.table_name}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {errors.connection_table_id && (
                                        <p className="text-sm text-red-600">{errors.connection_table_id}</p>
                                    )}
                                </div>

                                <Separator />

                                {/* Step 2: Configure What to Watch */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Step 2: Configure What to Watch
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
                                                disabled={!tableId}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={tableId ? "Select a field" : "Select table first"} />
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
                                        <Mail className="w-5 h-5" />
                                        Step 3: Notification Settings
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <Label>Notification Emails</Label>
                                            <div className="space-y-3 mt-2">
                                                {data.notification_emails.map((email, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <Input
                                                            type="email"
                                                            value={email}
                                                            onChange={e => updateEmail(index, e.target.value)}
                                                            placeholder="email@example.com"
                                                            required={index === 0}
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
                                                    <SelectItem value="5">Every 5 minutes</SelectItem>
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
                                                    Create Observer
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Help Info */}
                </div>
            </div>
        </AppLayout>
    );
}
