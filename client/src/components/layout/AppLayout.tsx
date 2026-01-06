import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppLayout({ children, title, subtitle, action }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav title={title} subtitle={subtitle} action={action} />
        <main className="flex-1 p-4 md:p-6 overflow-auto w-full max-w-[100vw]">
          {children}
        </main>
      </div>
    </div>
  );
}
