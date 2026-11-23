import type { Metadata } from 'next';
import '@/styles/admin.tailwind.css';

export const metadata: Metadata = {
  title: { default: 'Dashboard · Ehans Mart Admin', template: '%s · Ehans Mart Admin' },
  robots: { index: false, follow: false },
};

/** Before first paint: restore the saved theme and sidebar state (glowy admin layout). */
const RESTORE_UI = `try{var r=document.documentElement;if(localStorage.getItem('admin.sidebar')==='collapsed')r.classList.add('sidebar-collapsed');if(localStorage.getItem('admin.theme')==='dark')r.classList.add('dark');r.classList.add('h-full');document.body.classList.add('h-full')}catch(e){}`;

/** /admin: Tailwind admin styles (the storefront CSS is not loaded here). */
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: RESTORE_UI }} />
      {children}
    </>
  );
}
