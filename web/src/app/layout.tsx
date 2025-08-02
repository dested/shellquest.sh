import {Link, Outlet} from 'react-router-dom';
import {Assets} from '@/assets/assets';
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import {SiteHeader} from '@/components/site-header';

export function Layout() {
  return (
      <Outlet />

  );
}
