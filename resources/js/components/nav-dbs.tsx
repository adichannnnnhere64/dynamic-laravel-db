import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Circle, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface NavMainDbsProps {
    items: NavItem[];
    onRefresh?: () => void;
}

export function NavMainDbs({ items = [], onRefresh }: NavMainDbsProps) {
    const page = usePage();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };

    const getStatusIcon = (status: 'connected' | 'disconnected' | 'checking') => {
        switch (status) {
            case 'connected':
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            case 'disconnected':
                return <XCircle className="w-3 h-3 text-red-500" />;
            case 'checking':
                return <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />;
            default:
                return <Circle className="w-3 h-3 text-gray-400" />;
        }
    };

    const getStatusText = (status: 'connected' | 'disconnected' | 'checking') => {
        switch (status) {
            case 'connected':
                return 'connected';
            case 'disconnected':
                return 'disconnected';
            case 'checking':
                return 'checking...';
            default:
                return 'unknown';
        }
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <div className="flex items-center justify-between px-3 py-2">
                <SidebarGroupLabel>Databases</SidebarGroupLabel>
                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Refresh connection status"
                    >
                        {refreshing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3" />
                        )}
                    </button>
                )}
            </div>
            <SidebarMenu>
                {items.map((item) => {
                    const status = item.status as 'connected' | 'disconnected' | 'checking' || 'checking';

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url.startsWith(
                                    typeof item.href === 'string'
                                        ? item.href
                                        : item.href.url,
                                )}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <div className="flex items-center justify-between w-full">
                                        <span>{item.title}</span>
                                        <div className="flex items-center gap-1 ml-2">
                                            {getStatusIcon(status)}
                                            <span className={`text-xs ${
                                                status === 'connected' ? 'text-green-600' :
                                                status === 'disconnected' ? 'text-red-600' :
                                                status === 'checking' ? 'text-yellow-600' : 'text-gray-600'
                                            }`}>
                                                {getStatusText(status)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
