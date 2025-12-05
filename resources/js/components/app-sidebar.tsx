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
import { BookOpen, Folder, LayoutGrid, XIcon, Database, Table } from 'lucide-react';
import AppLogo from './app-logo';
import { NavMainDbs } from './nav-dbs';
import { NavMainTbs } from './nav-tbs';

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
        icon: XIcon,
    },

];

export function AppSidebar() {

    const {db_connections, tables} = usePage().props;

    const dbNavItems = db_connections.map((item) => {
        return {
            title: item.database,
            href: '/connect/' + item.id + '/tables',
            icon: Database,
        }
    })

    console.log(tables)
    const tableItems = tables.map((item) => {
        return {
            title: item.name + '(' + item.connection.name + ')',
            href: '/product?conn=' + item.db_connection_id + '&table=' + item.id,
            icon: Table,
        }
    })


    console.log(tables)

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
                <NavMainDbs items={dbNavItems} />
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
