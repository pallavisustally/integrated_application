import '../scope1/scope1-globals.css'
import './scope2-globals.css'

export default function Scope2Layout({ children }: { children: React.ReactNode }) {
  return <div className="scope2-calculator-root">{children}</div>
}
