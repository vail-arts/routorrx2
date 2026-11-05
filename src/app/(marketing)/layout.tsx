import {StudioOpening} from '@/components/StudioMotion';import StudioDock from '@/components/StudioDock';
import Footer from '@/components/Footer';import PillNav from '@/components/PillNav';
export default function MarketingLayout({children}:{children:React.ReactNode}){return <><StudioOpening/><PillNav/><StudioDock/><main id="main">{children}</main><Footer/></>}
