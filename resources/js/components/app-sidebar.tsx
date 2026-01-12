import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, XIcon, Database, Table, Circle } from 'lucide-react';
import AppLogo from './app-logo';
import { NavMainDbs } from './nav-dbs';
import { NavMainTbs } from './nav-tbs';
import { useState, useEffect } from 'react';

const mainNavItems: NavItem[] = [
    {
        title: 'Stock Observer',
        href: '/value-observers',
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Create new connection',
        href: '/connect',
        icon: Database,
    },
];

export function AppSidebar() {
    const [connectionStatuses, setConnectionStatuses] = useState<Record<number, 'connected' | 'disconnected' | 'checking'>>({});
    const { db_connections, tables } = usePage().props;

    // Check all connections on mount
    useEffect(() => {
        if (db_connections && db_connections.length > 0) {
            checkAllConnections();
        }
    }, [db_connections]);

    const checkAllConnections = async () => {
        const statuses: Record<number, 'connected' | 'disconnected' | 'checking'> = {};

        // Initialize all as checking
        db_connections.forEach((conn: any) => {
            statuses[conn.id] = 'checking';
        });
        setConnectionStatuses(statuses);

        // Check each connection
        for (const conn of db_connections) {
            try {
                const response = await fetch(`/api/connection/${conn.id}/test`);
                const data = await response.json();

                statuses[conn.id] = data.success ? 'connected' : 'disconnected';
                setConnectionStatuses({ ...statuses });
            } catch (error) {
                statuses[conn.id] = 'disconnected';
                setConnectionStatuses({ ...statuses });
            }
        }
    };

    const dbNavItems = db_connections.map((item: any) => {
        const status = connectionStatuses[item.id] || 'checking';

        return {
            title: item.database,
            href: '/connect/' + item.id + '/tables',
            icon: Database,
            status: status, // Pass status to the nav item
        };
    });

    const tableItems = tables.map((item: any) => {
        return {
            title: item.name + ' (' + item.connection.name + ')',
            href: '/product?conn=' + item.db_connection_id + '&table=' + item.id,
            icon: Table,
        };
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMainDbs items={dbNavItems} onRefresh={checkAllConnections} />
                <NavMainTbs items={tableItems} />
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
