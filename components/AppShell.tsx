import { Sidebar } from './Sidebar';
export function AppShell({children}:{children:React.ReactNode}){return <div className="shell"><Sidebar/><main className="main">{children}</main></div>}
